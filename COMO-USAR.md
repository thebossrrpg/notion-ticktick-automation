# 🎯 Como Usar - Integração Notion → TickTick

## 🚀 SOLUÇÃO 100% GRATUITA - GitHub Actions

Esta integração já está **PRONTA** e configurada no GitHub Actions!
Roda automaticamente **a cada 15 minutos** sem custo algum.

---

## ✅ O Que Foi Feito

1. ✅ Código JavaScript completo em `src/sync.js`
2. ✅ GitHub Actions workflow configurado (`.github/workflows/sync-priority.yml`)
3. ✅ Cache em arquivo local (sem precisar Google Sheets API paga)
4. ✅ Detecção de mudanças APENAS na propriedade Priority
5. ✅ Roteamento automático para listas do TickTick (0-5)

---

## 📝 O Que VOCÊ Precisa Fazer

### PASSO 1: Configurar Notion

1. Vá em https://www.notion.so/my-integrations
2. Clique em "+ New integration"
3. Dê um nome: **"TickTick Sync"**
4. Copie o **Internal Integration Token** (secret_...)
5. Abra sua database "Mods" no Notion
6. Clique em **...** no canto superior direito
7. Selecione **"Add connections"**
8. Escolha a integração "TickTick Sync"

**ID da Database:** `95ddda2e2aa447b8bdcdfa5a97eb9870`

---

### PASSO 2: Obter IDs das Listas do TickTick

Você precisa dos IDs das suas 6 listas do TickTick (Prioridade 0 a 5).

**OPÇÃO A - Via API (Recomendado):**

1. Abra o navegador
2. Vá para: https://api.ticktick.com/api/v2/projects
3. Faça login se solicitado
4. Você verá um JSON com todas as suas listas
5. Procure pelos nomes "Prioridade 0", "Prioridade 1", etc.
6. Copie o `id` de cada uma

**OPÇÃO B - Via Inspeção:**

1. Abra o TickTick no navegador
2. Clique em uma lista (ex: "Prioridade 1")
3. Olhe na URL, o ID está depois de `/project/`
4. Exemplo: `ticktick.com/project/12345abc` → ID = `12345abc`

---

### PASSO 3: Adicionar Secrets no GitHub

1. Vá em: https://github.com/thebossrrpg/notion-ticktick-automation/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Adicione os seguintes secrets:

**NOTION_API_KEY**
- Cole o token da integração do Notion (secret_...)

**NOTION_DATABASE_ID**
- Cole: `95ddda2e2aa447b8bdcdfa5a97eb9870`

**TICKTICK_USERNAME**
- Seu email/username do TickTick

**TICKTICK_PASSWORD**
- Sua senha do TickTick

**TICKTICK_LIST_PRIORITY_0**
- ID da lista "Prioridade 0"

**TICKTICK_LIST_PRIORITY_1**
- ID da lista "Prioridade 1"

**TICKTICK_LIST_PRIORITY_2**
- ID da lista "Prioridade 2"

**TICKTICK_LIST_PRIORITY_3**
- ID da lista "Prioridade 3"

**TICKTICK_LIST_PRIORITY_4**
- ID da lista "Prioridade 4"

**TICKTICK_LIST_PRIORITY_5**
- ID da lista "Prioridade 5"

---

### PASSO 4: Ativar GitHub Actions

1. Vá em: https://github.com/thebossrrpg/notion-ticktick-automation/actions
2. Se houver um botão **"I understand my workflows, go ahead and enable them"**, clique nele
3. Pronto! A integração começará a rodar automaticamente

---

## 🔍 Como Funciona

1. **A cada 15 minutos**, o GitHub Actions executa o script
2. Busca todas as páginas da sua database "Mods"
3. Compara o valor atual de **Priority** com o valor anterior (salvo em cache)
4. Se detectar mudança:
   - Cria uma tarefa no TickTick na lista correspondente
   - Atualiza o cache
5. Se não houve mudança, não faz nada

**Exemplo:**
- Página "Mod XYZ" tinha Priority = 3
- Você muda para Priority = 1
- Na próxima execução (máx 15 min), uma tarefa "Mod XYZ" é criada na lista "Prioridade 1" do TickTick

---

## 🛠️ Monitoramento

**Ver se está funcionando:**
1. Acesse: https://github.com/thebossrrpg/notion-ticktick-automation/actions
2. Veja os logs das execuções
3. Verde = sucesso, Vermelho = erro

**Testar manualmente:**
1. Vá em Actions
2. Clique em "Sync Notion Priority to TickTick"
3. Clique em "Run workflow" → "Run workflow"
4. Aguarde e veja os logs

---

## ❓ FAQ

**P: Quanto custa?**
R: **ZERO!** GitHub Actions é gratuito para repositórios públicos.

**P: Posso mudar a frequência?**
R: Sim! Edite `.github/workflows/sync-priority.yml` e mude a linha `- cron: '*/15 * * * *'`.

**P: E se eu mudar a Priority várias vezes rápido?**
R: Apenas a última mudança será detectada (na próxima execução).

**P: Posso adicionar mais prioridades?**
R: Sim! Basta adicionar mais secrets (TICKTICK_LIST_PRIORITY_6, etc.) e atualizar o código.

**P: A integração para se eu não usar?**
R: Não! Ela continua rodando automaticamente para sempre.

---

## 🎉 PRONTO!

Após configurar os secrets, a integração já estará funcionando!

Teste mudando o Priority de uma página no Notion e aguarde até 15 minutos. ✨
