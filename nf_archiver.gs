// ============================================================
// Arquivador Automático de Notas Fiscais — HAMA TI
// Google Apps Script
// Autor: Fernando S. De Santana Júnior
// Versão: 2.1
// ============================================================
//
// ESTRUTURA gerada no Drive:
//   📁 Notas Fiscais TI/
//   └── 📁 2026/
//       └── 📁 03 - Março/
//           └── 📁 Executiva/
//               ├── 📄 NF_2026-03-14_Executiva.pdf
//               ├── 📄 NF_2026-03-14_Executiva.xml
//               └── 📁 _anexos/
//                   └── 📄 boleto_2026-03-14_Executiva.pdf
// ============================================================

var CONFIG = {
  MARCADOR_GMAIL:   "Notas Fiscais TI",
  PASTA_RAIZ_ID:    "1gR0txrvWifEMDxBawRRSAHxuCu16gCN7",
  FUSO_HORARIO:     "GMT-3",
  FORMATOS_NF:      ["pdf", "xml"],
  FORMATOS_IMAGEM:  ["jpg", "jpeg", "png"],
  MAX_THREADS:      50
};

// ============================================================
// DICIONÁRIO DE FORNECEDORES
// ============================================================
var FORNECEDORES = {
  // Por e-mail exato
  "digitalfiberadm@gmail.com":    "DigitalFiber",
  "silvia@xlogic.com.br":         "XLogic",
  "microgm@microesoftloc.com.br": "MicroSoft_Loc",

  // Por domínio
  "omie.com.br":           "Omie",
  "executiva.net":         "Executiva",
  "starseguranca.com":     "Star_Seguranca",
  "smedtecnologia.com.br": "SMED_Tecnologia",
  "tld.com.br":            "TLD",
  "xlogic.com.br":         "XLogic",
  "microesoftloc.com.br":  "MicroSoft_Loc"
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

  var totalNFs     = 0;
  var totalAnexos  = 0;
  var totalErros   = 0;
  var logLinhas    = [];

  for (var i = 0; i < threads.length; i++) {
    var mensagens = threads[i].getMessages();

    for (var j = 0; j < mensagens.length; j++) {
      var msg        = mensagens[j];
      var anexos     = msg.getAttachments();
      var data       = msg.getDate();
      var emailFrom  = extrairEmail(msg.getFrom());
      var fornecedor = resolverFornecedor(emailFrom);

      if (anexos.length === 0) continue;

      try {
        var ano      = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "yyyy");
        var mes      = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "MM");
        var diaMesAno = Utilities.formatDate(data, CONFIG.FUSO_HORARIO, "yyyy-MM-dd");
        var nomeMes  = mes + " - " + MESES[mes];

        var pastaAno        = obterOuCriarPasta(pastaRaiz, ano);
        var pastaMes        = obterOuCriarPasta(pastaAno, nomeMes);
        var pastaFornecedor = obterOuCriarPasta(pastaMes, fornecedor);

        // Separa NFs dos demais anexos
        var nfs           = [];
        var outrosAnexos  = [];

        anexos.forEach(function(a) {
          var ext = obterExtensao(a.getName());
          var ehNF = CONFIG.FORMATOS_NF.indexOf(ext) !== -1;
          var ehImagem = CONFIG.FORMATOS_IMAGEM.indexOf(ext) !== -1;
          if (ehNF || ehImagem) {
            nfs.push(a);
          } else {
            outrosAnexos.push(a);
          }
        });

        // --- Salva as Notas Fiscais na pasta do fornecedor ---
        var contadorNF = 1;
        for (var k = 0; k < nfs.length; k++) {
          var anexo   = nfs[k];
          var ext     = obterExtensao(anexo.getName());
          var sufixo  = nfs.length > 1 ? "_" + contadorNF : "";
          var nomeArq = "NF_" + diaMesAno + "_" + fornecedor + sufixo + "." + ext;

          if (arquivoJaExiste(pastaFornecedor, nomeArq)) {
            Logger.log("⏭️  Já existe: " + nomeArq);
            contadorNF++;
            continue;
          }

          pastaFornecedor.createFile(anexo.copyBlob().setName(nomeArq));
          Logger.log("🧾 NF arquivada: " + nomeArq);
          logLinhas.push(diaMesAno + " | NF     | " + fornecedor + " | " + emailFrom + " | " + nomeArq);
          totalNFs++;
          contadorNF++;
        }

        // --- Salva os demais anexos na subpasta _anexos ---
        if (outrosAnexos.length > 0) {
          var pastaAnexos = obterOuCriarPasta(pastaFornecedor, "_anexos");
          var contadorAnexo = 1;

          for (var m = 0; m < outrosAnexos.length; m++) {
            var outroAnexo = outrosAnexos[m];
            var nomeOriginal = outroAnexo.getName();
            var extOutro  = obterExtensao(nomeOriginal);
            var nomeBase  = nomeOriginal.replace(/\.[^/.]+$/, ""); // sem extensão
            var nomeAnexo = "ANEXO_" + diaMesAno + "_" + fornecedor + "_" + sanitizarNome(nomeBase) + "." + extOutro;

            if (arquivoJaExiste(pastaAnexos, nomeAnexo)) {
              Logger.log("⏭️  Já existe: " + nomeAnexo);
              contadorAnexo++;
              continue;
            }

            pastaAnexos.createFile(outroAnexo.copyBlob().setName(nomeAnexo));
            Logger.log("📎 Anexo salvo: " + nomeAnexo);
            logLinhas.push(diaMesAno + " | ANEXO  | " + fornecedor + " | " + emailFrom + " | " + nomeAnexo);
            totalAnexos++;
            contadorAnexo++;
          }
        }

      } catch (e) {
        Logger.log("❌ Erro ao processar e-mail de '" + emailFrom + "': " + e.message);
        totalErros++;
      }
    }

    threads[i].removeLabel(marcador);
    threads[i].moveToArchive();
  }

  if (logLinhas.length > 0) {
    salvarLog(pastaRaiz, logLinhas);
  }

  Logger.log("========================================");
  Logger.log("🧾 NFs arquivadas : " + totalNFs);
  Logger.log("📎 Anexos salvos  : " + totalAnexos);
  Logger.log("❌ Erros          : " + totalErros);
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
  return pasta.getFilesByName(nomeArquivo).hasNext();
}

function extrairEmail(from) {
  var match = from.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase().trim();
  return from.toLowerCase().trim();
}

function resolverFornecedor(email) {
  if (FORNECEDORES[email]) return FORNECEDORES[email];
  var dominio = email.split("@")[1];
  if (dominio && FORNECEDORES[dominio]) return FORNECEDORES[dominio];
  if (dominio) {
    var nome = dominio.split(".")[0];
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }
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
  var dataHoje = Utilities.formatDate(new Date(), CONFIG.FUSO_HORARIO, "yyyy-MM-dd_HH-mm");
  var nomeLog  = "log_execucao_" + dataHoje + ".txt";
  var cabecalho = "Data       | Tipo   | Fornecedor       | E-mail Remetente              | Arquivo\n";
  cabecalho    += "=".repeat(100) + "\n";
  var conteudo  = cabecalho + linhas.join("\n");
  var pastaLogs = obterOuCriarPasta(pastaRaiz, "_logs");
  pastaLogs.createFile(nomeLog, conteudo, MimeType.PLAIN_TEXT);
  Logger.log("📋 Log salvo: " + nomeLog);
}
