# Prontuario.ai

SaaS para psicólogos e terapeutas. Prontuário digital com IA, agendamento online, triagem pré-sessão via WhatsApp, transcrição de sessões e análise emocional automatizada.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend / API | Next.js 14 App Router + Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL + Auth + Storage + RLS) |
| WhatsApp | Baileys (Node.js — Railway) |
| Google Calendar | googleapis OAuth2 |
| Pagamentos | Stripe (subscriptions + per-patient billing) |
| IA — Análise | Anthropic Claude Sonnet |
| IA — Transcrição | OpenAI Whisper |
| Deploy web | Vercel (região GRU) |
| Deploy API | Railway (Docker) |

## Estrutura

```
prontuario-ai/
├── web/               # Next.js 14
│   ├── app/
│   │   ├── (auth)/    # login, cadastro, recuperar-senha, redefinir-senha
│   │   ├── (dashboard)/
│   │   │   ├── agenda/           # grade semanal + disponibilidades
│   │   │   ├── configuracoes/    # perfil, WhatsApp, Google Calendar, plano
│   │   │   ├── dashboard/        # KPIs + gráfico emocional
│   │   │   ├── eventos/          # feed de mensagens WhatsApp
│   │   │   ├── pacientes/        # CRUD prontuário
│   │   │   ├── sessoes/          # upload áudio + resumo IA
│   │   │   └── triagens/         # análise pré-sessão
│   │   ├── agendar/[slug]/       # página pública de agendamento
│   │   ├── avaliacao/[token]/    # avaliação pós-sessão (pública)
│   │   ├── triagem/[token]/      # triagem pré-sessão (pública)
│   │   ├── api/                  # route handlers
│   │   ├── actions/              # server actions
│   │   └── precos/               # landing de preços
│   ├── components/
│   ├── lib/
│   │   ├── ai/claude.ts          # resumirSessao, analisarTriagem
│   │   ├── google.ts             # criarEventoCalendar, deletarEventoCalendar
│   │   ├── stripe.ts             # syncPacientesStripe, createPortalSession
│   │   ├── whatsapp.ts           # sendWhatsApp
│   │   └── supabase/             # createClient, createServiceClient
│   └── middleware.ts
├── api/               # Node.js Express (Railway)
│   ├── src/
│   │   ├── whatsapp/
│   │   │   ├── manager.ts        # Baileys multi-session
│   │   │   └── handlers.ts       # captura mensagens recebidas
│   │   ├── scheduler/
│   │   │   ├── lembretes.ts      # 10:00 — lembretes sessão amanhã
│   │   │   ├── triagens.ts       # 10:05 — envia link triagem
│   │   │   └── avaliacoes.ts     # */15min — envia link avaliação
│   │   ├── routes/
│   │   │   ├── whatsapp.ts       # /status, /qr, /disconnect, /send
│   │   │   └── health.ts
│   │   └── index.ts
│   ├── Dockerfile
│   └── railway.json
└── supabase/
    └── schema.sql
```

## Setup

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute `supabase/schema.sql` no SQL Editor
3. Em **Storage**, crie um bucket `audios` (privado)
4. Em **Auth > Providers**, ative Email e Google
5. Em **Auth > URL Configuration**:
   - Site URL: `https://seudominio.com`
   - Redirect URLs: `https://seudominio.com/api/auth/callback`

### 2. Google Cloud

