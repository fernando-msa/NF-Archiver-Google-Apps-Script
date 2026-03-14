# 🧾 NF Archiver — Arquivador Automático de Notas Fiscais

> Automação para capturar notas fiscais recebidas via Gmail, organizá-las por ano, mês e fornecedor no Google Drive, e gerar log de execução — desenvolvido para o setor de TI do HAMA.

---

## 📌 Visão Geral

Notas fiscais chegam por e-mail em diferentes formatos (PDF, XML, imagem) e de diferentes fornecedores. Sem automação, o arquivamento é manual, sujeito a erros e difícil de auditar.

Este script resolve isso de forma automática:

1. Lê e-mails com o marcador `Notas Fiscais TI` no Gmail
2. Filtra apenas os anexos com formato de nota fiscal (PDF, XML, JPG, PNG)
3. Organiza no Google Drive em estrutura hierárquica por **Ano → Mês → Fornecedor**
4. Evita duplicatas verificando se o arquivo já existe
5. Gera log de execução com data, fornecedor e arquivo arquivado
6. Arquiva os e-mails processados, mantendo a caixa limpa

---

## 🗂️ Estrutura no Google Drive

```
📁 Notas Fiscais TI/
├── 📁 2026/
│   ├── 📁 03 - Março/
│   │   ├── 📁 Fornecedor_LTDA/
│   │   │   ├── 📄 NF_2026-03-14_Fornecedor_LTDA.pdf
│   │   │   └── 📄 NF_2026-03-14_Fornecedor_LTDA.xml
│   │   └── 📁 Tech_Distribuidora/
│   │       └── 📄 NF_2026-03-10_Tech_Distribuidora.pdf
│   └── 📁 04 - Abril/
│       └── ...
└── 📁 _logs/
    └── 📄 log_execucao_2026-03-14_08-00.txt
```

---

## ⚙️ Pré-requisitos

- Conta Google com acesso ao **Google Apps Script**
- Gmail com marcador/label criado para receber as notas fiscais
- Pasta criada no **Google Drive** para servir de destino

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
  FUSO_HORARIO:     "GMT-3",             // Fuso horário de Aracaju/SE
  FORMATOS_ACEITOS: ["pdf", "xml", "jpg", "jpeg", "png"],
  MAX_THREADS:      50                   // Máx. de e-mails por execução
};
```

> 💡 **Como obter o ID da pasta:** abra a pasta no Drive. O ID é a sequência após `/folders/` na URL.

### 3. Autorize as permissões

Na primeira execução, o Google solicitará permissão para acessar Gmail e Drive. Clique em **Permitir**.

### 4. Configure o gatilho automático

Para rodar diariamente de forma automática:

- No Apps Script → **Gatilhos** (ícone de relógio) → **+ Adicionar gatilho**
- Função: `arquivarNotasFiscais`
- Evento: **Com base no tempo → Diário**
- Horário sugerido: entre 7h e 8h (início do expediente)

---

## 📄 Nomenclatura dos Arquivos

Os arquivos são salvos no padrão:

```
NF_{data}_{fornecedor}.{ext}

Exemplo:
NF_2026-03-14_Fornecedor_LTDA.pdf
NF_2026-03-14_Tech_Distribuidora_1.xml   ← índice quando há múltiplos anexos
NF_2026-03-14_Tech_Distribuidora_2.pdf
```

O nome do fornecedor é extraído automaticamente do campo **De:** do e-mail.

---

## 📋 Log de Execução

A cada execução, um arquivo de log é salvo na pasta `_logs/`:

```
Data       | Fornecedor          | Arquivo
============================================================
2026-03-14 | Fornecedor_LTDA     | NF_2026-03-14_Fornecedor_LTDA.pdf
2026-03-14 | Tech_Distribuidora  | NF_2026-03-14_Tech_Distribuidora.xml
```

---

## ⚠️ Limitações Conhecidas

| Limitação | Detalhe |
|---|---|
| Quota do Apps Script | Execuções limitadas a ~6 min. Ajuste `MAX_THREADS` para grandes volumes |
| Nome do fornecedor | Extraído do campo "De:" — e-mails sem nome amigável usam o domínio |
| Formatos aceitos | Apenas os listados em `FORMATOS_ACEITOS` são arquivados |

---

## 🔧 Melhorias Planejadas

- [ ] Relatório mensal em PDF com consolidado de notas arquivadas
- [ ] Notificação por e-mail ao gestor após cada execução
- [ ] Suporte a múltiplos marcadores (um por categoria de compra)
- [ ] Extração automática do número da NF a partir do XML NF-e

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
