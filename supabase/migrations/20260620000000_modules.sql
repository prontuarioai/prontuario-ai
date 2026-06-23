-- Módulos contratados por terapeuta (array de strings)
ALTER TABLE terapeutas
  ADD COLUMN IF NOT EXISTS enabled_modules text[] NOT NULL DEFAULT '{"agenda"}',
  ADD COLUMN IF NOT EXISTS brand_context   text NOT NULL DEFAULT 'agenda_online_ai';

-- Tabela de módulos ativos (um registro por módulo por terapeuta)
CREATE TABLE IF NOT EXISTS modulos_ativos (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terapeuta_id                uuid NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
  modulo                      text NOT NULL CHECK (modulo IN ('agenda','whatsapp','social')),
  stripe_subscription_item_id text,
  status                      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled')),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (terapeuta_id, modulo)
);

-- RLS para modulos_ativos
ALTER TABLE modulos_ativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terapeuta_ve_proprios_modulos" ON modulos_ativos
  FOR ALL USING (auth.uid() = terapeuta_id);

-- Seed: todos os terapeutas existentes com plano ativo já têm módulo agenda
INSERT INTO modulos_ativos (terapeuta_id, modulo, status)
SELECT id, 'agenda', 'active' FROM terapeutas WHERE plano = 'ativo'
ON CONFLICT (terapeuta_id, modulo) DO NOTHING;
