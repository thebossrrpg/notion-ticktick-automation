# 🔄 Notion → TickTick Automation

Automação para sincronizar mudanças na propriedade **Priority** do Notion com listas específicas no TickTick.

## 📋 O Que Esta Integração Faz

Quando você altera o valor da propriedade **Priority** em uma página da database "Mods" no Notion:
- Detecta APENAS mudanças no campo Priority (não qualquer atualização da página)
- Cria uma tarefa na lista correspondente do TickTick baseada no valor:
  - Priority = 1 → Lista "Prioridade 1"
  - Priority = 2 → Lista "Prioridade 2"
  - Priority = 3 → Lista "Prioridade 3"
  - Priority = 4 → Lista "Prioridade 4"
  - Priority = 5 → Lista "Prioridade 5"
  - Priority = 0 → Lista "Prioridade 0"
- Usa Google Sheets como cache para comparar valores antigos vs novos

## 🏗️ Arquitetura

```
Notion Database
    ↓
Make.com Webhook (1 operação) - GRÁTIS PARA SEMPRE
    ↓
GitHub Actions Script (trabalho pesado) - GRÁTIS ILIMITADO
    ├─ Busca valor antigo no Google Sheets
    ├─ Compara com valor novo do Notion
    ├─ Se mudou: cria tarefa no TickTick
    └─ Atualiza Google Sheets com novo valor
```

**Por que esta arquitetura?**
- Make.com: Apenas 1 operação por execução = 1.000 alterações/mês grátis
- GitHub Actions: Processamento ilimitado e gratuito
- 100% gratuito para sempre, sem cartão de crédito

## 📁 Estrutura do Repositório

```
.
├── .github/
│   └── workflows/
│       └── sync-priority.yml    # GitHub Actions workflow
├── src/
│   └── sync.js                  # Script principal
├── .env.example                 # Template de variáveis
└── README.md                    # Este arquivo
```

## ⚙️ Configuração

### 1. Google Sheets (Cache)

**Planilha já criada:** 
https://docs.google.com/spreadsheets/d/14QlbUIoH7qxE9ijZg-y1tFZVB2ML15XV299oZbUZu6o

**Estrutura:**
- Coluna A (PageID): ID da página do Notion
- Coluna B (Priority): Último valor conhecido

### 2. GitHub Secrets

Vá em `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Adicione:
- `NOTION_API_KEY`: Token de integração do Notion
- `NOTION_DATABASE_ID`: ID da database "Mods"
- `GOOGLE_SHEETS_CREDENTIALS`: JSON da Service Account do Google
- `TICKTICK_API_KEY`: Token do TickTick
- `TICKTICK_PROJECT_IDS`: JSON com IDs das listas

### 3. Make.com Scenario

1. Criar novo Scenario
2. Adicionar módulo "Webhooks" → "Custom webhook"
3. Copiar URL do webhook
4. Adicionar módulo "HTTP" → "Make a request"
5. Configurar:
   - URL: `https://api.github.com/repos/thebossrrpg/notion-ticktick-automation/dispatches`
   - Method: POST
   - Headers:
     - `Authorization`: `Bearer SEU_GITHUB_TOKEN`
     - `Accept`: `application/vnd.github.v3+json`
   - Body:
     ```json
     {
       "event_type": "notion_update",
       "client_payload": {{webhook.body}}
     }
     ```

### 4. Notion Webhook

1. Ir em Notion API (https://www.notion.so/my-integrations)
2. Selecionar sua integração
3. Em "Capabilities" → ativar "Content"
4. Em "Subscriptions" → Add subscription
5. Colar URL do webhook do Make.com
6. Selecionar database "Mods"

## 🚀 Como Usar

### Uso Diário

1. Abra qualquer página na database "Mods" do Notion
2. Altere o valor da propriedade "Priority"
3. Aguarde ~30 segundos
4. Verifique a tarefa criada na lista correspondente do TickTick

### Monitoramento

- **Make.com**: Ver execuções em https://us2.make.com/organization/6197664/dashboard
- **GitHub Actions**: Ver logs em https://github.com/thebossrrpg/notion-ticktick-automation/actions
- **Google Sheets**: Ver cache atualizado na planilha

## 🔧 Manutenção

### Adicionar Nova Lista de Prioridade

1. Abrir `src/sync.js`
2. Adicionar novo case no switch:
   ```javascript
   case 6:
     listId = process.env.TICKTICK_LIST_6;
     break;
   ```
3. Adicionar `TICKTICK_LIST_6` nos GitHub Secrets
4. Commit e push

### Atualizar Tokens Expirados

1. Ir em `Settings` → `Secrets and variables` → `Actions`
2. Clicar no secret expirado
3. Clicar em "Update"
4. Colar novo valor
5. Salvar

### Ver Logs de Erro

1. GitHub Actions: https://github.com/thebossrrpg/notion-ticktick-automation/actions
2. Clicar na execução falhada
3. Ver detalhes do erro
4. Corrigir problema
5. Re-executar workflow

## ❓ Troubleshooting

### Tarefa não foi criada

1. **Verificar Make.com**:
   - Acessar dashboard
   - Ver se webhook foi recebido
   - Ver se chamada para GitHub foi bem-sucedida

2. **Verificar GitHub Actions**:
   - Ver se workflow foi disparado
   - Ler logs de erro
   - Verificar se secrets estão configurados

3. **Verificar Google Sheets**:
   - Ver se linha foi atualizada
   - Confirmar que PageID está correto

### "Priority não mudou" mas criei tarefa

- O valor antigo no Google Sheets estava diferente
- Limpar a linha da planilha para resetar
- Próxima alteração será detectada corretamente

### Make.com atingiu limite de operações

- Plano gratuito: 1.000 ops/mês
- Cada execução = 1 operação
- Se ultrapassou: aguardar renovação mensal
- Alternativa: Upgrade para plano pago

## 📊 Limites e Custos

| Serviço | Limite Gratuito | Custo se Exceder |
|---------|-----------------|------------------|
| Make.com | 1.000 ops/mês | ~$9/mês (plano Core) |
| GitHub Actions | 2.000 min/mês | Grátis para públicos |
| Google Sheets API | 60 req/min | Grátis |
| Notion API | 3 req/s | Grátis |
| TickTick API | Consultar docs | Grátis |

## 🔒 Segurança

- **Nunca commite secrets** neste repositório
- Todos os tokens ficam em GitHub Secrets (criptografados)
- Make.com webhook é público mas só dispara GitHub Actions
- GitHub Actions roda em ambiente isolado

## 📝 Licença

Este projeto é de uso pessoal. Modificações são bem-vindas!

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas via Issues.

---

**Criado em:** Janeiro 2026  
**Última atualização:** Janeiro 2026
