/**
 * Каталог жанров.
 *
 * craft — подсказка модели о том, как устроен хороший текст этого жанра
 * в короткой форме (200–350 слов). Опирается на приёмы флеш-фикшена:
 * сжатие, один эпизод, конкретная деталь вместо описаний, финал,
 * который заставляет перечитать начало.
 *
 * topics — пул тем для кнопки «случайная тема».
 */
export const GENRES = [
  {
    id: 'motivation',
    imageStyle: 'warm editorial photography, soft daylight, quiet everyday scene',
    label: 'Мотивация',
    emoji: '🌱',
    description: 'Короткое эссе о жизни и привычках — как посты @english.read',
    craft:
      'A short motivational essay: one concrete personal scene, then a quiet insight the reader can apply. ' +
      'Warm and honest, never preachy. No lists of tips, no "5 steps". End on one sentence the reader could repeat to themselves.',
    topics: [
      'starting again after a failure',
      'the first week in a new city',
      'a habit that took a year to build',
      'saying no for the first time',
      'why mornings feel different when you are not in a hurry',
      'the friend you stopped calling',
      'doing something badly on purpose',
    ],
  },
  {
    id: 'life',
    imageStyle: 'candid documentary photography, natural light, ordinary domestic detail',
    label: 'Из жизни',
    emoji: '☕',
    description: 'Бытовая история: переезд, отношения, работа, семья',
    craft:
      'A slice-of-life story about ordinary people. One small event, told through concrete details: objects, weather, ' +
      'what someone said. The meaning stays under the surface — show it, do not explain it.',
    topics: [
      'a neighbour who never says hello',
      'the last dinner before someone moves away',
      'finding an old photo while cleaning',
      'a couple deciding who keeps the cat',
      'a taxi driver with an unexpected story',
      'the first day at a job you did not want',
    ],
  },
  {
    id: 'horror',
    imageStyle: 'moody cinematic film photograph, deep shadows, cold light, unsettling emptiness',
    label: 'Ужастик',
    emoji: '🕯️',
    description: 'Короткий крипи-рассказ с финалом, от которого мурашки',
    craft:
      'A short horror story. Start with something completely normal and let one detail be slightly wrong. ' +
      'Suggest the threat, never fully describe it — the reader\'s imagination does the work. Short sentences at the end. ' +
      'The last line should re-frame an earlier detail so the reader wants to look back. No gore, no cheap jump scares.',
    topics: [
      'a house that is always warmer in one room',
      'a voice on a baby monitor that is not the baby',
      'the neighbour who takes out the rubbish at 3 a.m.',
      'a photo where one person appears twice',
      'a night shift in an empty museum',
      'a message from a number that is your own',
    ],
  },
  {
    id: 'thriller',
    imageStyle: 'tense cinematic still, high contrast, night city light, sense of motion',
    label: 'Триллер',
    emoji: '⏱️',
    description: 'Саспенс: время идёт, что-то вот-вот случится',
    craft:
      'A suspense story. Put a clock on it: something must happen soon, and the character knows it. ' +
      'Keep the reader one step behind the character but one step ahead of the danger. Short paragraphs, rising tension, ' +
      'a final line that lands hard. The danger should be human and plausible.',
    topics: [
      'a car following you home, two turns too many',
      'a locked office and eight minutes before someone returns',
      'a phone call you should not have answered',
      'the wrong suitcase at the airport',
      'a witness who recognises the wrong face',
      'a lift that stops between floors',
    ],
  },
  {
    id: 'mystery',
    imageStyle: 'noir photograph, desk lamp light, rain on glass, muted colours',
    label: 'Детектив',
    emoji: '🔎',
    description: 'Мини-загадка с разгадкой в конце',
    craft:
      'A miniature detective story. Give the reader every clue fairly, hidden in ordinary description. ' +
      'End with the solution in one or two sentences — the kind that makes the reader say "it was there all along". ' +
      'One location, two or three people, one contradiction that gives everything away.',
    topics: [
      'a stolen painting and a witness who remembers too much',
      'a wedding ring found in a hotel drain',
      'why the dog did not bark',
      'a broken window with the glass on the wrong side',
      'an alibi built on a train timetable',
      'a note written by someone who was already gone',
    ],
  },
  {
    id: 'science',
    imageStyle: 'clean scientific illustration, minimal, elegant diagrammatic style',
    label: 'Научпоп',
    emoji: '🔬',
    description: 'Одно любопытное явление или эксперимент — понятным языком',
    craft:
      'A popular-science piece about one real phenomenon or experiment. Open with a question or a surprising fact, ' +
      'explain the mechanism in plain words with a everyday comparison, and close with what it changes about how we see things. ' +
      'Accurate, no invented numbers. If a figure is uncertain, say "about" or "roughly".',
    topics: [
      'why we forget dreams so quickly',
      'how trees warn each other',
      'why time feels faster as you get older',
      'the bacteria that live on your skin',
      'how your brain decides what to notice',
      'why sound travels differently in cold air',
      'the strange physics of a spinning coin',
    ],
  },
  {
    id: 'scifi',
    imageStyle: 'near-future concept art, restrained palette, believable everyday technology',
    label: 'Фантастика',
    emoji: '🛰️',
    description: 'Одна идея «а что если» — близкое будущее',
    craft:
      'A science-fiction story built on one "what if" idea, set in the near future. Do not explain the technology — ' +
      'show people living with it, and let the human problem be the real story. One scene, one change, one consequence.',
    topics: [
      'a service that deletes one memory of your choice',
      'the last human translator',
      'renting your face to an advertising company',
      'a house that files a complaint about its owner',
      'a message arriving 40 years after it was sent',
      'the day everyone could hear their own voice as others hear it',
    ],
  },
  {
    id: 'weird',
    imageStyle: 'surreal photograph, dreamlike but calm, one impossible detail',
    label: 'Странное',
    emoji: '🌀',
    description: 'Магический реализм: обычный мир с одной странностью',
    craft:
      'Magical realism: an ordinary world where exactly one impossible thing is treated as completely normal. ' +
      'Nobody in the story is surprised by it. The strangeness should quietly mean something about the character\'s life.',
    topics: [
      'a man whose shadow leaves for work without him',
      'a town where it rains only on Tuesdays',
      'a woman who receives letters from herself, dated next year',
      'a lost key that always comes back',
      'a mirror that is two seconds late',
    ],
  },
];

export const GENRE_IDS = GENRES.map((genre) => genre.id);

export function getGenre(id) {
  return GENRES.find((genre) => genre.id === id) ?? null;
}

export function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Разрешает запрос пользователя в конкретный жанр и тему.
 * genre === 'surprise' (или пусто) — выбираем жанр сами.
 * topic пустой — берём случайную тему из пула жанра.
 */
export function resolveRequest({ genre, topic }) {
  const wantedGenre = genre && genre !== 'surprise' ? getGenre(genre) : randomItem(GENRES);
  const resolvedGenre = wantedGenre ?? randomItem(GENRES);
  const resolvedTopic = topic?.trim() ? topic.trim() : randomItem(resolvedGenre.topics);
  return { genre: resolvedGenre, topic: resolvedTopic, topicWasRandom: !topic?.trim() };
}
