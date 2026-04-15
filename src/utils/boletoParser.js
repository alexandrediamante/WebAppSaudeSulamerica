/**
 * Parser de boletos brasileiros a partir de texto OCR
 * Extrai campos estruturados usando regex patterns
 */

// Extrair valor monetário do texto
function extractValor(text) {
  // Normalizar texto: remover múltiplos espaços e quebras de linha
  const normalizedText = text.replace(/\s+/g, " ");

  // Padrões para valor em ordem de prioridade (mais específicos primeiro)
  const patterns = [
    // (=) Valor do Documento ou Valor do Documento
    /(?:\(?=\)?\s*)?VALOR\s*DO\s*DOCUMENTO[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    // Valor Cobrado
    /VALOR\s*COBRADO[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    // Valor a Pagar / Total a Pagar
    /(?:VALOR\s*A\s*PAGAR|TOTAL\s*A\s*PAGAR)[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    // Total
    /TOTAL[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
    // Valor com R$ prefixo (formato mais comum)
    /R\$\s*([\d.]*\d+,\d{2})/,
    // Valor após label genérico
    /(?:VALOR|IMPORTE|AMOUNT)[\s:]*R?\$?\s*([\d.]*\d+,\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: procurar todos os valores monetários brasileiros no texto
  // Padrão: número com vírgula decimal opcional e 2 casas decimais
  const valuePattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  const allValues = [...normalizedText.matchAll(valuePattern)].map((m) => m[1]);

  if (allValues.length > 0) {
    // Converter para números e filtrar valores razoáveis (entre 10 e 100.000)
    const numericValues = allValues
      .map((v) => ({
        original: v,
        numeric: parseFloat(v.replace(/\./g, "").replace(",", ".")),
      }))
      .filter((item) => item.numeric > 10 && item.numeric < 100000);

    if (numericValues.length > 0) {
      // Retornar o maior valor (geralmente é o total do boleto)
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
      const numDay = parseInt(day);
      const numMonth = parseInt(month);
      const numYear = parseInt(year);

      if (
        numDay >= 1 &&
        numDay <= 31 &&
        numMonth >= 1 &&
        numMonth <= 12 &&
        numYear >= 2020 &&
        numYear <= 2030
      ) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
  }
  return "";
}

// Extrair código de barras (44 dígitos) ou linha digitável
function extractCodigoBarras(text) {
  // Código de barras: 44 dígitos contínuos
  const barcode44 = text.match(/\b(\d{44,48})\b/);
  if (barcode44) return barcode44[1].substring(0, 44);

  // Linha digitável: formato XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXX
  const linhaDigitavel = text.match(
    /(\d{5}\.?\d{5}\s*\d{5}\.?\d{6}\s*\d{5}\.?\d{6}\s*\d\s*\d{14})/,
  );
  if (linhaDigitavel) return linhaDigitavel[1].replace(/[\s.]/g, "");

  return "";
}

// Extrair número do documento
function extractNumeroDocumento(text) {
  const match = text.match(
    /(?:N[°º]?\s*(?:DO\s*)?DOCUMENTO|DOC\.?)[:\s]*([A-Z0-9\-\/]+)/i,
  );
  return match ? match[1].trim() : "";
}

// Extrair nosso número
function extractNossoNumero(text) {
  const match = text.match(/(?:NOSSO\s*N[°º]?(?:MERO)?)[:\s]*([0-9\-\/\s]+)/i);
  return match ? match[1].trim().replace(/\s+/g, "") : "";
}

// Extrair beneficiário
function extractBeneficiario(text) {
  const patterns = [
    /(?:BENEFICI[AÁ]RIO|CEDENTE)[:\s]*([A-Z][A-Z0-9\s\.\/\-]{5,60})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().substring(0, 60);
  }
  return "";
}

// Extrair pagador
function extractPagador(text) {
  const patterns = [/(?:PAGADOR|SACADO)[:\s]*([A-Z][A-Z0-9\s\.\/\-]{5,60})/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().substring(0, 60);
  }
  return "";
}

/**
 * Função principal: parseia texto OCR e retorna dados estruturados do boleto
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
  let total = 5;

  if (parsed.valorCobrado) score += 1;
  if (parsed.vencimento) score += 1;
  if (parsed.codigoBarras && parsed.codigoBarras.length >= 44) score += 1;
  if (parsed.beneficiario) score += 1;
  if (parsed.pagador) score += 1;

  return score / total;
}
