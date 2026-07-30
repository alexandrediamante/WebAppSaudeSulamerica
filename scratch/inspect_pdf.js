import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function inspectPdf() {
  const filePath = "C:\\Users\\alexandre\\Downloads\\Contas Sulamerica\\conta sulamerica ref. 07-2026.pdf";
  console.log("Lendo arquivo:", filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error("Arquivo NÃO encontrado no caminho:", filePath);
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(dataBuffer);
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    console.log("Número de páginas no PDF:", pdf.numPages);

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      console.log(`--- PÁGINA ${i} --- (itens de texto: ${textContent.items.length})`);
      const pageText = textContent.items.map((item) => item.str).join(" ");
      console.log("Texto da página:", pageText);
      fullText += pageText + "\n";
    }

    console.log("\n=== TEXTO COMPLETO EXTRAÍDO ===");
    console.log(fullText);

  } catch (err) {
    console.error("Erro ao processar PDF com pdfjsLib:", err);
  }
}

inspectPdf();
