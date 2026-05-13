#!/bin/bash
# Script de deploy do Prontuario.ai
# Execute na sua máquina local onde git/node/vercel/railway estão instalados.

set -e

REPO_URL=""   # ex: git@github.com:seu-usuario/prontuario-ai.git
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Prontuario.ai — Deploy ==="
echo ""

# ─── Pré-requisitos ───────────────────────────────────────────────────────────
check_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌  $1 não encontrado. Instale antes de continuar."
    exit 1
  fi
}

check_tool git
check_tool node
check_tool npm
check_tool vercel
check_tool railway

echo "✅  Ferramentas OK"
echo ""

# ─── 1. Git ───────────────────────────────────────────────────────────────────
echo "── 1/5  Git"

if [ -z "$REPO_URL" ]; then
  echo "   ⚠️  Defina REPO_URL no início do script com a URL do seu repositório GitHub."
  exit 1
fi

cd "$PROJECT_DIR"

if [ ! -d ".git" ]; then
  git init
  git remote add origin "$REPO_URL"
fi

git add .
git commit -m "chore: deploy inicial Prontuario.ai" --allow-empty
git branch -M main
git push -u origin main

echo "   ✅  Código enviado para GitHub"
echo ""

# ─── 2. Supabase (manual) ─────────────────────────────────────────────────────
echo "── 2/5  Supabase (verificação manual)"
echo "   1. Execute supabase/schema.sql no SQL Editor do seu projeto"
echo "   2. Crie o bucket 'audios' em Storage (privado)"
echo "   3. Em Auth > URL Config, adicione a URL do seu domínio Vercel + /api/auth/callback"
echo "   Pressione Enter quando estiver pronto..."
read -r

# ─── 3. API — Railway ─────────────────────────────────────────────────────────
echo "── 3/5  API — Railway"
echo ""
echo "   Fazendo login no Railway..."
railway login

echo "   Criando projeto Railway..."
cd "$PROJECT_DIR/api"
railway init --name prontuario-ai-api

echo ""
echo "   Configure as variáveis de ambiente da API no Railway:"
echo "   (Você pode usar o dashboard ou o arquivo api/.env.example como referência)"
echo ""
echo "   railway variables set SUPABASE_URL=..."
echo "   railway variables set SUPABASE_SERVICE_ROLE_KEY=..."
echo "   railway variables set ANTHROPIC_API_KEY=..."
echo "   railway variables set API_SECRET=..."
echo "   railway variables set APP_URL=https://seu-dominio.vercel.app"
echo "   railway variables set PORT=3001"
echo ""
echo "   Pressione Enter após configurar as variáveis..."
read -r

railway up --detach
API_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
echo "   ✅  API deployada: ${API_URL:-"verifique no dashboard Railway"}"
echo ""

# ─── 4. Web — Vercel ──────────────────────────────────────────────────────────
echo "── 4/5  Web — Vercel"
echo ""
cd "$PROJECT_DIR/web"

echo "   Fazendo login no Vercel..."
vercel login

echo ""
echo "   Configure as variáveis de ambiente da web antes do deploy."
echo "   Você pode usar o arquivo web/.env.local.example como referência."
echo ""
echo "   Para definir via CLI:"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "   vercel env add SUPABASE_SERVICE_ROLE_KEY production"
echo "   vercel env add STRIPE_SECRET_KEY production"
echo "   ... (ver web/.env.local.example para a lista completa)"
echo ""
echo "   Pressione Enter após configurar as variáveis..."
read -r

vercel --prod --yes

echo "   ✅  Web deployada"
echo ""

# ─── 5. Webhook Stripe ────────────────────────────────────────────────────────
echo "── 5/5  Stripe Webhook"
echo ""
VERCEL_URL=$(vercel ls --json 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0].get('url',''))" 2>/dev/null || echo "")
echo "   Configure o webhook no dashboard Stripe:"
echo "   URL: https://${VERCEL_URL:-"SEU-DOMINIO.vercel.app"}/api/stripe/webhook"
echo "   Eventos: customer.subscription.created, customer.subscription.updated,"
echo "            customer.subscription.deleted, invoice.paid, invoice.payment_failed"
echo ""

echo "=== Deploy concluído! ==="
echo ""
echo "Próximos passos:"
echo "  1. Abra seu app no Vercel e crie uma conta de terapeuta"
echo "  2. Configure o WhatsApp em Configurações > WhatsApp (escaneie o QR)"
echo "  3. Conecte o Google Calendar em Configurações > Google Calendar"
echo "  4. Cadastre disponibilidades em Agenda > Disponibilidade"
echo "  5. Compartilhe seu link /agendar/[slug] com pacientes"
