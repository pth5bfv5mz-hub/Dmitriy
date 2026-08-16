import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'library.json');

const EMPTY_DB = { texts: [] };

// Все записи идут через одну очередь, чтобы параллельные запросы
// не перезаписывали файл поверх друг друга.
let writeQueue = Promise.resolve();

async function readDb() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    return { ...EMPTY_DB, ...db };
  } catch (error) {
    if (error.code === 'ENOENT') return structuredClone(EMPTY_DB);
    throw error;
  }
}

async function writeDb(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE);
}

/** Атомарно прочитать → изменить → записать. mutator получает db и может вернуть значение. */
export function update(mutator) {
  const result = writeQueue.then(async () => {
    const db = await readDb();
    const value = await mutator(db);
    await writeDb(db);
    return value;
  });
  // Очередь не должна ломаться из-за одной неудачной операции.
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function listTexts() {
  const db = await readDb();
  return db.texts
    .map((text) => ({
      id: text.id,
      title: text.title,
      topic: text.topic,
      genre: text.genre ?? null,
      status: text.status,
      lastStep: text.lastStep ?? 'read',
      createdAt: text.createdAt,
      wordCount: text.paragraphs.join(' ').split(/\s+/).filter(Boolean).length,
      lookedUpWords: Object.keys(text.glossary ?? {}).length,
      quiz: text.quizResult ? { correct: text.quizResult.correct, total: text.quizResult.total } : null,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getText(id) {
  const db = await readDb();
  return db.texts.find((text) => text.id === id) ?? null;
}

export async function addText(text) {
  return update((db) => {
    db.texts.push(text);
    return text;
  });
}

export async function removeText(id) {
  return update((db) => {
    const index = db.texts.findIndex((text) => text.id === id);
    if (index === -1) return false;
    db.texts.splice(index, 1);
    return true;
  });
}

/** Изменить один текст по id. mutator получает объект текста. */
export async function updateText(id, mutator) {
  return update(async (db) => {
    const text = db.texts.find((item) => item.id === id);
    if (!text) return null;
    await mutator(text);
    return text;
  });
}
