import * as pdfjsLib from "pdfjs-dist";

// Setup worker do pdf.js - usando CDN fallback para compatibilidade com Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.269/pdf.worker.min.mjs";
}

/**
 * Converte um arquivo PDF em array de imagens (data URLs)
 * @param {File} pdfFile - Arquivo PDF
 * @param {number} scale - Escala de renderização (2 = alta qualidade)
 * @returns {Promise<string[]>} Array de data URLs (JPEG)
 */
export async function pdfToImages(pdfFile, scale = 2) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

    // Limpar canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  return images;
}
