import { readFileSync } from "fs";
import { pathToFileURL } from "url";

// USAR build legacy para Node.js (sem DOMMatrix, sem Canvas)
const pdfJsPath = pathToFileURL("./node_modules/pdfjs-dist/legacy/build/pdf.mjs").href;
const pdfPath = "C:/Users/alexandre/Downloads/Contas Sulamerica/conta sulamerica ref. 07-2026.pdf";

async function run() {
  try {
    const pdfjsLib = await import(pdfJsPath);
    const pdfjs = pdfjsLib.default || pdfjsLib;

    if (pdfjs.GlobalWorkerOptions) {
      // PDF.js v5 exige workerSrc mesmo com disableWorker
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL("./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs").href;
    }
    console.log("pdfjs versao:", pdfjs.version);

    const buf = readFileSync(pdfPath);
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buf),
      disableWorker: true,
      isEvalSupported: false,
      useWorkerFetch: false,
    });

    const pdf = await loadingTask.promise;
    console.log("Paginas:", pdf.numPages);

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const tc = await pg.getTextContent();
      const pageText = tc.items.map(x => x.str).join(" ");
      text += pageText + "\n";
      console.log("Pagina", i, "chars:", pageText.length);
    }

    console.log("\nTEXTO (primeiros 600):\n" + text.substring(0, 600));
    const vals = text.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/g);
    console.log("\nValores:", vals);
    const dates = text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/g);
    console.log("Datas:", dates);
  } catch (err) {
    console.error("ERRO:", err.message);
    console.error(err.stack);
  }
}

run();
