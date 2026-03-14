# 🧾 NF Archiver — Arquivador Automático de Notas Fiscais

> Automação para capturar notas fiscais e anexos recebidos via Gmail, organizá-los por fornecedor no Google Drive e gerar log de auditoria — desenvolvido para o setor de TI do HAMA.

---

## 📌 Visão Geral

Notas fiscais chegam por e-mail em diferentes formatos e de diferentes fornecedores. Sem automação, o arquivamento é manual, sujeito a erros e difícil de auditar.

Este script resolve isso de forma automática:

1. Lê e-mails com o marcador `Notas Fiscais TI` no Gmail
2. Identifica o fornecedor pelo e-mail remetente via dicionário configurável
3. Separa **notas fiscais** (PDF, XML, imagens) de **anexos complementares** (boletos, contratos, etc.)
4. Organiza no Google Drive em estrutura hierárquica por **Ano → Mês → Fornecedor**
5. Evita duplicatas verificando se o arquivo já existe antes de criar
6. Gera log de auditoria com tipo, fornecedor, remetente e arquivo
7. Arquiva os e-mails processados, mantendo a caixa limpa

---

## 🗂️ Estrutura no Google Drive

```
📁 Notas Fiscais TI/
├── 📁 2026/
│   └── 📁 03 - Março/
│       ├── 📁 Executiva/
│       │   ├── 📄 NF_2026-03-14_Executiva.pdf
│       │   ├── 📄 NF_2026-03-14_Executiva.xml
│       │   └── 📁 _anexos/
│       │       └── 📄 ANEXO_2026-03-14_Executiva_boleto.pdf
│       ├── 📁 Star_Seguranca/
│       │   └── 📄 NF_2026-03-14_Star_Seguranca.pdf
│       └── 📁 DigitalFiber/
│           └── 📄 NF_2026-03-14_DigitalFiber.xml
└── 📁 _logs/
    └── 📄 log_execucao_2026-03-14_08-00.txt
```

---

## 📎 Separação de Arquivos

| Tipo | Extensões | Destino | Prefixo |
|---|---|---|---|
| Nota Fiscal | `pdf`, `xml`, `jpg`, `jpeg`, `png` | Pasta do fornecedor | `NF_` |
| Anexo complementar | `docx`, `xlsx`, `txt`, e outros | Subpasta `_anexos/` | `ANEXO_` |

---

## 🏷️ Nomenclatura dos Arquivos

```
NF_2026-03-14_Executiva.pdf
NF_2026-03-14_Executiva.xml
NF_2026-03-14_DigitalFiber_1.pdf      ← índice quando há múltiplos anexos do mesmo tipo
NF_2026-03-14_DigitalFiber_2.xml
ANEXO_2026-03-14_Executiva_boleto.pdf
```

---

## 🏢 Dicionário de Fornecedores

O script identifica o fornecedor pelo e-mail remetente com três níveis de prioridade:

1. **E-mail exato** — `digitalfiberadm@gmail.com` → `DigitalFiber`
2. **Domínio** — `faturamento@executiva.net` → `Executiva`
3. **Fallback automático** — domínio desconhecido → nome capitalizado do domínio

Fornecedores pré-configurados:

| E-mail / Domínio | Fornecedor |
|---|---|
| `digitalfiberadm@gmail.com` | DigitalFiber |
| `silvia@xlogic.com.br` | XLogic |
| `microgm@microesoftloc.com.br` | MicroSoft_Loc |
| `omie.com.br` | Omie |
| `executiva.net` | Executiva |
| `starseguranca.com` | Star_Seguranca |
| `smedtecnologia.com.br` | SMED_Tecnologia |
| `tld.com.br` | TLD |

Para adicionar novos fornecedores, edite o objeto `FORNECEDORES` no topo do script.

---

## ⚙️ Pré-requisitos

- Conta Google com acesso ao **Google Apps Script**
- Gmail com marcador/label `Notas Fiscais TI` criado
- Pasta de destino criada no **Google Drive**

---

## 🛠️ Como Configurar

### 1. Crie o projeto no Apps Script

Acesse [script.google.com](https://script.google.com) → **Novo Projeto** → cole o conteúdo do arquivo `nf_archiver.gs`.

### 2. Configure as variáveis

No topo do script, ajuste o objeto `CONFIG`:

```javascript
var CONFIG = {
  MARCADOR_GMAIL:   "Notas Fiscais TI",  // Nome do marcador no Gmail
  PASTA_RAIZ_ID:    "SEU_ID_AQUI",       // ID da pasta raiz no Drive
  FUSO_HORARIO:     "GMT-3",             // Fuso horário local
  FORMATOS_NF:      ["pdf", "xml"],      // Extensões tratadas como NF
  FORMATOS_IMAGEM:  ["jpg", "jpeg", "png"],
  MAX_THREADS:      50                   // Máx. de e-mails por execução
};
```

> 💡 **Como obter o ID da pasta:** abra a pasta no Drive — o ID é a sequência após `/folders/` na URL.

### 3. Autorize as permissões

Na primeira execução, o Google solicitará acesso ao Gmail e Drive. Clique em **Permitir**.

### 4. Configure o gatilho automático

- No Apps Script → **Gatilhos** → **+ Adicionar gatilho**
- Função: `arquivarNotasFiscais`
- Evento: **Com base no tempo → Diário**
- Horário sugerido: 7h–8h (início do expediente)

---

## 📋 Log de Auditoria

A cada execução, um log é salvo em `_logs/` com o seguinte formato:

```
Data       | Tipo   | Fornecedor    | E-mail Remetente           | Arquivo
====================================================================================================
2026-03-14 | NF     | Executiva     | faturamento@executiva.net  | NF_2026-03-14_Executiva.pdf
2026-03-14 | NF     | Executiva     | faturamento@executiva.net  | NF_2026-03-14_Executiva.xml
2026-03-14 | ANEXO  | Executiva     | faturamento@executiva.net  | ANEXO_2026-03-14_Executiva_boleto.pdf
2026-03-14 | NF     | Star_Seguranca| faturamento@starseguranca.com | NF_2026-03-14_Star_Seguranca.pdf
```

---

## ⚠️ Limitações Conhecidas

| Limitação | Detalhe |
|---|---|
| Quota do Apps Script | Execuções limitadas a ~6 min. Reduza `MAX_THREADS` para grandes volumes |
| Fornecedor desconhecido | Se o domínio não estiver no dicionário, usa o nome do domínio capitalizado |
| Inline images | Imagens embutidas no corpo do e-mail não são capturadas, apenas anexos reais |

---

## 🔧 Melhorias Planejadas

- [ ] Extração automática do número da NF a partir do XML NF-e
- [ ] Relatório mensal consolidado em PDF
- [ ] Notificação por e-mail ao gestor após cada execução
- [ ] Suporte a múltiplos marcadores por categoria de compra

---

## 🧰 Stack

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail%20API-EA4335?style=for-the-badge&logo=gmail&logoColor=white)
![Google Drive](https://img.shields.io/badge/Google%20Drive-34A853?style=for-the-badge&logo=googledrive&logoColor=white)

---

## 👤 Autor

**Fernando S. De Santana Júnior**
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/fernando-junior-1a74ab29b/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/fernando-msa)

---

## 📜 Licença

Distribuído sob licença MIT.
