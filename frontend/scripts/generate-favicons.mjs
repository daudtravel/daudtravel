// One-off generator: creates favicon set in public/ from the brand logo.
// Run from frontend/: node scripts/generate-favicons.mjs
import sharp from "sharp";
import { writeFile } from "fs/promises";
import { join } from "path";

const SRC = join(process.cwd(), "public", "images", "Logo.png");
const OUT = join(process.cwd(), "public");

async function renderPng(size) {
  return sharp(SRC)
    .trim()
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

// ICO container with PNG-compressed entries (valid since Windows Vista).
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;

  entries.forEach(({ size, buffer }, i) => {
    const base = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, base); // width
    dir.writeUInt8(size >= 256 ? 0 : size, base + 1); // height
    dir.writeUInt8(0, base + 2); // palette
    dir.writeUInt8(0, base + 3); // reserved
    dir.writeUInt16LE(1, base + 4); // planes
    dir.writeUInt16LE(32, base + 6); // bit depth
    dir.writeUInt32LE(buffer.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += buffer.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buffer)]);
}

const [png16, png32, png48, png180] = await Promise.all(
  [16, 32, 48, 180].map(renderPng)
);

await writeFile(join(OUT, "favicon-16x16.png"), png16);
await writeFile(join(OUT, "favicon-32x32.png"), png32);
await writeFile(join(OUT, "apple-touch-icon.png"), png180);
await writeFile(
  join(OUT, "favicon.ico"),
  buildIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ])
);

console.log("favicons written to public/");
