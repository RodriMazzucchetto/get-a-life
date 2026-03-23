/**
 * Os exports "PNG" do design às vezes são JPEG sem alpha (extensão .png enganadora).
 * Converte para PNG com alpha e torna transparente o fundo preto/cinza neutro,
 * preservando o navy (dominância de azul) e o cyan do logo.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Pixel cinzento escuro (fundo) vs cor do logo (maior croma ou azul). */
function shouldBeTransparent(r, g, b) {
  const sum = r + g + b;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const isNeutralDark = chroma < 12 && sum < 42;
  return isNeutralDark;
}

async function processFile(relPath) {
  const inputPath = join(root, relPath);
  const buf = readFileSync(inputPath);
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const w = info.width;
  const h = info.height;
  const c = info.channels;
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, o = 0; i < data.length; i += c, o += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const aIn = c === 4 ? data[i + 3] : 255;
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    const kill = shouldBeTransparent(r, g, b);
    out[o + 3] = kill ? 0 : aIn;
  }
  const png = await sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(inputPath, png);
  const meta = await sharp(png).metadata();
  console.log(relPath, "->", meta.format, "hasAlpha:", meta.hasAlpha, meta.width + "x" + meta.height);
}

const files = [
  "public/branding/taskarchitect-horizontal.png",
  "public/branding/taskarchitect-stacked.png",
  "public/branding/taskarchitect-icon.png",
];

for (const f of files) {
  await processFile(f);
}
