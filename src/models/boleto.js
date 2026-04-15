// Estrutura de dados de um boleto importado
export const BOLETO_FIELDS = {
  valorCobrado: 0,
  vencimento: "", // formato YYYY-MM-DD
  mesReferencia: "", // formato YYYY-MM (extraído do vencimento)
  codigoBarras: "",
  numeroDocumento: "",
  nossoNumero: "",
  beneficiario: "",
  pagador: "",
  importadoEm: "", // ISO timestamp
};

/**
 * Parseia a resposta da API do Mistral e retorna um objeto boleto estruturado
 */
export function parseBoletoResponse(apiResponse) {
  const data = apiResponse || {};

  // Extrair valor - pode vir como string "1.477,06" ou número
  let valor = data.valorCobrado || data.valor || 0;
  if (typeof valor === "string") {
    // Converte formato brasileiro "1.477,06" para número 1477.06
    valor = parseFloat(valor.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // Extrair vencimento e derivar mês de referência
  const vencimento = data.vencimento || "";
  let mesReferencia = "";
  if (vencimento) {
    // Tenta parsear formatos: DD/MM/YYYY, YYYY-MM-DD
    const parts = vencimento.includes("/")
      ? vencimento.split("/").reverse() // DD/MM/YYYY -> [YYYY, MM, DD]
      : vencimento.split("-"); // YYYY-MM-DD -> [YYYY, MM, DD]
    if (parts.length >= 2) {
      mesReferencia = `${parts[0]}-${parts[1].padStart(2, "0")}`;
    }
  }

  return {
    valorCobrado: valor,
    vencimento,
    mesReferencia,
    codigoBarras: data.codigoBarras || data.codigoDeBarras || "",
    numeroDocumento: data.numeroDocumento || "",
    nossoNumero: data.nossoNumero || "",
    beneficiario: data.beneficiario || "",
    pagador: data.pagador || "",
    importadoEm: new Date().toISOString(),
  };
}
