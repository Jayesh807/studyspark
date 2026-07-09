import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");
const svg = fs.readFileSync(svgPath);

const pngOutputs = [
  { file: "public/favicon-48x48.png", size: 48 },
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "src/app/icon.png", size: 48 },
  { file: "src/app/apple-icon.png", size: 180 },
];

for (const { file, size } of pngOutputs) {
  const out = path.join(root, file);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`Created ${file}`);
}

execSync("node scripts/generate-favicon-ico.mjs", { cwd: root, stdio: "inherit" });
