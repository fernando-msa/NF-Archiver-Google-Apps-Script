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

  for (var email in FORNECEDORES_CONFIG.porEmail) {
    mapa[email] = FORNECEDORES_CONFIG.porEmail[email];
  }

  for (var dominio in FORNECEDORES_CONFIG.porDominio) {
    mapa[dominio] = FORNECEDORES_CONFIG.porDominio[dominio];
  }

  return mapa;
}
