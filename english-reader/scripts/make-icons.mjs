// Генерация иконок приложения без внешних библиотек.
// Рисуем простую картинку (буквы ER на фоне цвета акцента) прямо в PNG:
// формат несложный, а тянуть зависимость ради четырёх файлов не хочется.
import { deflateSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'public');

const BG = [180, 85, 31]; // --accent
const INK = [255, 253, 249];

/** Точечный рисунок букв 5x7. */
const GLYPHS = {
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
};

function drawLetter(pixels, size, glyph, offsetX, offsetY, scale) {
  glyph.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== '1') return;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const px = offsetX + x * scale + dx;
          const py = offsetY + y * scale + dy;
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          const index = (py * size + px) * 3;
          pixels[index] = INK[0];
          pixels[index + 1] = INK[1];
          pixels[index + 2] = INK[2];
        }
      }
    });
  });
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size) {
  const pixels = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i += 1) {
    pixels[i * 3] = BG[0];
    pixels[i * 3 + 1] = BG[1];
    pixels[i * 3 + 2] = BG[2];
  }

  const scale = Math.max(1, Math.floor(size / 14));
  const textWidth = (5 + 1 + 5) * scale;
  const startX = Math.round((size - textWidth) / 2);
  const startY = Math.round((size - 7 * scale) / 2);
  drawLetter(pixels, size, GLYPHS.E, startX, startY, scale);
  drawLetter(pixels, size, GLYPHS.R, startX + 6 * scale, startY, scale);

  // PNG хранит строки с байтом фильтра в начале каждой
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 3 + 1)] = 0;
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // бит на канал
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(outDir, { recursive: true });
for (const [name, size] of [
  ['icon-180.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  fs.writeFileSync(path.join(outDir, name), png(size));
  console.log('нарисовано', name);
}
