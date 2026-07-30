/**
 * Parser de boletos brasileiros a partir de texto (Nativo PDF ou OCR)
 * Extrai campos estruturados usando regex avançado
 */

// Extrair valor monetário do texto
function extractValor(text) {
  const normalizedText = text.replace(/\s+/g, " ");

  // Padrões para valor em ordem de prioridade (mais específicos primeiro)
  const patterns = [
    /(?:\(?=\)?\s*)?VALOR\s*DO\s*DOCUMENTO[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    /VALOR\s*COBRADO[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    /(?:VALOR\s*A\s*PAGAR|TOTAL\s*A\s*PAGAR)[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    /TOTAL[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    /R\$\s*([\d.]*\d+,\d{2})/,
    /(?:VALOR|IMPORTE|AMOUNT)[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback: procurar todos os valores monetários brasileiros no texto
  const valuePattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  const allValues = [...normalizedText.matchAll(valuePattern)].map((m) => m[1]);

  if (allValues.length > 0) {
    const numericValues = allValues
      .map((v) => ({
        original: v,
        numeric: parseFloat(v.replace(/\./g, "").replace(",", ".")),
      }))
      .filter((item) => item.numeric > 10 && item.numeric < 500000);

    if (numericValues.length > 0) {
      const maxItem = numericValues.reduce((max, item) =>
        item.numeric > max.numeric ? item : max,
      );
      return maxItem.original;
    }
  }

  return "";
}

// Extrair data de vencimento
function extractVencimento(text) {
  const patterns = [
    /(?:VENCIMENTO|VENC\.?|DATA\s*DE\s*VENCIMENTO)[:\s]*(\d{2})[\/-](\d{2})[\/-](\d{4})/i,
    /(\d{2})[\/-](\d{2})[\/-](\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const [, day, month, year] = match;
      const numDay = parseInt(day, 10);
      const numMonth = parseInt(month, 10);
      const numYear = parseInt(year, 10);

      if (
        numDay >= 1 &&
        numDay <= 31 &&
        numMonth >= 1 &&
        numMonth <= 12 &&
        numYear >= 2020 &&
        numYear <= 2035
      ) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
  }
  return "";
}

// Extrair código de barras (44 dígitos) ou linha digitável (47 ou 48 dígitos)
function extractCodigoBarras(text) {
  const cleanText = text.replace(/[\r\n]+/g, " ");

  // Linha digitável formatada de 47 dígitos (ex: 03399.80740 48800.042342 10702.501015 1 15220000149722)
  const linhaDigitavelFormated = cleanText.match(
    /\b(\d{5}[\.\s]?\d{5}\s*\d{5}[\.\s]?\d{6}\s*\d{5}[\.\s]?\d{6}\s*\d\s*\d{14})\b/,
  );
  if (linhaDigitavelFormated) {
    return linhaDigitavelFormated[1].replace(/[\s.]/g, "");
  }

  // Linha digitável contínua de 47 dígitos (Boleto Bancário)
  const digits47 = cleanText.match(/\b(\d{47})\b/);
  if (digits47) return digits47[1];

  // Linha digitável contínua de 48 dígitos (Concessionária)
  const digits48 = cleanText.match(/\b(\d{48})\b/);
  if (digits48) return digits48[1];

  // Código de barras contínuo de 44 dígitos
  const digits44 = cleanText.match(/\b(\d{44})\b/);
  if (digits44) return digits44[1];

  return "";
}

// Extrair número do documento
function extractNumeroDocumento(text) {
  const match = text.match(
    /(?:N[°º]?\s*(?:DO\s*)?DOCUMENTO|DOC\.?)[:\s]*([0-9A-Z\-\/]+(?:\s+[0-9A-Z\-\/]+)?)/i,
  );
  return match ? match[1].split(/[\r\n]+/)[0].trim() : "";
}

// Extrair nosso número
function extractNossoNumero(text) {
  const match = text.match(/(?:NOSSO\s*N[°º]?(?:MERO)?)[:\s]*([0-9\-\/\s]+)/i);
  return match ? match[1].split(/[\r\n]+/)[0].trim().replace(/\s+/g, "") : "";
}

// Extrair beneficiário
function extractBeneficiario(text) {
  if (/SUL\s*AMERICA/i.test(text)) {
    const sulAmericaMatch = text.match(
      /(SUL\s*AMERICA[A-Z0-9\s\.\/\-]{0,40})/i,
    );
    if (sulAmericaMatch) return sulAmericaMatch[1].split(/[\r\n]+/)[0].trim();
  }

  const patterns = [
    /(?:BENEFICI[AÁ]RIO|CEDENTE)[\s:]*[\r\n]*([A-Z0-9\s\.\/\-]{5,60})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].split(/[\r\n]+/)[0].trim().substring(0, 60);
  }
  return "";
}

// Extrair pagador
function extractPagador(text) {
  if (/ETYMOS/i.test(text)) {
    const etymosMatch = text.match(/(ETYMOS[A-Z0-9\s\.\/\-]{0,40})/i);
    if (etymosMatch) return etymosMatch[1].split(/[\r\n]+/)[0].trim();
  }

  const patterns = [
    /(?:PAGADOR|SACADO)[\s:]*[\r\n]*([A-Z0-9\s\.\/\-]{5,60})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].split(/[\r\n]+/)[0].trim().substring(0, 60);
  }
  return "";
}

/**
 * Função principal: parseia texto OCR ou nativo do PDF e retorna dados estruturados
 */
export function parseBoletoFromText(text) {
  const valorStr = extractValor(text);
  const vencimento = extractVencimento(text);

  let mesReferencia = "";
  if (vencimento) {
    const parts = vencimento.split("-");
    if (parts.length >= 2) {
      mesReferencia = `${parts[0]}-${parts[1]}`;
    }
  }

  return {
    valorCobrado: valorStr,
    vencimento,
    mesReferencia,
    codigoBarras: extractCodigoBarras(text),
    numeroDocumento: extractNumeroDocumento(text),
    nossoNumero: extractNossoNumero(text),
    beneficiario: extractBeneficiario(text),
    pagador: extractPagador(text),
    importadoEm: new Date().toISOString(),
  };
}

/**
 * Calcula score de confiança (0 a 1) baseado nos campos extraídos
 */
export function calculateConfidence(parsed) {
  let score = 0;

  if (parsed.valorCobrado) score += 0.4;
  if (parsed.vencimento) score += 0.3;
  if (parsed.codigoBarras && parsed.codigoBarras.length >= 44) score += 0.2;
  if (parsed.beneficiario || parsed.pagador) score += 0.1;

  return Math.min(score, 1.0);
}