1. Crie um projeto em [console.cloud.google.com](https://console.cloud.google.com)
2. Ative a **Google Calendar API**
3. Crie credenciais OAuth 2.0 (tipo: Web application)
4. Adicione URI de redirecionamento: `https://seudominio.com/api/google/callback`
5. Copie Client ID e Client Secret

### 3. Stripe

1. Crie dois produtos/preços:
   - **Base**: R$ 29,90/mês (recurring) → anote o `price_id`
   - **Por paciente**: R$ 2,99/mês por unidade (per-seat) → anote o `price_id`
2. Configure o Webhook para `https://seudominio.com/api/stripe/webhook`
   - Eventos: `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`
3. Copie o Webhook Secret

### 4. Deploy da API (Railway)

1. Conecte o repositório ao Railway, pasta raiz: `api/`
2. Configure as variáveis de ambiente (ver `api/.env.example`):

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
API_SECRET=uma-chave-secreta-forte
APP_URL=https://seudominio.com
PORT=3001
```

O Railway detecta o `Dockerfile` automaticamente.

### 5. Deploy do Web (Vercel)

1. Conecte o repositório ao Vercel, pasta raiz: `web/`
2. Configure as variáveis de ambiente (ver `web/.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASE=price_...
STRIPE_PRICE_ID_PACIENTE=price_...

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://seudominio.com/api/google/callback

ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

API_URL=https://prontuario-api.railway.app
API_SECRET=uma-chave-secreta-forte

NEXT_PUBLIC_APP_URL=https://seudominio.com
```

### 6. Desenvolvimento local

```bash
# Web
cd web
cp .env.local.example .env.local
# Preencha .env.local com suas chaves de desenvolvimento
npm install
npm run dev     # http://localhost:3000

# API
cd api
cp .env.example .env
# Preencha .env
npm install
npm run dev     # http://localhost:3001
```

## Funcionalidades

### Para o terapeuta
- **Dashboard** — KPIs (pacientes, sessões), evolução emocional 30 dias, notificações, alertas de triagem com risco alto
- **Pacientes** — Prontuário completo (anamnese, medicamentos, contato de emergência), histórico de sessões, arquivamento LGPD
- **Agenda** — Grade semanal interativa, click-to-schedule, sync automático com Google Calendar (criação/cancelamento de eventos)
- **Disponibilidade** — `/agenda/disponibilidades` — configura blocos por dia da semana; gera horários de 1h automaticamente
- **Link de agendamento** — `/agendar/[slug]` — paciente escolhe data/horário disponível, cadastro automático
- **Sessões** — Upload de áudio até 200MB (mp3/mp4/m4a/wav/ogg/webm), transcrição via Whisper, resumo Claude (temas, emoções, alertas, plano próxima sessão)
- **Triagens** — Lista com badge de risco (alto/médio/baixo), detalhe com análise IA, barras valence/arousal
- **Eventos** — Feed categorizado de mensagens WhatsApp dos pacientes (crise/recaída/progresso/cotidiano)
- **Configurações** — Perfil profissional, QR code WhatsApp (Baileys), OAuth Google Calendar, plano Stripe + estimativa de cobrança

### Para o paciente (sem login)
- **Agendamento** — `/agendar/[slug]` — formulário + calendário de disponibilidade
- **Triagem pré-sessão** — `/triagem/[token]` — 3 etapas: humor geral, eventos da semana, foco da sessão
- **Avaliação pós-sessão** — `/avaliacao/[token]` — 5 estrelas + comentário; nota ≥ 4 → convite Google Review

### Automações
| Horário | Ação |
|---|---|
| 10:00 (diário) | Lembrete de sessão amanhã via WhatsApp |
| 10:05 (diário) | Link de triagem pré-sessão via WhatsApp |
| */15min | Link de avaliação 60min após fim da sessão |

## Modelo de preços

- R$ 29,90/mês (base) + R$ 2,99 por paciente ativo/mês
- 14 dias de trial gratuito (sem cartão de crédito)
- Billing gerenciado via Stripe Customer Portal

## PWA

Gere os ícones e coloque em `web/public/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Use [realfavicongenerator.net](https://realfavicongenerator.net) com a cor `#0d9488`.

## Segurança

- RLS no Supabase em todas as tabelas — cada terapeuta acessa apenas seus próprios dados
- Páginas públicas usam `createServiceClient()` via API routes — service role key nunca exposta no browser
- Webhook Stripe verificado via `stripe.webhooks.constructEvent`
- API Railway autenticada via header `x-api-secret` em todos os endpoints
- Áudios com signed URLs de 60 segundos no Supabase Storage
- Senhas mínimo 8 caracteres + recuperação via email com link temporário
