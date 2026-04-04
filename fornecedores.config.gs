// ============================================================
// Configuração modular do dicionário de fornecedores
// Arquivo separado para facilitar manutenção e versionamento
// ============================================================

var FORNECEDORES_CONFIG = {
  // Por e-mail exato
  porEmail: {
    "digitalfiberadm@gmail.com": "DigitalFiber",
    "silvia@xlogic.com.br": "XLogic",
    "microgm@microesoftloc.com.br": "MicroSoft_Loc"
  },

  // Por domínio
  porDominio: {
    "omie.com.br": "Omie",
    "executiva.net": "Executiva",
    "starseguranca.com": "Star_Seguranca",
    "smedtecnologia.com.br": "SMED_Tecnologia",
    "tld.com.br": "TLD",
    "xlogic.com.br": "XLogic",
    "microesoftloc.com.br": "MicroSoft_Loc"
  }
};

function obterMapaFornecedores() {
  var mapa = {};
  var config = (FORNECEDORES_CONFIG && typeof FORNECEDORES_CONFIG === "object") ? FORNECEDORES_CONFIG : {};
  var porEmail = (config.porEmail && typeof config.porEmail === "object") ? config.porEmail : {};
  var porDominio = (config.porDominio && typeof config.porDominio === "object") ? config.porDominio : {};

  for (var email in porEmail) {
    mapa[email] = porEmail[email];
  }

  for (var dominio in porDominio) {
    mapa[dominio] = porDominio[dominio];
  }

  return mapa;
}
