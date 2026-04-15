import { useState, useCallback, useRef, useEffect } from "react";
import {
  parseBoletoFromText,
  calculateConfidence,
} from "../utils/boletoParser";
import { pdfToImages } from "../utils/pdfToImage";

// Lazy load do Tesseract.js
let tesseractPromise = null;
function getTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js");
  }
  return tesseractPromise;
}

export function useBoleto() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [boletoData, setBoletoData] = useState(null);
  const [extractionMethod, setExtractionMethod] = useState(null); // 'tesseract' | 'mistral'
  const [progress, setProgress] = useState(""); // Mensagem de progresso
  const workerRef = useRef(null);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Inicializar Tesseract worker (lazy)
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

  // OCR local com Tesseract.js
  const ocrWithTesseract = useCallback(
    async (file) => {
      setProgress("Convertendo PDF em imagem...");
      const images = await pdfToImages(file);

      const worker = await getWorker();
      let fullText = "";

      for (let i = 0; i < images.length; i++) {
        setProgress(`Processando página ${i + 1} de ${images.length}...`);
        const { data } = await worker.recognize(images[i]);
        fullText += data.text + "\n";
      }

      return fullText;
    },
    [getWorker],
  );

  // Fallback: Mistral API
  const ocrWithMistral = useCallback(async (file) => {
    setProgress("Usando IA avançada para extração...");

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch("/api/parse-boleto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfBase64: base64, fileName: file.name }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erro API: ${response.status}`);
    }

    return await response.json();
  }, []);

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
        // Passo 1: Tentar OCR local com Tesseract
        let parsed = null;
        let confidence = 0;

        try {
          const ocrText = await ocrWithTesseract(file);
          parsed = parseBoletoFromText(ocrText);
          confidence = calculateConfidence(parsed);

          // Converter valor string para número se Tesseract extraiu
          if (parsed.valorCobrado && typeof parsed.valorCobrado === "string") {
            const numVal = parseFloat(
              parsed.valorCobrado.replace(/\./g, "").replace(",", "."),
            );
            if (!isNaN(numVal) && numVal > 0) {
              parsed.valorCobrado = numVal;
            }
          }
        } catch (tesseractError) {
          console.warn(
            "Tesseract OCR falhou, tentando Mistral...",
            tesseractError,
          );
          confidence = 0;
        }

        // Passo 2: Se confiança baixa, fallback para Mistral
        if (confidence < 0.6) {
          setProgress("Confiança baixa, usando IA avançada...");
          try {
            const mistralResult = await ocrWithMistral(file);

            // Parsear resposta Mistral
            let valorNum = mistralResult.valorCobrado || 0;
            if (typeof valorNum === "string") {
              valorNum =
                parseFloat(valorNum.replace(/\./g, "").replace(",", ".")) || 0;
            }

            let vencimento = mistralResult.vencimento || "";
            let mesReferencia = "";
            if (vencimento) {
              // Se veio DD/MM/YYYY, converter para YYYY-MM-DD
              if (vencimento.includes("/")) {
                const parts = vencimento.split("/");
                if (parts.length === 3) {
                  vencimento = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
                }
              }
              const vParts = vencimento.split("-");
              if (vParts.length >= 2) {
                mesReferencia = `${vParts[0]}-${vParts[1]}`;
              }
            }

            parsed = {
              valorCobrado: valorNum,
              vencimento,
              mesReferencia,
              codigoBarras:
                mistralResult.codigoBarras ||
                mistralResult.codigoDeBarras ||
                "",
              numeroDocumento: mistralResult.numeroDocumento || "",
              nossoNumero: mistralResult.nossoNumero || "",
              beneficiario: mistralResult.beneficiario || "",
              pagador: mistralResult.pagador || "",
              importadoEm: new Date().toISOString(),
            };
            setExtractionMethod("mistral");
          } catch (mistralError) {
            console.error("Mistral API também falhou:", mistralError);
            // Se temos resultado parcial do Tesseract, usar mesmo com baixa confiança
            if (parsed && parsed.valorCobrado) {
              setExtractionMethod("tesseract");
            } else {
              throw new Error(
                "Não foi possível extrair dados do boleto. Tente novamente ou insira os valores manualmente.",
              );
            }
          }
        } else {
          setExtractionMethod("tesseract");
        }

        setProgress("");
        setBoletoData(parsed);
        return parsed;
      } catch (error) {
        console.error("Erro ao processar boleto:", error);
        setUploadError(error.message || "Erro ao processar o boleto.");
        setProgress("");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [ocrWithTesseract, ocrWithMistral],
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
