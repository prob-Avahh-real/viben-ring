import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  path.join(root, 'www'),
  path.join(root, 'android/app/src/main/assets/public'),
];

for (const dest of targets) {
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(path.join(root, 'index.html'), path.join(dest, 'index.html'));
  fs.copyFileSync(path.join(root, 'wearable-input.js'), path.join(dest, 'wearable-input.js'));
  fs.cpSync(path.join(root, 'src'), path.join(dest, 'src'), { recursive: true });
}
