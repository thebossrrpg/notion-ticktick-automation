#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 GERADOR DE TOKEN TICKTICK - Para Criancinhas 👶

Este script vai te ajudar a gerar o token de acesso do TickTick.
Você só precisa executar este arquivo e seguir as instruções!
"""

try:
    from ticktick.oauth2 import OAuth2
except ImportError:
    print("❌ ERRO: A biblioteca 'ticktick-py' não está instalada!")
    print("")
    print("Por favor, execute este comando primeiro:")
    print("  pip install ticktick-py")
    print("")
    input("Aperte ENTER para fechar...")
    exit(1)

# ===== SUAS CREDENCIAIS DO TICKTICK =====
# (Copiei do aplicativo que você criou no TickTick Developer Portal)
client_id = "8lYwnAIdpZL96fO8p8"
client_secret = "f7Tyio2GXca90j2rjfW3E87cZgIJb3AR"
redirect_uri = "http://localhost:8080"

print("")
print("=" * 60)
print("  🎯 GERADOR DE TOKEN TICKTICK")
print("=" * 60)
print("")
print("📝 O que vai acontecer agora:")
print("")
print("  1. Seu navegador vai abrir automaticamente")
print("  2. Você verá uma página do TickTick")
print("  3. Clique no botão 'Autorizar' ou 'Allow'")
print("  4. Depois, volte aqui nesta janela!")
print("")
print("⚠️  IMPORTANTE: Não feche esta janela!")
print("")
input("👉 Aperte ENTER quando estiver pronto para começar...")

print("")
print("🔄 Iniciando processo de autenticação...")
print("")

try:
    # Cria o cliente OAuth2
    auth_client = OAuth2(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        scope="tasks:read tasks:write"
    )
    
    # Isso vai abrir seu navegador
    auth_client.get_access_token()
    
    # Se chegou aqui, funcionou!
    print("")
    print("=" * 60)
    print("  🎉 SUCESSO! TOKEN GERADO COM SUCESSO!")
    print("=" * 60)
    print("")
    print("📋 Agora COPIE o token abaixo:")
    print("")
    print("┌" + "─" * 58 + "┐")
    print("│ " + auth_client.token_info["access_token"][:56] + " │")
    if len(auth_client.token_info["access_token"]) > 56:
        remaining = auth_client.token_info["access_token"][56:]
        print("│ " + remaining + " " * (56 - len(remaining)) + " │")
    print("└" + "─" * 58 + "┘")
    print("")
    print("✅ Próximos passos:")
    print("")
    print("  1. Selecione TODO o texto do token acima")
    print("  2. Copie (Ctrl+C no Windows ou Cmd+C no Mac)")
    print("  3. Vá para o GitHub e adicione como secret")
    print("")
    print("📌 Link direto para adicionar secrets:")
    print("   https://github.com/thebossrrpg/notion-ticktick-automation/settings/secrets/actions")
    print("")
    
except Exception as e:
    print("")
    print("❌ Ops! Algo deu errado:")
    print(f"   {str(e)}")
    print("")
    print("💡 Dica: Certifique-se de que você clicou em 'Autorizar' na página do TickTick")
    print("")

input("\nAperte ENTER para fechar...")
