-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de configurações de usuário
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  dashboard_layout JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de pendências
CREATE TABLE IF NOT EXISTS pendencias (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Tabela de pendências liberadas
CREATE TABLE IF NOT EXISTS pendencias_liberadas (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  equipment_id VARCHAR(100) NOT NULL,
  released_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Tabela de programação de turno
CREATE TABLE IF NOT EXISTS programacao_turno (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Tabela de veículos logística
CREATE TABLE IF NOT EXISTS veiculos_logistica (
  id SERIAL PRIMARY KEY,
  frota VARCHAR(50) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  placa VARCHAR(20) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  ano VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL,
  ultimaManutencao DATE,
  proximaManutencao DATE,
  motorista VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Tabela de registros de manutenção
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frota VARCHAR(50) NOT NULL,
  descricao_ponto VARCHAR(50) NOT NULL,
  tipo_preventiva VARCHAR(50) NOT NULL,
  data_programada DATE NOT NULL,
  data_realizada DATE,
  situacao VARCHAR(20) NOT NULL,
  horario_agendado VARCHAR(10) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responsavel VARCHAR(100),
  km_atual INTEGER,
  proximo_km INTEGER,
  tempo_execucao INTEGER,
  produtos_utilizados TEXT,
  user_id UUID REFERENCES users(id)
);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  due_time VARCHAR(10) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  assigned_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notified BOOLEAN DEFAULT FALSE,
  one_hour_notified BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id)
);

-- Tabela de relatórios salvos
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  filters JSONB NOT NULL,
  sortOption VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewMode VARCHAR(20),
  visibleColumns JSONB,
  user_id UUID REFERENCES users(id)
);

-- Tabela de execuções de relatórios
CREATE TABLE IF NOT EXISTS report_executions (
  id SERIAL PRIMARY KEY,
  report_id UUID NOT NULL,
  report_title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  row_count INTEGER NOT NULL,
  parameters JSONB NOT NULL,
  user_id UUID REFERENCES users(id)
);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_url TEXT,
  action_text VARCHAR(100),
  source VARCHAR(100)
);

-- Tabela de verificação de saúde
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pendencias_category ON pendencias(category);
CREATE INDEX IF NOT EXISTS idx_pendencias_liberadas_category ON pendencias_liberadas(category);
CREATE INDEX IF NOT EXISTS idx_veiculos_logistica_frota ON veiculos_logistica(frota);
CREATE INDEX IF NOT EXISTS idx_veiculos_logistica_status ON veiculos_logistica(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_frota ON maintenance_records(frota);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_situacao ON maintenance_records(situacao);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_data_programada ON maintenance_records(data_programada);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_logs_event ON logs(event);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Criar funções e triggers para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para todas as tabelas relevantes
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'users', 'user_settings', 'pendencias', 'pendencias_liberadas', 
      'programacao_turno', 'veiculos_logistica', 'maintenance_records', 
      'reminders', 'saved_reports'
    )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Inserir registro inicial na tabela health_check
INSERT INTO health_check (status) VALUES ('ok');

-- Criar usuário admin inicial se não existir
INSERT INTO users (email, full_name, role, is_active)
VALUES ('admin@brancoperesagro.com.br', 'Administrador', 'admin', true)
ON CONFLICT (email) DO NOTHING;
