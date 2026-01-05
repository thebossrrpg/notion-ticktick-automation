#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 GERADOR DE TOKEN TICKTICK - VERSÃO SUPER SIMPLES
NÃO PRECISA INSTALAR NADA! ✨
"""

import webbrowser
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import threading
import json
import urllib.request

# ===== SUAS CREDENCIAIS =====
CLIENT_ID = "8lYwnAIdpZL96fO8p8"
CLIENT_SECRET = "f7Tyio2GXca90j2rjfW3E87cZgIJb3AR"
REDIRECT_URI = "http://localhost:8080"

# Variável global para guardar o código
auth_code = None

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    """Handler para receber o callback do OAuth2"""
    
    def do_GET(self):
        global auth_code
        
        # Pega o código da URL
        query = urlparse(self.path).query
        params = parse_qs(query)
        
        if 'code' in params:
            auth_code = params['code'][0]
            
            # Retorna uma página bonita
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Autorização Concluída!</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                        text-align: center;
                    }
                    h1 { color: #4CAF50; margin-bottom: 20px; }
                    p { font-size: 18px; color: #333; }
                    .emoji { font-size: 48px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="emoji">🎉</div>
                    <h1>Autorização Concluída!</h1>
                    <p>Pode fechar esta janela e voltar para o terminal.</p>
                    <p style="color: #666; margin-top: 20px; font-size: 14px;">
                        O token está sendo gerado... aguarde! ⏳
                    </p>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
        else:
            self.send_response(400)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Silencia os logs do servidor
        pass

def start_server():
    """Inicia o servidor local para receber o callback"""
    with socketserver.TCPServer(("", 8080), CallbackHandler) as httpd:
        httpd.handle_request()  # Processa apenas UMA requisição

def exchange_code_for_token(code):
    """Troca o código por um access token"""
    
    url = "https://ticktick.com/oauth/token"
    
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
        "scope": "tasks:read tasks:write"
    }
    
    # Converte para formato application/x-www-form-urlencoded
    data_encoded = urllib.parse.urlencode(data).encode('utf-8')
    
    request = urllib.request.Request(
        url,
        data=data_encoded,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(request) as response:
            result = json.loads(response.read().decode())
            return result.get('access_token')
    except Exception as e:
        print(f"\n❌ Erro ao trocar código por token: {e}")
        return None

def main():
    print("")
    print("=" * 70)
    print("  🎯 GERADOR DE TOKEN TICKTICK - VERSÃO SUPER SIMPLES")
    print("=" * 70)
    print("")
    print("✨ ESTA VERSÃO NÃO PRECISA INSTALAR NENHUMA BIBLIOTECA!")
    print("")
    print("📝 O que vai acontecer:")
    print("")
    print("  1. Seu navegador vai abrir com a página do TickTick")
    print("  2. Clique em 'Autorizar' ou 'Allow'")
    print("  3. Volte aqui e copie o token que vai aparecer!")
    print("")
    print("⚠️  IMPORTANTE: NÃO feche esta janela até o fim!")
    print("")
    
    input("👉 Aperte ENTER quando estiver pronto...")
    
    print("")
    print("🌐 Abrindo navegador...")
    print("📡 Aguardando autorização...")
    print("")
    
    # Monta a URL de autorização
    auth_url = (
        f"https://ticktick.com/oauth/authorize?"
        f"client_id={CLIENT_ID}&"
        f"redirect_uri={REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=tasks:read tasks:write&"
        f"state=random_state_string"
    )
    
    # Abre o navegador
    webbrowser.open(auth_url)
    
    # Inicia o servidor em uma thread separada
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Espera o servidor receber o callback
    server_thread.join(timeout=300)  # Timeout de 5 minutos
    
    if auth_code:
        print("✅ Autorização recebida!")
        print("🔄 Trocando código por access token...")
        print("")
        
        token = exchange_code_for_token(auth_code)
        
        if token:
            print("")
            print("=" * 70)
            print("  🎉 SUCESSO! TOKEN GERADO!")
            print("=" * 70)
            print("")
            print("📋 COPIE ESTE TOKEN (selecione tudo e Ctrl+C):")
            print("")
            print("┌" + "─" * 68 + "┐")
            print(f"│ {token[:66]} │")
            if len(token) > 66:
                remaining = token[66:]
                while remaining:
                    chunk = remaining[:66]
                    print(f"│ {chunk.ljust(66)} │")
                    remaining = remaining[66:]
            print("└" + "─" * 68 + "┘")
            print("")
            print("✅ Próximos passos:")
            print("")
            print("  1. Selecione TODO o texto do token acima")
            print("  2. Copie (Ctrl+C)")
            print("  3. Me avise que você copiou!")
            print("")
        else:
            print("")
            print("❌ Erro ao gerar o token. Tente novamente!")
    else:
        print("")
        print("❌ Tempo esgotado ou autorização não recebida.")
        print("💡 Dica: Execute o script novamente e clique em 'Autorizar' mais rápido!")
    
    print("")
    input("Aperte ENTER para fechar...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Cancelado pelo usuário.")
    except Exception as e:
        print(f"\n\n❌ Erro inesperado: {e}")
        input("\nAperte ENTER para fechar...")
