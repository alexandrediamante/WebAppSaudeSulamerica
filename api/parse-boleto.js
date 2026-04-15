export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  if (!MISTRAL_API_KEY) {
    return res.status(500).json({ error: "MISTRAL_API_KEY não configurada" });
  }

  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "PDF base64 é obrigatório" });
    }

    // Step 1: OCR do PDF via Mistral OCR API
    const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-2512",
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${pdfBase64}`,
        },
        table_format: "html",
        include_image_base64: false,
      }),
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error("Mistral OCR error:", errorText);
      throw new Error(`Erro na API OCR: ${ocrResponse.status}`);
    }

    const ocrData = await ocrResponse.json();

    // Concatenar markdown de todas as páginas
    const fullMarkdown = ocrData.pages.map((p) => p.markdown).join("\n\n");

    // Step 2: Extrair campos estruturados via Chat
    const chatResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            {
              role: "user",
              content: `Você é um especialista em boletos bancários brasileiros.

Extraia os seguintes campos do boleto abaixo e retorne APENAS um JSON válido (sem markdown, sem \`\`\`):

{
  "valorCobrado": "valor em formato brasileiro ex: 1.477,06",
  "vencimento": "data no formato YYYY-MM-DD",
  "codigoBarras": "código de barras numérico completo (44+ dígitos)",
  "numeroDocumento": "número do documento",
  "nossoNumero": "nosso número",
  "beneficiario": "nome do beneficiário/cedente (quem recebe)",
  "pagador": "nome do pagador/sacado (quem paga)"
}

Se um campo não for encontrado, use string vazia "".
Para o valor, mantenha o formato brasileiro com vírgula decimal.
Para a data de vencimento, converta para formato YYYY-MM-DD.

Conteúdo OCR do boleto:
${fullMarkdown}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      },
    );

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Mistral Chat error:", errorText);
      throw new Error(`Erro na extração: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const extractedFields = JSON.parse(chatData.choices[0].message.content);

    return res.status(200).json(extractedFields);
  } catch (error) {
    console.error("Parse boleto error:", error);
    return res.status(500).json({
      error: error.message || "Erro ao processar boleto",
    });
  }
}
