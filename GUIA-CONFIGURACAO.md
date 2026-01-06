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
