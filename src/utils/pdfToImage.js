import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// PDF.js v5: workerSrc DEVE ser definido mesmo com disableWorker
// O Vite garante que pdfWorkerUrl é a URL correta do asset empacotado
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extrai texto nativo embutido do PDF
 * @param {File} pdfFile - Arquivo PDF
 * @returns {Promise<string>} Texto extraído
 */
export async function extractTextFromPdf(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log("[pdfToImage] extractTextFromPdf: iniciando, bytes =", arrayBuffer.byteLength);

    // Tentar com worker normal primeiro
    // Se o Nginx servir o .mjs com Content-Type correto, funciona normalmente
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
    });

    const pdf = await loadingTask.promise;
    console.log("[pdfToImage] PDF carregado, páginas =", pdf.numPages);

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");
      fullText += pageText + "\n";
      console.log(`[pdfToImage] Página ${i}: ${pageText.length} chars`);
    }

    console.log("[pdfToImage] Total extraído:", fullText.length, "chars");
    console.log("[pdfToImage] Amostra:", fullText.substring(0, 200));
    return fullText;
  } catch (error) {
    console.error("[pdfToImage] ERRO ao extrair texto:", error);
    return "";
  }
}

/**
 * Converte PDF em array de imagens JPEG (data URLs) para OCR
 * @param {File} pdfFile - Arquivo PDF
 * @param {number} scale - Escala de renderização
 * @returns {Promise<string[]>}
 */
export async function pdfToImages(pdfFile, scale = 2) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      images.push(canvas.toDataURL("image/jpeg", 0.9));

      // Liberar memória
      canvas.width = 0;
      canvas.height = 0;
    }

    return images;
  } catch (error) {
    console.error("[pdfToImage] ERRO em pdfToImages:", error);
    return [];
  }
}
