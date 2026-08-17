/**
 * Сборка сайта для GitHub Pages.
 *
 * У репозитория может быть только один сайт, а приложений в нём два.
 * Поэтому собираем их вместе в папку docs/:
 *
 *   docs/          — тренажёр слов (адрес не меняется, старая ссылка работает)
 *   docs/reader/   — читалка English Reader
 *
 * Тренажёр берётся готовой сборкой из vocab-trainer/docs и просто копируется,
 * его исходники мы не трогаем: он собран с относительными путями и одинаково
 * работает и в корне, и из подпапки.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..');
const repoDir = path.join(appDir, '..');
const docsDir = path.join(repoDir, 'docs');
const trainerBuild = path.join(repoDir, 'vocab-trainer', 'docs');
const readerDir = path.join(docsDir, 'reader');

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

// 1. Чистим docs/ целиком, чтобы не оставалось файлов от прошлых сборок.
fs.rmSync(docsDir, { recursive: true, force: true });
fs.mkdirSync(docsDir, { recursive: true });

// 2. Тренажёр слов — в корень сайта.
if (fs.existsSync(trainerBuild)) {
  fs.cpSync(trainerBuild, docsDir, { recursive: true });
  console.log('скопирован тренажёр слов → docs/');
} else {
  console.warn('⚠ сборка тренажёра не найдена:', trainerBuild);
}

// 3. Читалка — в подпапку reader/.
run('npx', ['vite', 'build', '--outDir', readerDir, '--emptyOutDir'], appDir);

// 4. Jekyll на GitHub Pages пропускает файлы с подчёркиванием — отключаем его.
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

const size = (dir) =>
  fs
    .readdirSync(dir, { recursive: true })
    .filter((name) => fs.statSync(path.join(dir, name)).isFile()).length;

console.log(`\nГотово: docs/ — ${size(docsDir)} файлов`);
console.log('  /          тренажёр слов');
console.log('  /reader/   читалка English Reader');
