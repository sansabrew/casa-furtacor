-- =============================================================================
-- Casa Furtacor — Schema Supabase
-- Execute este script no SQL Editor do Supabase.
--
-- Compatível com bases novas e existentes:
--   * Tabelas em UUID (gen_random_uuid) com colunas desnormalizadas necessárias
--     para o app (nome/documento/whatsapp do cliente e payload PIX).
--   * `data_evento` fica como TEXT de propósito: a portaria cadastra datas
--     livres, por exemplo "14 de Novembro de 2026".
--   * Idempotente: pode ser executado mais de uma vez sem erro.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. EVENTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(150) NOT NULL,
  local VARCHAR(100) DEFAULT 'Casa Furtacor',
  endereco TEXT DEFAULT 'Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB',
  data_evento TEXT NOT NULL,
  horario VARCHAR(20) NOT NULL,
  valor NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  imagem_url TEXT,
  descricao TEXT,
  capacidade_maxima INTEGER NOT NULL DEFAULT 50,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante colunas extras em bases antigas que possuíam apenas o essencial.
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS capacidade_maxima INTEGER NOT NULL DEFAULT 50;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tags TEXT[];

-- -----------------------------------------------------------------------------
-- 2. CLIENTES (AMIGOS DA CASA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo VARCHAR(150) NOT NULL,
  documento VARCHAR(30) NOT NULL, -- RG ou CPF
  whatsapp VARCHAR(25) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. INGRESSOS AFETIVOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingressos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  codigo_ingresso VARCHAR(30) UNIQUE NOT NULL,
  status_pagamento VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
  valor_pago NUMERIC(10, 2) NOT NULL,
  check_in_realizado BOOLEAN DEFAULT FALSE,
  check_in_hora TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Campos desnormalizados para leitura rápida na portaria (sem JOIN)
  cliente_nome TEXT,
  cliente_documento TEXT,
  cliente_whatsapp TEXT,
  evento_titulo TEXT,
  pix_payload TEXT,
  pedido_id TEXT
);

-- Colunas desnormalizadas para bases antigas.
ALTER TABLE ingressos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE ingressos ADD COLUMN IF NOT EXISTS cliente_documento TEXT;
ALTER TABLE ingressos ADD COLUMN IF NOT EXISTS cliente_whatsapp TEXT;
ALTER TABLE ingressos ADD COLUMN IF NOT EXISTS evento_titulo TEXT;
ALTER TABLE ingressos ADD COLUMN IF NOT EXISTS pix_payload TEXT;
ALTER TABLE ingressos ADD COLUMN IF NOT EXISTS pedido_id TEXT;

-- -----------------------------------------------------------------------------
-- 4. CHAT HÍBRIDO (IA + HUMANO)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL,
  cliente_nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultima_mensagem TEXT,
  unread_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  remetente TEXT NOT NULL CHECK (remetente IN ('cliente', 'ia', 'admin')),
  mensagem TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. ÍNDICES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_eventos_ativo ON eventos(ativo);
CREATE INDEX IF NOT EXISTS idx_ingressos_evento_id ON ingressos(evento_id);
CREATE INDEX IF NOT EXISTS idx_ingressos_cliente_id ON ingressos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ingressos_status ON ingressos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_ingressos_codigo ON ingressos(codigo_ingresso);
CREATE INDEX IF NOT EXISTS idx_ingressos_pedido ON ingressos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);

-- -----------------------------------------------------------------------------
-- 6. EVENTO PADRÃO PARA TESTE (idempotente)
-- -----------------------------------------------------------------------------
INSERT INTO eventos (id, titulo, local, endereco, data_evento, horario, valor, ativo)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Lual dos Librianos',
  'Casa Furtacor',
  'Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB',
  '2026-10-10',
  '19:00h',
  20.00,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingressos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Eventos: leitura pública apenas dos ativos; escrita restrita a autenticados.
DROP POLICY IF EXISTS "Eventos ativos são públicos" ON eventos;
CREATE POLICY "Eventos ativos são públicos" ON eventos
  FOR SELECT TO anon USING (ativo = TRUE);

DROP POLICY IF EXISTS "Administradores leem todos os eventos" ON eventos;
CREATE POLICY "Administradores leem todos os eventos" ON eventos
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Administradores gerenciam eventos" ON eventos;
CREATE POLICY "Administradores gerenciam eventos" ON eventos
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Clientes: cadastro público (sem login); leitura/edição só do admin.
DROP POLICY IF EXISTS "Cadastro público de clientes" ON clientes;
CREATE POLICY "Cadastro público de clientes" ON clientes
  FOR INSERT TO anon WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Administradores gerenciam clientes" ON clientes;
CREATE POLICY "Administradores gerenciam clientes" ON clientes
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Ingressos: compra pública; leitura/edição/check-in só do admin.
DROP POLICY IF EXISTS "Compra pública de ingressos" ON ingressos;
CREATE POLICY "Compra pública de ingressos" ON ingressos
  FOR INSERT TO anon WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Administradores gerenciam ingressos" ON ingressos;
CREATE POLICY "Administradores gerenciam ingressos" ON ingressos
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Chat: visita e equipe acessam livremente (subsistema independente).
DROP POLICY IF EXISTS "Chat acessível" ON chat_sessions;
CREATE POLICY "Chat acessível" ON chat_sessions
  FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Mensagens acessíveis" ON chat_messages;
CREATE POLICY "Mensagens acessíveis" ON chat_messages
  FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- =============================================================================
-- 8. GRANTS
-- =============================================================================
GRANT SELECT ON eventos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON eventos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ingressos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon, authenticated;

-- =============================================================================
-- 9. updated_at automático para chat_sessions
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
