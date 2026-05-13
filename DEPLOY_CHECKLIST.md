# Checklist de Deploy — Prontuario.ai

## Antes de começar

Você vai precisar de contas em:
- [ ] [Supabase](https://supabase.com) — banco de dados + auth + storage
- [ ] [Vercel](https://vercel.com) — deploy do Next.js
- [ ] [Railway](https://railway.app) — deploy da API Node.js
- [ ] [Stripe](https://stripe.com) — pagamentos
- [ ] [Google Cloud Console](https://console.cloud.google.com) — Calendar API
- [ ] [Anthropic](https://console.anthropic.com) — Claude API
- [ ] [OpenAI](https://platform.openai.com) — Whisper API
- [ ] [GitHub](https://github.com) — repositório do código

---

## Passo 1 — Supabase

- [ ] Criar projeto (anote URL e anon key)
- [ ] Copiar service role key (Settings > API)
- [ ] Executar `supabase/schema.sql` no SQL Editor
- [ ] Criar bucket `audios` em Storage (privado)
- [ ] Auth > Providers > Email: ativado
- [ ] Auth > Providers > Google: ativado (precisa de Client ID/Secret do Google)
- [ ] Auth > URL Configuration:
  - Site URL: `https://SEU-DOMINIO.vercel.app`
  - Redirect URLs: `https://SEU-DOMINIO.vercel.app/api/auth/callback`

**Anote:**
```
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Passo 2 — Google Cloud

- [ ] Criar projeto em console.cloud.google.com
- [ ] Ativar Google Calendar API
- [ ] APIs & Services > Credentials > Create OAuth 2.0 Client ID
  - Tipo: Web application
  - Authorized redirect URIs: `https://SEU-DOMINIO.vercel.app/api/google/callback`
- [ ] Copiar Client ID e Client Secret

**Anote:**
```
GOOGLE_CLIENT_ID=XXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://SEU-DOMINIO.vercel.app/api/google/callback
```

---

## Passo 3 — Stripe

- [ ] Ativar conta (modo live para produção, modo test para testes)
- [ ] Criar produto "Prontuario.ai Base":
  - Preço: R$ 29,90/mês recorrente
  - Anote o `price_id` (começa com `price_`)
- [ ] Criar produto "Prontuario.ai por Paciente":
  - Preço: R$ 2,99/mês por unidade
  - Anote o `price_id`
- [ ] Developers > Webhooks > Add endpoint:
  - URL: `https://SEU-DOMINIO.vercel.app/api/stripe/webhook`
  - Eventos:
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.paid`
    - `invoice.payment_failed`
  - Anote o Webhook Signing Secret (`whsec_...`)

**Anote:**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASE=price_...
STRIPE_PRICE_ID_PACIENTE=price_...
```

---

## Passo 4 — APIs de IA

**Anthropic (Claude):**
- [ ] console.anthropic.com > API Keys > Create key

```
ANTHROPIC_API_KEY=sk-ant-...
```

**OpenAI (Whisper):**
- [ ] platform.openai.com > API Keys > Create key

```
OPENAI_API_KEY=sk-...
```

---

## Passo 5 — Gerar API_SECRET

Gere uma chave aleatória forte para autenticar comunicação web ↔ api:

```bash
openssl rand -hex 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```
API_SECRET=CHAVE-GERADA-AQUI
```

---

## Passo 6 — Deploy da API no Railway

```bash
# Instale o Railway CLI
npm install -g @railway/cli

# Login
railway login

# Na pasta api/
cd prontuario-ai/api
railway init
railway up
```

Após o deploy, anote a URL gerada (ex: `https://prontuario-ai-api.railway.app`).

**Variáveis de ambiente no Railway** (Settings > Variables):
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
API_SECRET=...
APP_URL=https://SEU-DOMINIO.vercel.app
PORT=3001
```

---

## Passo 7 — Deploy do Web no Vercel

```bash
# Instale o Vercel CLI
npm install -g vercel

# Login
vercel login

# Na pasta web/
cd prontuario-ai/web
vercel --prod
```

**Variáveis de ambiente no Vercel** (Settings > Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_BASE=...
STRIPE_PRICE_ID_PACIENTE=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://SEU-DOMINIO.vercel.app/api/google/callback

ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

API_URL=https://prontuario-ai-api.railway.app
API_SECRET=...

NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.vercel.app
```

---

## Passo 8 — Após o deploy

- [ ] Abrir `https://SEU-DOMINIO.vercel.app/cadastro` e criar a primeira conta
- [ ] Acessar Configurações > WhatsApp e escanear o QR code
- [ ] Acessar Configurações > Google Calendar e conectar
- [ ] Acessar Agenda > Disponibilidade e configurar horários
- [ ] Copiar o link `/agendar/SEU-SLUG` para compartilhar com pacientes
- [ ] Testar agendamento público em uma aba anônima
- [ ] Verificar se o webhook do Stripe está funcionando (Stripe Dashboard > Webhooks > Recent deliveries)

---

## Comandos úteis pós-deploy

```bash
# Ver logs da API em tempo real
railway logs

# Redesployar a API após mudanças
cd api && railway up

# Redesployar o web após mudanças
cd web && vercel --prod

# Verificar status dos schedulers
railway logs --filter "Schedulers"
```
