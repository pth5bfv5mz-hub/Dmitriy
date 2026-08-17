/**
 * Поиск слова во встроенном словаре.
 *
 * Словарь хранит начальные формы, а в тексте слово встречается изменённым:
 * stopped, running, cities, quietly. Поэтому если точного совпадения нет,
 * пробуем отбросить типичные окончания и поискать основу.
 */

/** Неправильные формы: отбрасыванием окончаний их не получить. */
const IRREGULAR = {
  was: 'be', were: 'be', been: 'be', am: 'be', is: 'be', are: 'be',
  said: 'say', went: 'go', gone: 'go', came: 'come', took: 'take', taken: 'take',
  made: 'make', found: 'find', heard: 'hear', held: 'hold', kept: 'keep',
  knew: 'know', known: 'know', left: 'leave', lost: 'lose', met: 'meet',
  paid: 'pay', ran: 'run', saw: 'see', seen: 'see', sat: 'sit', sold: 'sell',
  sent: 'send', slept: 'sleep', spoke: 'speak', spoken: 'speak', spent: 'spend',
  stood: 'stand', stole: 'steal', stolen: 'steal', taught: 'teach', told: 'tell',
  thought: 'think', understood: 'understand', woke: 'wake', woken: 'wake',
  wore: 'wear', worn: 'wear', won: 'win', wrote: 'write', written: 'write',
  bought: 'buy', brought: 'bring', built: 'build', caught: 'catch',
  chose: 'choose', chosen: 'choose', did: 'do', done: 'do', drank: 'drink',
  drove: 'drive', driven: 'drive', ate: 'eat', eaten: 'eat', fell: 'fall',
  fallen: 'fall', felt: 'feel', fought: 'fight', flew: 'fly', flown: 'fly',
  forgot: 'forget', forgotten: 'forget', gave: 'give', given: 'give',
  got: 'get', gotten: 'get', grew: 'grow', grown: 'grow', had: 'have', has: 'have',
  hid: 'hide', hidden: 'hide', laid: 'lay', lay: 'lie', led: 'lead',
  meant: 'mean', rang: 'ring', rose: 'rise', risen: 'rise', shook: 'shake',
  shaken: 'shake', shone: 'shine', shot: 'shoot', shown: 'show', sang: 'sing',
  sung: 'sing', swam: 'swim', threw: 'throw', thrown: 'throw', broke: 'break',
  broken: 'break', began: 'begin', begun: 'begin', blew: 'blow', drew: 'draw',
  drawn: 'draw', fed: 'feed', hung: 'hang', rode: 'ride', ridden: 'ride',
  became: 'become', become: 'become', bit: 'bite', dug: 'dig',
  lent: 'lend', let: 'let', lit: 'light', put: 'put', quit: 'quit', read: 'read',
  sank: 'sink', slid: 'slide', spread: 'spread', stuck: 'stick',
  struck: 'strike', swore: 'swear', swept: 'sweep', tore: 'tear', torn: 'tear',
  woven: 'weave', wept: 'weep', bent: 'bend', burnt: 'burn', dealt: 'deal',
  dreamt: 'dream', learnt: 'learn', leant: 'lean', crept: 'creep',
};

const DOUBLED = /([bdfglmnprt])\1$/;

function candidates(word) {
  const list = [];
  const add = (value) => value.length > 1 && list.push(value);

  if (word.endsWith('ies')) add(`${word.slice(0, -3)}y`);
  if (word.endsWith('es')) add(word.slice(0, -2));
  if (word.endsWith('s')) add(word.slice(0, -1));

  if (word.endsWith('ied')) add(`${word.slice(0, -3)}y`);
  if (word.endsWith('ed')) {
    const stem = word.slice(0, -2);
    add(stem);
    add(word.slice(0, -1));
    if (DOUBLED.test(stem)) add(stem.slice(0, -1));
  }

  if (word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    add(stem);
    add(`${stem}e`);
    if (DOUBLED.test(stem)) add(stem.slice(0, -1));
  }

  if (word.endsWith('ly')) {
    add(word.slice(0, -2));
    // simply -> simple, terribly -> terrible, gently -> gentle
    add(`${word.slice(0, -2)}le`);
    if (word.endsWith('bly')) add(`${word.slice(0, -3)}ble`);
    if (word.endsWith('ily')) add(`${word.slice(0, -3)}y`);
  }

  if (word.endsWith('est')) {
    add(word.slice(0, -3));
    add(`${word.slice(0, -3)}e`);
  }
  if (word.endsWith('er')) {
    add(word.slice(0, -2));
    add(`${word.slice(0, -2)}e`);
  }
  if (word.endsWith('ier')) add(`${word.slice(0, -3)}y`);

  return list;
}

/**
 * Возвращает { translation, lemma, pos, note } или null.
 */
export function lookupWord(dictionary, raw) {
  if (!dictionary) return null;

  const word = String(raw).toLowerCase().replace(/[’']s$/, '');
  const base = IRREGULAR[word];
  const entry = dictionary[word] ?? (base ? dictionary[base] : undefined);
  if (entry) {
    return {
      translation: entry.t,
      lemma: entry.l ?? base ?? word,
      pos: entry.p ?? '',
      note: entry.n ?? '',
    };
  }

  for (const candidate of candidates(word)) {
    const found = dictionary[candidate];
    if (found) {
      return {
        translation: found.t,
        lemma: found.l ?? candidate,
        pos: found.p ?? '',
        note: found.n ?? '',
      };
    }
  }

  return null;
}
