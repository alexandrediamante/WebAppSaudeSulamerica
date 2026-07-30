/**
 * Teste E2E — Conecta ao Chrome já aberto via CDP (porta 9222)
 * e testa upload do boleto PDF sem precisar de login
 */
import { chromium } from "playwright";
import { existsSync } from "fs";

const PDF_PATH = "C:/Users/alexandre/Downloads/Contas Sulamerica/conta sulamerica ref. 07-2026.pdf";
const APP_URL = "http://localhost:8080";
const CDP_URL = "http://localhost:9222";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTest() {
  console.log("🚀 Conectando ao Chrome via CDP em", CDP_URL);

  if (!existsSync(PDF_PATH)) {
    console.error("❌ PDF não encontrado:", PDF_PATH);
    process.exit(1);
  }

  // Conectar ao Chrome já aberto com --remote-debugging-port=9222
  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  console.log("📋 Contextos:", contexts.length);

  let page;

  // Pegar o contexto padrão (usuário já autenticado)
  const context = contexts[0] || await browser.newContext();
  const pages = context.pages();
  console.log("📋 Abas abertas:", pages.length);
  pages.forEach((p, i) => console.log(`   Aba ${i}: ${p.url()}`));

  // Procurar aba com localhost:8080 ou criar nova
  page = pages.find(p => p.url().includes("localhost:8080"));
  if (!page) {
    console.log("📍 Criando nova aba em", APP_URL);
    page = await context.newPage();
    await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  } else {
    console.log("📍 Usando aba existente:", page.url());
    // Recarregar para garantir estado limpo
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  await sleep(3000);

  const logs = [];
  const mjsRequests = [];

  page.on("console", (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    logs.push(text);
    if (
      text.includes("[pdfToImage]") ||
      text.includes("[useBoleto]") ||
      text.includes("ERROR") ||
      text.includes("worker") ||
      text.includes("Boleto") ||
      text.includes("PDF")
    ) {
      console.log("BROWSER:", text);
    }
  });

  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (url.includes(".mjs")) {
      try {
        const name = url.split("/").pop();
        const entry = `MJS [${status}] ${name}`;
        mjsRequests.push(entry);
        console.log("📦", entry);
      } catch (e) { /* ignorar */ }
    }
    if (status >= 400 && !url.endsWith(".svg") && !url.includes("favicon")) {
      console.log(`⚠️  HTTP ${status}: ${url.split("?")[0]}`);
    }
  });

  try {
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 400));
    console.log("📄 Estado da página:\n", pageText);

    const isLogin = pageText.includes("Entrar com Google");
    const hasFileInput = await page.evaluate(() => !!document.querySelector("input[type='file']"));

    if (isLogin) {
      console.log("🔐 Necessário login — aguardando 60s para login manual...");
      await sleep(60000);
    }

    const fileInputExists = await page.evaluate(() => !!document.querySelector("input[type='file']"));
    console.log("📁 Input file:", fileInputExists);

    if (!fileInputExists) {
      const text = await page.evaluate(() => document.body.innerText.substring(0, 600));
      console.log("📄 Página atual:\n", text);
      throw new Error("Input file não encontrado — usuário não autenticado?");
    }

    // Upload do arquivo
    const fileInput = await page.$("input[type='file']");
    console.log("✅ Fazendo upload do PDF...");
    await fileInput.setInputFiles(PDF_PATH);
    console.log("📂 Upload enviado! Aguardando extração PDF.js...");

    // Aguardar resultado
    let success = false;
    for (let i = 0; i < 25; i++) {
      await sleep(1000);
      const result = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasSuccess: text.includes("1.497") || text.includes("1497") || text.includes("Boleto Processado"),
          hasError: text.includes("Erro no Processamento") || text.includes("Não foi possível"),
          snippet: text.substring(0, 2000),
        };
      });

      if (result.hasSuccess) {
        success = true;
        console.log(`\n✅✅✅ SUCESSO em ${i + 1}s!`);
        break;
      }
      if (result.hasError && i > 3) {
        console.log(`\n❌ ERRO em ${i + 1}s`);
        console.log(result.snippet.substring(0, 500));
        break;
      }
      process.stdout.write(`${i + 1}s `);
    }
    console.log("");

    const finalText = await page.evaluate(() => document.body.innerText);
    console.log("\n📄 RESULTADO FINAL:\n", finalText.substring(0, 3000));

    console.log("\n📦 REQUISIÇÕES MJS:");
    mjsRequests.forEach(r => console.log(" ", r));

    console.log("\n📋 LOGS RELEVANTES DO BROWSER:");
    const relevant = logs.filter(l =>
      l.includes("[pdfToImage]") || l.includes("[useBoleto]") ||
      l.includes("ERROR") || l.includes("worker") || l.includes("PDF")
    );
    relevant.forEach(l => console.log(" ", l));

    if (relevant.length === 0) {
      console.log("  (nenhum log relevante — pode ser que o código antigo ainda está em cache)");
      console.log("\n📋 TODOS OS LOGS:");
      logs.slice(0, 30).forEach(l => console.log(" ", l));
    }

  } catch (err) {
    console.error("❌ Erro:", err.message);
  } finally {
    await browser.close();
    console.log("✅ Teste finalizado.");
  }
}

runTest().catch(console.error);
