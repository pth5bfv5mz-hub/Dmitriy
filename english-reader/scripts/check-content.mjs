// Проверка встроенных текстов: объём, структура, покрытие словарём.
// Запуск: npm test
import { BUILTIN_TEXTS } from '../content/index.js';
import { lookupWord } from '../src/lib/dictionary.js';

const FUNCTION_WORDS = new Set(
  `a an the and or but so if then than that this these those there here i you he she it we they
   me him her us them my your his its our their is am are was were be been being do does did doing
   done have has had having will would shall should can could may might must of in on at to from
   by for with without into onto over under about after before between through during against
   above below up down out off again once not no nor as too very just only also even still yet
   what which who whom whose when where why how all any both each few more most other some such
   own same s t d m ll re ve`
    .split(/\s+/)
    .filter(Boolean),
);

let failures = 0;
const fail = (title, message) => {
  console.log(`✗ ${title}: ${message}`);
  failures += 1;
};

const seenIds = new Set();

for (const text of BUILTIN_TEXTS) {
  const plain = text.paragraphs.join(' ').replace(/\*\*/g, '');
  const wordCount = plain.split(/\s+/).filter(Boolean).length;

  if (seenIds.has(text.id)) fail(text.title, `повторяющийся id ${text.id}`);
  seenIds.add(text.id);

  if (wordCount < 290 || wordCount > 400) fail(text.title, `объём ${wordCount} слов`);
  if (text.paragraphs.length < 4 || text.paragraphs.length > 6) {
    fail(text.title, `абзацев ${text.paragraphs.length}`);
  }
  if ((text.paragraphs.join('').match(/\*\*/g) ?? []).length % 2 !== 0) {
    fail(text.title, 'непарные ** в выделениях');
  }
  if (text.questions.length !== 4) fail(text.title, `вопросов ${text.questions.length}`);

  for (const question of text.questions) {
    if (question.options.length !== 4) fail(text.title, `вариантов ${question.options.length}`);
    if (!(question.correctIndex >= 0 && question.correctIndex < question.options.length)) {
      fail(text.title, 'неверный номер правильного ответа');
    }
    if (!question.explanation) fail(text.title, 'вопрос без объяснения');
  }

  if (!text.keyPoints?.length) fail(text.title, 'нет ключевых мыслей');
  if (!text.modelRetelling) fail(text.title, 'нет образца пересказа');
  if (!text.discussion?.length) fail(text.title, 'нет вопросов для разговора');

  // Сколько значимых слов текста находится в словаре
  // Имена собственные (с большой буквы не в начале предложения) не переводим.
  const properNouns = new Set(
    (plain.match(/(?<![.!?]\s|^)\b[A-Z][a-z]+/g) ?? []).map((word) => word.toLowerCase()),
  );
  const words = [...new Set(plain.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g) ?? [])].filter(
    (word) => word.length > 1 && !FUNCTION_WORDS.has(word) && !properNouns.has(word),
  );
  const missing = words.filter((word) => !lookupWord(text.dictionary, word));
  const coverage = Math.round(((words.length - missing.length) / words.length) * 100);

  if (coverage < 90) {
    fail(
      text.title,
      `словарь покрывает ${coverage}% слов, не хватает: ${missing.slice(0, 14).join(', ')}`,
    );
  } else {
    console.log(`✓ ${text.title.padEnd(30)} ${String(wordCount).padStart(3)} слов · словарь ${coverage}%`);
  }
}

console.log(failures ? `\nПроблем: ${failures}` : `\nВсе ${BUILTIN_TEXTS.length} текстов в порядке.`);
process.exit(failures ? 1 : 0);
