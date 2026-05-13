-- ============================================================
-- Prontuario.ai — Schema completo
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: terapeutas
-- ============================================================
create table if not exists terapeutas (
  id              uuid primary key references auth.users(id) on delete cascade,
  nome            text not null,
  email           text not null unique,
  crp             text,
  slug            text unique not null,
  bio             text,
  especialidades  text[],
  foto_url        text,
  whatsapp_number text,
  timezone        text not null default 'America/Sao_Paulo',
  google_refresh_token     text,
  google_calendar_id       text,
  google_calendar_connected boolean not null default false,
  google_place_id          text,
  plano           text not null default 'trial' check (plano in ('trial','ativo','inativo')),
  trial_fim       timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id       text unique,
  onboarding_completo      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: assinaturas
-- ============================================================
create table if not exists assinaturas (
  id                  uuid primary key default uuid_generate_v4(),
  terapeuta_id        uuid not null references terapeutas(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_base   text,
  stripe_price_pac    text,
  status              text not null default 'trialing' check (status in ('trialing','active','past_due','canceled','unpaid')),
  periodo_inicio      timestamptz,
  periodo_fim         timestamptz,
  valor_total         numeric(10,2),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- TABELA: pacientes
-- ============================================================
create table if not exists pacientes (
  id              uuid primary key default uuid_generate_v4(),
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  nome            text not null,
  email           text,
  whatsapp        text,
  data_nascimento date,
  cpf             text,
  genero          text check (genero in ('masculino','feminino','outro','prefiro_nao_informar')),
  queixa_principal text,
  historico_medico text,
  medicamentos    text,
  contato_emergencia text,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: sessoes
-- ============================================================
create table if not exists sessoes (
  id              uuid primary key default uuid_generate_v4(),
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  paciente_id     uuid not null references pacientes(id) on delete cascade,
  inicio          timestamptz not null,
  fim             timestamptz not null,
  modalidade      text not null default 'presencial' check (modalidade in ('presencial','online')),
  status          text not null default 'agendada' check (status in ('agendada','realizada','cancelada','faltou')),
  google_event_id text,
  valor           numeric(10,2),
  notas           text,
  link_meet       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: triagens (pré-sessão)
-- ============================================================
create table if not exists triagens (
  id              uuid primary key default uuid_generate_v4(),
  sessao_id       uuid not null references sessoes(id) on delete cascade,
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  paciente_id     uuid not null references pacientes(id) on delete cascade,
  token           text unique not null default encode(gen_random_bytes(32), 'hex'),
  humor_geral     int check (humor_geral between 1 and 10),
  eventos_relevantes text,
  foco_sessao     text,
  analise_ia      jsonb,
  risco_detectado text check (risco_detectado in ('baixo','medio','alto')),
  respondida_em   timestamptz,
  enviada_em      timestamptz,
  lida_terapeuta  boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: avaliacoes_pos_sessao
-- ============================================================
create table if not exists avaliacoes_pos_sessao (
  id              uuid primary key default uuid_generate_v4(),
  sessao_id       uuid not null references sessoes(id) on delete cascade,
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  paciente_id     uuid not null references pacientes(id) on delete cascade,
  token           text unique not null default encode(gen_random_bytes(32), 'hex'),
  nota            int check (nota between 1 and 5),
  comentario      text,
  respondida_em   timestamptz,
  enviada_em      timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: eventos_entre_sessoes
-- ============================================================
create table if not exists eventos_entre_sessoes (
  id              uuid primary key default uuid_generate_v4(),
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  paciente_id     uuid not null references pacientes(id) on delete cascade,
  mensagem        text not null,
  categoria       text default 'outro' check (categoria in ('crise','progresso','recaida','cotidiano','outro')),
  intensidade_emocional int check (intensidade_emocional between 1 and 10),
  lido            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: transcricoes
-- ============================================================
create table if not exists transcricoes (
  id              uuid primary key default uuid_generate_v4(),
  sessao_id       uuid not null references sessoes(id) on delete cascade,
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  audio_url       text,
  texto           text,
  status          text not null default 'pendente' check (status in ('pendente','processando','concluido','erro')),
  duracao_segundos int,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: resumos_ia
-- ============================================================
create table if not exists resumos_ia (
  id              uuid primary key default uuid_generate_v4(),
  sessao_id       uuid not null references sessoes(id) on delete cascade,
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  principais_temas text[],
  emocoes_detectadas text[],
  pontos_trabalhados text,
  plano_proxima_sessao text,
  alertas         text[],
  texto_completo  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: mapa_emocional
-- ============================================================
create table if not exists mapa_emocional (
  id              uuid primary key default uuid_generate_v4(),
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  paciente_id     uuid not null references pacientes(id) on delete cascade,
  sessao_id       uuid references sessoes(id) on delete set null,
  data_referencia date not null default current_date,
  valence         numeric(4,2) check (valence between -1 and 1),
  arousal         numeric(4,2) check (arousal between -1 and 1),
  emocoes         text[],
  fonte           text not null default 'sessao' check (fonte in ('sessao','triagem')),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: notificacoes
-- ============================================================
create table if not exists notificacoes (
  id              uuid primary key default uuid_generate_v4(),
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  paciente_id     uuid references pacientes(id) on delete set null,
  sessao_id       uuid references sessoes(id) on delete set null,
  mensagem        text not null,
  tipo            text not null default 'info' check (tipo in ('info','alerta','sucesso','erro')),
  lida            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- TABELA: disponibilidades (agenda pública)
-- ============================================================
create table if not exists disponibilidades (
  id              uuid primary key default uuid_generate_v4(),
  terapeuta_id    uuid not null references terapeutas(id) on delete cascade,
  dia_semana      int not null check (dia_semana between 0 and 6),
  hora_inicio     time not null,
  hora_fim        time not null,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_pacientes_terapeuta on pacientes(terapeuta_id);
create index if not exists idx_sessoes_terapeuta on sessoes(terapeuta_id);
create index if not exists idx_sessoes_paciente on sessoes(paciente_id);
create index if not exists idx_sessoes_inicio on sessoes(inicio);
create index if not exists idx_triagens_token on triagens(token);
create index if not exists idx_triagens_sessao on triagens(sessao_id);
create index if not exists idx_avaliacoes_token on avaliacoes_pos_sessao(token);
create index if not exists idx_eventos_terapeuta on eventos_entre_sessoes(terapeuta_id);
create index if not exists idx_eventos_paciente on eventos_entre_sessoes(paciente_id);
create index if not exists idx_mapa_terapeuta on mapa_emocional(terapeuta_id);
create index if not exists idx_mapa_paciente on mapa_emocional(paciente_id);
create index if not exists idx_notificacoes_terapeuta on notificacoes(terapeuta_id, lida);
create index if not exists idx_resumos_sessao on resumos_ia(sessao_id);
create index if not exists idx_transcricoes_sessao on transcricoes(sessao_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table terapeutas enable row level security;
alter table assinaturas enable row level security;
alter table pacientes enable row level security;
alter table sessoes enable row level security;
alter table triagens enable row level security;
alter table avaliacoes_pos_sessao enable row level security;
alter table eventos_entre_sessoes enable row level security;
alter table transcricoes enable row level security;
alter table resumos_ia enable row level security;
alter table mapa_emocional enable row level security;
alter table notificacoes enable row level security;
alter table disponibilidades enable row level security;

-- terapeutas
create policy "terapeutas_self" on terapeutas
  for all using (auth.uid() = id);

-- assinaturas
create policy "assinaturas_own" on assinaturas
  for all using (terapeuta_id = auth.uid());

-- pacientes
create policy "pacientes_own" on pacientes
  for all using (terapeuta_id = auth.uid());

-- sessoes
create policy "sessoes_own" on sessoes
  for all using (terapeuta_id = auth.uid());

-- triagens: terapeuta vê as suas, leitura pública por token via service role
create policy "triagens_own" on triagens
  for all using (terapeuta_id = auth.uid());

-- avaliacoes_pos_sessao
create policy "avaliacoes_own" on avaliacoes_pos_sessao
  for all using (terapeuta_id = auth.uid());

-- eventos_entre_sessoes
create policy "eventos_own" on eventos_entre_sessoes
  for all using (terapeuta_id = auth.uid());

-- transcricoes
create policy "transcricoes_own" on transcricoes
  for all using (terapeuta_id = auth.uid());

-- resumos_ia
create policy "resumos_own" on resumos_ia
  for all using (terapeuta_id = auth.uid());

-- mapa_emocional
create policy "mapa_own" on mapa_emocional
  for all using (terapeuta_id = auth.uid());

-- notificacoes
create policy "notificacoes_own" on notificacoes
  for all using (terapeuta_id = auth.uid());

-- disponibilidades: leitura pública (agenda pública), escrita só do dono
create policy "disponibilidades_read" on disponibilidades
  for select using (true);
create policy "disponibilidades_write" on disponibilidades
  for all using (terapeuta_id = auth.uid());

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_terapeutas_updated_at before update on terapeutas
  for each row execute function set_updated_at();
create trigger trg_assinaturas_updated_at before update on assinaturas
  for each row execute function set_updated_at();
create trigger trg_pacientes_updated_at before update on pacientes
  for each row execute function set_updated_at();
create trigger trg_sessoes_updated_at before update on sessoes
  for each row execute function set_updated_at();
create trigger trg_transcricoes_updated_at before update on transcricoes
  for each row execute function set_updated_at();
create trigger trg_resumos_updated_at before update on resumos_ia
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: criar perfil de terapeuta após signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(
    split_part(coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), ' ', 1),
    '[^a-z0-9]', '', 'g'
  ));
  final_slug := base_slug;

  loop
    exit when not exists (select 1 from terapeutas where slug = final_slug);
    counter := counter + 1;
    final_slug := base_slug || counter::text;
  end loop;

  insert into terapeutas (id, nome, email, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    final_slug
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- STORAGE: bucket audios
-- ============================================================
insert into storage.buckets (id, name, public)
values ('audios', 'audios', false)
on conflict (id) do nothing;

-- Terapeuta só acessa seus próprios áudios
create policy "audios_own" on storage.objects
  for all using (
    bucket_id = 'audios'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
