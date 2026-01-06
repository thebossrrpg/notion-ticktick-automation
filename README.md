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

notion-ticktick-automation/                ← Raiz do repositório
├── .github/
│   └── workflows/
│       └── sync-priority.yml              ← Configuração do GitHub Actions (roda o script a cada 15 minutos)
├── src/
│   └── sync.js                            ← Script principal em JavaScript (faz toda a mágica: lê Notion → cria tarefa no TickTick)
├── .env.example                           ← Exemplo de arquivo de variáveis de ambiente (para testes locais)
├── COMO-USAR.md                           ← Instruções detalhadas de uso (em português)
├── GUIA-CONFIGURACAO.md                   ← Guia passo a passo para configurar tokens, secrets, etc.
├── gerar_token.py                         ← Script Python completo para gerar token do TickTick (com mais opções)
├── gerar_token_simples.py                 ← Versão leve do script de token (sem dependências externas, mais fácil de rodar)
├── README.md                              ← Documentação principal (este arquivo que você está lendo)
└── LICENSE                                ← Licença MIT completa do projeto

## ⚙️ Configuração (passo a passo)

1.  **Crie integração no Notion**
    
    -   Acesse: [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations?referrer=grok.com).
    -   Crie uma nova integração.
    -   Copie o **Internal Integration Token**.
    -   No banco de dados desejado, clique em **Share** → **Invite** → selecione a integração recém-criada.
    
2.  **Gere token no Tick-Tick**
    
    -   Use um dos scripts Python auxiliares disponíveis no repositório:
        -   gerar_token.py (requer dependências externas)
        -   gerar_token_simples.py (não requer instalação de pacotes extras)
    -   Execute no terminal:
        
        Bash
        
        ```
        python gerar_token.py
        ```
        
        ou
        
        Bash
        
        ```
        python gerar_token_simples.py
        ```
        
    -   O script abrirá o navegador para autenticação e gerará o **access token OAuth2** do Tick-Tick.
    
3.  **Configure variáveis de ambiente (para testes locais)**
    
    -   Copie o arquivo .env.example para .env
    -   Preencha os valores necessários:
        -   Notion Token
        -   Notion Database ID
        -   Tick-Tick Access Token
        -   IDs das listas do Tick-Tick (em formato JSON)
        
4.  **Configure Secrets no GitHub**
    
    -   Vá em **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
    -   Adicione os seguintes secrets:
    
    Nome do Secret
    
    Descrição
    
    NOTION_TOKEN
    
    Token da integração do Notion
    
    NOTION_DATABASE_ID
    
    ID do banco de dados do Notion (encontrado na URL do database)
    
    TICKTICK_ACCESS_TOKEN
    
    Token OAuth2 gerado para o Tick-Tick
    
    TICKTICK_LIST_IDS
    
    JSON mapeando prioridade → ID da lista no Tick-Tick Exemplo: {"0":"inbox_id","1":"list1_id","2":"list2_id","3":"list3_id","4":"list4_id","5":"list5_id"}
    
5.  **Teste localmente**
    
    -   Certifique-se de ter Node.js instalado.
    -   Execute o script principal:
        
        Bash
        
        ```
        node src/sync.js
        ```
        
    -   Verifique no Tick-Tick se as tarefas foram criadas corretamente.
6.  **Ative o workflow no GitHub**
    
    -   Vá na aba **Actions**.
    -   Selecione o workflow **sync-priority.yml**.
    -   Clique em **Run workflow** para executar manualmente (teste).
    -   O schedule já está configurado para rodar automaticamente a cada 15 minutos.
  
  ## 🚀 Como Usar

Depois de configurar tudo (tokens, secrets, etc.), é só seguir esses passos simples:

1.  Teste localmente (recomendado para ver se está tudo certo) Abra o terminal na pasta do projeto e rode: node src/sync.js.
    
    Agora vá no seu banco de dados do Notion, altere a propriedade de prioridade de alguma página para 0, 1, 2, 3, 4 ou 5. Em poucos segundos, você vai ver a tarefa aparecer na lista correspondente do Tick-Tick.
    
2.  Automação automática O GitHub Actions já está configurado para executar o script a cada 15 minutos. Você não precisa fazer mais nada! Para conferir as execuções: Vá na aba Actions do seu repositório → clique em “sync-priority.yml” → veja o histórico de runs.
    
3.  O que acontece agora Toda vez que você mudar a propriedade de prioridade no Notion, em até 15 minutos a tarefa vai ser criada automaticamente no Tick-Tick na lista correta. O script evita criar tarefas duplicadas sozinho.

## 🔧 Manutenção e Solução de Problemas
1.  **Verifique o status do GitHub Actions**
    -   Vá na aba **Actions** do seu repositório.
    -   Clique em **sync-priority.yml**.
    -   Veja o histórico de execuções.
    -   Se aparecer erro (ícone vermelho), clique no job para ler o log.
    -   Erros comuns: token expirado (TickTick) ou integração desconectada no Notion.
    
2.  **Atualize o token do TickTick**
    -   Tokens OAuth2 do TickTick expiram (geralmente a cada 90 dias ou antes).
    -   Rode novamente o script gerar_token_simples.py.
    -   Copie o novo **access token**.
    -   Atualize o secret TICKTICK_ACCESS_TOKEN nas Settings → Secrets and variables → Actions.

3.  **Atualize o token do Notion (se necessário)**
    -   Tokens do Notion são permanentes, mas se você recriar a integração, atualize o secret NOTION_TOKEN.

