// Script para agregar timestamp a index.html
import fs from 'fs';
import path from 'path';

const timestamp = Date.now();
const indexPath = path.join(process.cwd(), 'index.html');

let html = fs.readFileSync(indexPath, 'utf-8');
html = html.replace(
  /src="\/src\/main\.js\?v=[^"]*"/,
  `src="/src/main.js?v=${timestamp}"`
);
fs.writeFileSync(indexPath, html);

console.log(`✓ Timestamp actualizado: v=${timestamp}`);
