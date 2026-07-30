import fs from 'fs';
import path from 'path';

const buildPath = 'node_modules/pdfjs-dist/build';
if (fs.existsSync(buildPath)) {
  console.log("Arquivos em pdfjs-dist/build:", fs.readdirSync(buildPath));
} else {
  console.log("Caminho não existe:", buildPath);
}
