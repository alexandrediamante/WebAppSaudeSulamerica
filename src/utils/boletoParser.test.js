import { parseBoletoFromText, calculateConfidence } from "./boletoParser.js";

// Texto OCR do boleto Santander SulAmérica fornecido pelo usuário
const sampleOcrText = `
03391152200001497229807448800042341070250101
BENEFICIÁRIO : SUL AMERICA COMPANHIA DE SEGUR
Rua Beatriz Larragoiti Lucas, 121, Cidade Nova 20211-903 - Rio de Janeiro - RJ
CNPJ/CPF: 01.685.053/0001-56
Data de Vencimento: 29/07/2026
Valor Cobrado: 1.497,22
Agência / Código do Beneficiário: 3075-9/8074488
Nosso Número: 423410702-5

Santander | 033-7 | 03399.80740 48800.042342 10702.501015 1 15220000149722
Local de Pagamento: PAGÁVEL EM QUALQUER BANCO DO SISTEMA DE COMPENSAÇÃO.
Vencimento: 29/07/2026
Beneficiário: SUL AMERICA COMPANHIA DE SEGUR
CNPJ/CPF: 01.685.053/0001-56
Agência / Código do Beneficiário: 3075-9/8074488
Data do Documento: 29/07/2026
Nº do Documento: 000000019933 00000
Espécie Doc: DM Aceite: N Data de Processamento: 29/07/2026 Nosso Número: 423410702-5
Uso do Banco Carteira: RCR Espécie Moeda: R$ Quantidade Moeda Valor Moeda
(=) Valor do Documento: 1.497,22
Instruções: Este boleto corresponde à(s) parcela(s) 1 Da Apólice 000000019933 Endosso 000000294983300 Sistema: MFT Lançamento: MFT000029315993 Proposta: 036197341
Pagador: ETYMOS SOLUCOES EM SUSTENTABIL
CPF/CNPJ: 45.157.081/0001-76
AVENIDA MINISTRO VICTOR KONDER 200 88301-700 - ITAJAI SC
FICHA DE COMPENSAÇÃO
`;

console.log("=== TESTANDO PARSER DE BOLETO ===");
const parsed = parseBoletoFromText(sampleOcrText);
console.log("Resultado da extração:", JSON.stringify(parsed, null, 2));

const confidence = calculateConfidence(parsed);
console.log("Nível de Confiança:", confidence);

if (parsed.valorCobrado === "1.497,22" && parsed.vencimento === "2026-07-29" && confidence >= 0.5) {
  console.log("✅ TESTE PASSOU COM SUCESSO!");
} else {
  console.error("❌ TESTE FALHOU!");
  process.exit(1);
}