4.  **Monitore limites da API**
    -   Notion: ~1000 requisições/dia (gratuito).
    -   TickTick: limites generosos no plano gratuito.
    -   Se o script rodar muito (ex: >500 páginas alteradas por dia), aumente o intervalo no .yml (de 15min para 30min).

5.  **Backup e segurança**
    -   Nunca commit o .env ou tokens no GitHub.
    -   Faça backup dos seus secrets (guarde em lugar seguro).
    -   Se trocar de conta TickTick ou Notion, atualize tudo.

6.  **Teste mensal rápido**
    -   Uma vez por mês, mude uma prioridade no Notion e espere 15 minutos.
    -   Confirme que a tarefa aparece no TickTick.
    -   Se não aparecer, verifique o Actions log.

## ❓ Troubleshooting

-   **Nada acontece depois de mudar a prioridade no Notion**
    -   Espere até 15 minutos (o script roda a cada 15 min).
    -   Vá na aba **Actions** do repositório → clique em **sync-priority.yml**.
    -   Veja se a última execução está verde (sucesso) ou vermelha (erro).
    -   Se estiver vermelha, clique no job e leia o log — ele sempre diz exatamente o que deu errado.
-   **Erro "Invalid authentication credentials" ou "401 Unauthorized"**
    -   Token do TickTick expirou (mais comum!)
    -   Rode novamente python gerar_token_simples.py.
    -   Atualize o secret TICKTICK_ACCESS_TOKEN no GitHub.
-   **Erro "Invalid token" ou "Integration not authorized" no Notion**
    -   Verifique se a integração está compartilhada com o banco de dados correto.
    -   Atualize o secret NOTION_TOKEN se você criou uma nova integração.
-   **Tarefa criada na lista errada ou não criada**
    -   Confira o secret TICKTICK_LIST_IDS.
    -   O formato precisa ser JSON válido, ex: {"0":"ID_da_Inbox","1":"ID_lista_1","2":"ID_lista_2","3":"ID_lista_3","4":"ID_lista_4","5":"ID_lista_5"}
    -   Para descobrir os IDs das listas no TickTick:
        -   Abra o app/web do TickTick.
        -   Clique com botão direito na lista → Inspecionar elemento → procure por "data-id" ou use o script de teste local.
-   **Script não roda localmente (node src/sync.js)**
    -   Certifique-se de ter criado o arquivo .env com todas as variáveis
    -   Instale Node.js se não tiver.
    -   Abra o terminal na pasta do projeto antes de rodar o comando.
-   **Muitas tarefas duplicadas**
    -   Normal nas primeiras execuções (ele sincroniza tudo que já tem prioridade).
    -   Depois da primeira rodada, duplicatas param de aparecer.
    -   Se continuar, limpe o histórico manualmente no TickTick.
-   **GitHub Actions não está rodando**
    -   Verifique se o workflow está habilitado (às vezes fica pausado em forks).
    -   Vá em Actions → clique no workflow → se tiver mensagem "Workflows aren't being run on this forked repository", clique em "I understand, run workflows".

### 🔒 Segurança (Como manter tudo seguro)

Essa automação lida com tokens sensíveis (Notion e TickTick), então é importante seguir boas práticas para evitar problemas. Aqui vai o que você precisa saber e fazer:

1.  **Nunca exponha seus tokens**
    -   Os secrets do GitHub (NOTION_TOKEN, TICKTICK_ACCESS_TOKEN, etc.) ficam criptografados e nunca aparecem nos logs.
    -   Nunca commit o arquivo .env no repositório (ele já está no .gitignore, então está protegido).
    -   Não compartilhe prints de tela com tokens visíveis.
    
2.  **Princípio do menor privilégio**
    -   A integração do Notion tem apenas acesso ao banco de dados que você compartilhou (e só leitura/escrita necessária).
    -   Se possível, crie uma integração dedicada só para essa automação (não use a mesma de outros projetos).
    -   No TickTick, o token tem acesso total à conta — por isso atualize-o periodicamente.
3.  **Rotação de tokens**
    -   TickTick: renove o token a cada 3–6 meses (rode o script de geração novamente e atualize o secret).
    -   Notion: o token é permanente, mas se suspeitar de vazamento, crie uma nova integração e substitua o secret.
4.  **Acesso ao repositório**
    -   Se o repositório for público: qualquer pessoa pode ver o código, mas NÃO os secrets (eles ficam escondidos).
    -   Se for privado: só você (e quem você adicionar) tem acesso.
    -   Evite adicionar colaboradores desnecessários.
5.  **Em caso de suspeita de comprometimento**
    -   Revogue imediatamente o token do TickTick (faça logout em todos os dispositivos no app).
    -   Crie nova integração no Notion e atualize o secret.
    -   Mude sua senha do TickTick e ative 2FA se ainda não tiver.
6.  **Dicas extras de segurança**
    -   Ative autenticação de dois fatores (2FA) tanto no GitHub quanto no TickTick.
    -   Guarde uma cópia segura dos seus secrets em um gerenciador de senhas (ex: Bitwarden, 1Password).
    -   Não rode o script localmente em computadores públicos ou compartilhados.
 

## 📝 Licença

MIT. Este projeto é de uso pessoal. Modificações são bem-vindas!

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas via Issues.

---

**Criado em:** Janeiro 2026  
**Última atualização:** Janeiro 2026
