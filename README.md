// ============================================================
// Arquivador Automático de Notas Fiscais — HAMA TI
// Google Apps Script
// Autor: Fernando S. De Santana Júnior
// Versão: 1.0
// ============================================================
//
// CONFIGURAÇÃO — ajuste antes de usar:
//   MARCADOR_GMAIL   : nome do marcador/label no Gmail
//   PASTA_RAIZ_ID    : ID da pasta raiz no Google Drive
//   FUSO_HORARIO     : fuso do servidor
//   FORMATOS_ACEITOS : extensões de arquivo aceitas como NF
//
// ESTRUTURA gerada no Drive:
//   📁 Notas Fiscais TI/
//   └── 📁 2026/
//       └── 📁 03 - Março/
//           └── 📁 Fornecedor LTDA/
//               ├── 📄 NF_2026-03-14_Fornecedor_LTDA.pdf
//               └── 📄 NF_2026-03-14_Fornecedor_LTDA.xml
// ============================================================

var CONFIG = {
  MARCADOR_GMAIL:   "Notas Fiscais TI",
  PASTA_RAIZ_ID:    "SEU_ID_AQUI",
  FUSO_HORARIO:     "GMT-3",
  FORMATOS_ACEITOS: ["pdf", "xml", "jpg", "jpeg", "png"],
  MAX_THREADS:      50
};

var MESES = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março",
  "04": "Abril",   "05": "Maio",      "06": "Junho",
  "07": "Julho",   "08": "Agosto",    "09": "Setembro",
  "10": "Outubro", "11": "Novembro",  "12": "Dezembro"
};

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================
function arquivarNotasFiscais() {
  var marcador = GmailApp.getUserLabelByName(CONFIG.MARCADOR_GMAIL);
  if (!marcador) {
    Logger.log("❌ Marcador '" + CONFIG.MARCADOR_GMAIL + "' não encontrado no Gmail.");
    return;
  }

  var pastaRaiz = DriveApp.getFolderById(CONFIG.PASTA_RAIZ_ID);
  var threads   = marcador.getThreads(0, CONFIG.MAX_THREADS);

  Logger.log("📬 Processando " + threads.length + " thread(s)...");

  var totalArquivados = 0;
  var totalErros      = 0;
  var logLinhas       = [];

  for (var i = 0; i < threads.length; i++) {
    var mensagens = threads[i].getMessages();

    for (var j = 0; j < mensagens.length; j++) {
      var msg     = mensagens[j];
      var anexos  = msg.getAttachments();
      var data    = msg.getDate();
      var remetente = extrairNomeRemetente(msg.getFrom());

      // Filtra apenas anexos com formato aceito
      var nfsEncontradas = anexos.filter(function(a) {
        var ext = obterExtensao(a.getName());
        return CONFIG.FORMATOS_ACEITOS.indexOf(ext) !== -1;
      });

      if (nfsEncontradas.length === 0) continue;

      try {
        // Monta estrutura de pastas: Ano > Mês > Fornecedor
        var ano      = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "yyyy");
        var mes      = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "MM");
        var diaMesAno = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "yyyy-MM-dd");
        var nomeMes  = mes + " - " + MESES[mes];

        var pastaAno        = obterOuCriarPasta(pastaRaiz, ano);
        var pastaMes        = obterOuCriarPasta(pastaAno, nomeMes);
        var pastaFornecedor = obterOuCriarPasta(pastaMes, remetente);

        for (var k = 0; k < nfsEncontradas.length; k++) {
          var anexo    = nfsEncontradas[k];
          var nomeBase = "NF_" + diaMesAno + "_" + sanitizarNome(remetente);
          var ext      = obterExtensao(anexo.getName());
          var nomeArq  = nomeBase + (nfsEncontradas.length > 1 ? "_" + (k + 1) : "") + "." + ext;

          // Evita duplicatas
          if (arquivoJaExiste(pastaFornecedor, nomeArq)) {
            Logger.log("⏭️  Já existe: " + nomeArq);
            continue;
          }

          var blob = anexo.copyBlob().setName(nomeArq);
          pastaFornecedor.createFile(blob);

          Logger.log("✅ Arquivado: " + nomeArq);
          logLinhas.push(diaMesAno + " | " + remetente + " | " + nomeArq);
          totalArquivados++;
        }

      } catch (e) {
        Logger.log("❌ Erro ao processar e-mail de '" + remetente + "': " + e.message);
        totalErros++;
      }
    }

    // Arquiva e remove marcador após processar thread
    threads[i].removeLabel(marcador);
    threads[i].moveToArchive();
  }

  // Salva log de execução no Drive
  if (logLinhas.length > 0) {
    salvarLog(pastaRaiz, logLinhas);
  }

  Logger.log("========================================");
  Logger.log("✅ Arquivados : " + totalArquivados);
  Logger.log("❌ Erros      : " + totalErros);
  Logger.log("========================================");
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function obterOuCriarPasta(pai, nome) {
  var iter = pai.getFoldersByName(nome);
  return iter.hasNext() ? iter.next() : pai.createFolder(nome);
}

function arquivoJaExiste(pasta, nomeArquivo) {
  var iter = pasta.getFilesByName(nomeArquivo);
  return iter.hasNext();
}

function extrairNomeRemetente(from) {
  // "Fornecedor LTDA <nf@fornecedor.com.br>" → "Fornecedor LTDA"
  var match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return sanitizarNome(match[1].trim());
  // Sem nome, usa domínio do e-mail
  var emailMatch = from.match(/@([^>]+)/);
  if (emailMatch) return sanitizarNome(emailMatch[1].split(".")[0]);
  return "Desconhecido";
}

function obterExtensao(nomeArquivo) {
  var partes = nomeArquivo.toLowerCase().split(".");
  return partes.length > 1 ? partes[partes.length - 1] : "";
}

function sanitizarNome(nome) {
  return nome.replace(/[\/\\?%*:|"<>]/g, "-").replace(/\s+/g, "_").trim();
}

function salvarLog(pastaRaiz, linhas) {
  var dataHoje  = Utilities.formatDate(new Date(), CONFIG.FUSO_HORARIO, "yyyy-MM-dd_HH-mm");
  var nomeLog   = "log_execucao_" + dataHoje + ".txt";
  var cabecalho = "Data | Fornecedor | Arquivo\n" + "=".repeat(60) + "\n";
  var conteudo  = cabecalho + linhas.join("\n");
  var pastaLogs = obterOuCriarPasta(pastaRaiz, "_logs");
  pastaLogs.createFile(nomeLog, conteudo, MimeType.PLAIN_TEXT);
  Logger.log("📋 Log salvo: " + nomeLog);
}
