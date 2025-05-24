-- Script de inicialização para produção
-- Execute este script no Supabase SQL Editor

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pendencias_category ON pendencias(category);
CREATE INDEX IF NOT EXISTS idx_pendencias_created_at ON pendencias(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pendencias_liberadas_category ON pendencias_liberadas(category);
CREATE INDEX IF NOT EXISTS idx_pendencias_liberadas_released_at ON pendencias_liberadas(released_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date, due_time);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_frota ON maintenance_records(frota);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_data_programada ON maintenance_records(data_programada);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_situacao ON maintenance_records(situacao);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON system_alerts(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_logs_event ON logs(event);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Criar políticas de RLS (Row Level Security)
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias_liberadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Políticas para pendencias (todos podem ler, apenas autenticados podem escrever)
CREATE POLICY "Pendencias são visíveis para todos" ON pendencias
  FOR SELECT USING (true);

CREATE POLICY "Apenas usuários autenticados podem inserir pendencias" ON pendencias
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas usuários autenticados podem atualizar pendencias" ON pendencias
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas usuários autenticados podem deletar pendencias" ON pendencias
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas similares para outras tabelas
CREATE POLICY "Pendencias liberadas são visíveis para todos" ON pendencias_liberadas
  FOR SELECT USING (true);

CREATE POLICY "Apenas usuários autenticados podem gerenciar pendencias liberadas" ON pendencias_liberadas
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para reminders (usuários só veem seus próprios lembretes)
CREATE POLICY "Usuários veem apenas seus próprios lembretes" ON reminders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem criar seus próprios lembretes" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem atualizar seus próprios lembretes" ON reminders
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários podem deletar seus próprios lembretes" ON reminders
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Criar funções para triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_pendencias_updated_at BEFORE UPDATE ON pendencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pendencias_liberadas_updated_at BEFORE UPDATE ON pendencias_liberadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar função para limpar logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    DELETE FROM system_metrics WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '7 days';
    DELETE FROM system_alerts WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Criar job para limpar logs antigos (executar diariamente)
-- Nota: Você precisará configurar isso no painel do Supabase ou usar pg_cron se disponível

-- Criar views para relatórios
CREATE OR REPLACE VIEW v_pendencias_summary AS
SELECT 
    category,
    COUNT(*) as total,
    MAX(created_at) as last_created
FROM pendencias
GROUP BY category;

CREATE OR REPLACE VIEW v_maintenance_summary AS
SELECT 
    situacao,
    COUNT(*) as total,
    DATE(data_programada) as data
FROM maintenance_records
GROUP BY situacao, DATE(data_programada)
ORDER BY data DESC;

-- Inserir dados de health check inicial
INSERT INTO health_check (status, timestamp) 
VALUES ('healthy', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Conceder permissões apropriadas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Criar backup da estrutura
-- Nota: Configure backups automáticos no painel do Supabase

COMMENT ON DATABASE postgres IS 'Branco Peres Agribusiness - Production Database';
