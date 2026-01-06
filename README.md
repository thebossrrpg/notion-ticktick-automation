# 🔄 Notion → Tick-Tick Automation

Este projeto automatiza a sincronização de alterações em uma propriedade específica (ex: "Prioridade") de um banco de dados do Notion para tarefas no Tick-Tick.

Quando a propriedade é alterada para um dos valores 0, 1, 2, 3, 4 ou 5, o script cria uma tarefa correspondente no Tick-Tick, na lista apropriada ao valor.   

## Funcionalidade

-   Monitora um banco de dados específico do Notion via API.
-   Detecta alterações na propriedade de prioridade.
-   Cria tarefa no Tick-Tick na lista correspondente:
    -   0 → Lista configurada para 0
    -   1 → Lista configurada para 1
    -   2 → Lista configurada para 2
    -   3 → Lista configurada para 3
    -   4 → Lista configurada para 4
    -   5 → Lista configurada para 5
-   Evita duplicatas rastreando itens já processados.
-   Executa automaticamente a cada 15 minutos via GitHub Actions.
    
## Requisitos

-   Node.js (para executar o script localmente)
-   Conta no Notion com integração API
-   Conta no Tick-Tick com acesso OAuth2

### 🏗️ Arquitetura do Projeto

1.  **Trigger (gatilho)**
    -   Não existe webhook nativo no Notion (infelizmente).
    -   Usamos **polling**: o script verifica periodicamente se houve alterações no banco de dados.
    -   Frequência: a cada 15 minutos (definido no GitHub Actions).

2.  **Execução automática**
    -   **GitHub Actions** é responsável por rodar o script automaticamente.
    -   Workflow: .github/workflows/sync-priority.yml
    -   Usa o runner oficial do GitHub (gratuito, sem precisar de servidor próprio).
    -   Agenda: cron: '*/15 * * * *' → roda nos minutos 0, 15, 30 e 45 de cada hora.
3.  **Script principal (src/sync.js)**
    -   Escrito em JavaScript/Node.js (leve e fácil de manter).
    -   Fluxo principal:
        -   Lê as variáveis de ambiente/secrets (tokens, IDs, etc.).
        -   Consulta a API do Notion:
            -   Busca páginas alteradas desde a última execução (usando last_edited_time).
            -   Filtra apenas as que têm a propriedade de prioridade preenchida (0–5).
        -   Para cada página válida:
            -   Verifica se já foi processada (evita duplicatas).
            -   Monta o título da tarefa (nome da página ou propriedade customizada).
            -   Escolhe a lista correta no TickTick com base no valor da prioridade.
            -   Chama a API do TickTick para criar a tarefa.
        -   Atualiza o controle interno de itens já sincronizados.
4.  **APIs utilizadas**
    -   **Notion API** (v1):
        -   Apenas leitura no banco de dados.
        -   Query com filtro por last_edited_time para eficiência.
    -   **TickTick API** (OAuth2):
        -   Autenticação via access token.
        -   Endpoint para criar tarefas em projetos/listas específicas.
5.  **Controle de estado e duplicatas**
    -   O script mantém um registro simples dos IDs das páginas já processadas.
    -   Evita criar a mesma tarefa várias vezes, mesmo em execuções repetidas.
6.  **Vantagens dessa arquitetura**
    -   Totalmente gratuita (GitHub Actions + APIs gratuitas).
    -   Sem servidor para manter.
    -   Fácil de debuggar (logs completos no GitHub Actions).
    -   Escalável para centenas de tarefas por dia.
    -   Código aberto e fácil de modificar/forkar.

## 📁 Estrutura do Repositório

```text
notion-ticktick-automation/      ← Raiz do repositório
├─ .github/
│  └─ workflows/
│     └─ sync-priority.yml       ← Configuração do GitHub Actions (roda o script a cada evento)
│
├─ src/
│  └─ sync.js                    ← Script principal em JavaScript (lê Notion → cria tarefa no TickTick)
│
├─ .env.example                  ← Exemplo de arquivo de variáveis de ambiente (para testes locais)
├─ COMO-USAR.md                  ← Instruções de uso do projeto (em português)
├─ GUIA-CONFIGURACAO.md          ← Guia passo a passo para configurar tokens, secrets, etc.
├─ gerar_token.py                ← Script Python avançado para gerar token do TickTick (com mais opções)
├─ gerar_token_simples.py        ← Versão leve do script de token (sem dependências externas, mais fácil de rodar)
├─ README.md                     ← Documentação principal (o que você está lendo)
└─ LICENSE                       ← Licença MIT do projeto
```

## 📝 Licença

MIT. Este projeto é de uso pessoal. Modificações são bem-vindas!

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas via Issues.

---

**Criado em:** Janeiro 2026  
**Última atualização:** Janeiro 2026
