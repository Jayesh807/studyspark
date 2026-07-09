import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** Wrap a PNG buffer in a single-image ICO container (supported by Google and modern browsers). */
function createIcoFromPng(pngBuffer, size = 48) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const pngPath = path.join(root, "public", "favicon-48x48.png");
const pngBuffer = fs.readFileSync(pngPath);
const icoBuffer = createIcoFromPng(pngBuffer, 48);

for (const target of [
  path.join(root, "public", "favicon.ico"),
  path.join(root, "src", "app", "favicon.ico"),
]) {
  fs.writeFileSync(target, icoBuffer);
  console.log(`Created ${path.relative(root, target)} (${icoBuffer.length} bytes)`);
}
