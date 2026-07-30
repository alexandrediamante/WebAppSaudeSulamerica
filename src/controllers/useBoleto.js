import { useState, useCallback, useRef, useEffect } from "react";
import {
  parseBoletoFromText,
  calculateConfidence,
} from "../utils/boletoParser";
import { pdfToImages, extractTextFromPdf } from "../utils/pdfToImage";

// Lazy load do Tesseract.js (apenas se necessário)
let tesseractPromise = null;
function getTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js");
  }
  return tesseractPromise;
}

/**
 * Converte string "1.497,22" para número 1497.22
 */
function valorParaNumero(valorStr) {
  if (typeof valorStr === "number") return valorStr;
  if (!valorStr) return 0;
  const limpo = valorStr.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

export function useBoleto() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [boletoData, setBoletoData] = useState(null);
  const [extractionMethod, setExtractionMethod] = useState(null);
  const [progress, setProgress] = useState("");
  const workerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const getWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    setProgress("Inicializando OCR (primeira vez pode demorar)...");
    const { createWorker } = await getTesseract();
    const worker = await createWorker("por", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(`Reconhecendo texto... ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    workerRef.current = worker;
    return worker;
  }, []);

  const ocrWithTesseract = useCallback(
    async (file) => {
      setProgress("Convertendo PDF em imagem para OCR...");
      const images = await pdfToImages(file);

      if (!images || images.length === 0) {
        throw new Error("Não foi possível converter o PDF em imagem para OCR.");
      }

      const worker = await getWorker();
      let fullText = "";

      for (let i = 0; i < images.length; i++) {
        setProgress(`Processando página ${i + 1} de ${images.length}...`);
        const { data } = await worker.recognize(images[i]);
        fullText += data.text + "\n";
      }

      console.log("[useBoleto] Tesseract OCR resultado:", fullText.substring(0, 300));
      return fullText;
    },
    [getWorker],
  );

  const uploadBoleto = useCallback(
    async (file) => {
      if (!file || file.type !== "application/pdf") {
        setUploadError("Por favor, selecione um arquivo PDF válido.");
        return null;
      }

      setIsUploading(true);
      setUploadError(null);
      setBoletoData(null);
      setExtractionMethod(null);

      try {
        let parsed = null;
        let confidence = 0;
        let methodUsed = "pdf-native";

        // ─────────────────────────────────────────────────────────────
        // PASS 1: Extração nativa de texto do PDF (PDF.js sem worker)
        // ─────────────────────────────────────────────────────────────
        setProgress("Lendo texto nativo do PDF...");
        try {
          const nativeText = await extractTextFromPdf(file);
          console.log("[useBoleto] Texto nativo extraído, length =", nativeText?.length);

          if (nativeText && nativeText.trim().length > 20) {
            const nativeParsed = parseBoletoFromText(nativeText);
            console.log("[useBoleto] parseBoletoFromText resultado:", nativeParsed);

            const valorNum = valorParaNumero(nativeParsed.valorCobrado);
            if (valorNum > 0) {
              nativeParsed.valorCobrado = valorNum;
            }

            const nativeConf = calculateConfidence(nativeParsed);
            console.log("[useBoleto] Confiança nativa:", nativeConf, "| valorCobrado:", nativeParsed.valorCobrado);

            if (nativeConf >= 0.4 || valorNum > 0) {
              parsed = nativeParsed;
              confidence = nativeConf;
              methodUsed = "pdf-native";
              console.log("[useBoleto] ✅ Usando extração nativa do PDF");
            }
          } else {
            console.warn("[useBoleto] ⚠️ Texto nativo insuficiente:", nativeText?.length, "chars");
          }
        } catch (pdfError) {
          console.warn("[useBoleto] ❌ Extração nativa falhou:", pdfError);
        }

        // ─────────────────────────────────────────────────────────────
        // PASS 2: Se confiança < 0.5, tentar Tesseract OCR
        // ─────────────────────────────────────────────────────────────
        if (confidence < 0.5) {
          console.log("[useBoleto] Confiança baixa, tentando Tesseract OCR...");
          try {
            const ocrText = await ocrWithTesseract(file);
            const tesseractParsed = parseBoletoFromText(ocrText);

            const valorNum = valorParaNumero(tesseractParsed.valorCobrado);
            if (valorNum > 0) {
              tesseractParsed.valorCobrado = valorNum;
            }

            const tesseractConf = calculateConfidence(tesseractParsed);
            console.log("[useBoleto] Tesseract confiança:", tesseractConf, "| valor:", tesseractParsed.valorCobrado);

            if (tesseractConf > confidence || valorNum > 0) {
              parsed = tesseractParsed;
              confidence = tesseractConf;
              methodUsed = "tesseract";
              console.log("[useBoleto] ✅ Usando OCR Tesseract");
            }
          } catch (tesseractError) {
            console.warn("[useBoleto] ❌ Tesseract OCR falhou:", tesseractError);
          }
        }

        // ─────────────────────────────────────────────────────────────
        // VALIDAÇÃO FINAL
        // NOTA: Não existe backend /api/parse-boleto (app 100% estático)
        // Se as duas extrações falharem, exibir erro com instrução manual
        // ─────────────────────────────────────────────────────────────
        if (parsed && (parsed.valorCobrado > 0 || parsed.vencimento || parsed.codigoBarras)) {
          setProgress("");
          setBoletoData(parsed);
          setExtractionMethod(methodUsed);
          console.log("[useBoleto] ✅ Boleto processado com sucesso:", parsed);
          return parsed;
        }

        // Sem resultado válido — exibir erro orientado
        console.error("[useBoleto] ❌ Nenhum método extraiu dados válidos do boleto");
        throw new Error(
          "Não foi possível extrair dados do boleto automaticamente. " +
          "Verifique se o PDF é um boleto válido e tente novamente, ou insira os valores manualmente.",
        );
      } catch (error) {
        console.error("[useBoleto] Erro no upload:", error);
        setUploadError(error.message || "Erro ao processar o boleto.");
        setProgress("");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [ocrWithTesseract],
  );

  const clearBoleto = useCallback(() => {
    setBoletoData(null);
    setUploadError(null);
    setExtractionMethod(null);
    setProgress("");
  }, []);

  return {
    isUploading,
    uploadError,
    boletoData,
    uploadBoleto,
    clearBoleto,
    extractionMethod,
    progress,
  };
}
