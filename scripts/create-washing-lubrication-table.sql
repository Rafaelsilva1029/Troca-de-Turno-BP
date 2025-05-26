-- Criar tabela para controle de lavagem e lubrificação logística
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    frota VARCHAR(50) NOT NULL,
    local VARCHAR(100) NOT NULL,
    tipo_preventiva VARCHAR(100) NOT NULL,
    data_programada DATE NOT NULL,
    data_realizada DATE,
    situacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (situacao IN ('PENDENTE', 'ENCERRADO', 'EM_ANDAMENTO')),
    horario_agendado TIME NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_frota ON maintenance_records(frota);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_situacao ON maintenance_records(situacao);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_data_programada ON maintenance_records(data_programada);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_local ON maintenance_records(local);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at
    BEFORE UPDATE ON maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO maintenance_records (frota, local, tipo_preventiva, data_programada, situacao, horario_agendado, observacao) VALUES
('6597', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-26', 'PENDENTE', '04:00', 'TROCA DE ÓLEO'),
('8805', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-27', 'PENDENTE', '08:00', 'EM VIAGEM'),
('4597', 'LUBRIFICADOR', 'lubrificacao', '2025-01-28', 'EM_ANDAMENTO', '14:30', 'Aguardando peças'),
('6602', 'MECANICO', 'troca_oleo', '2025-01-25', 'ENCERRADO', '02:00', 'Concluído com sucesso'),
('4583', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-29', 'PENDENTE', '20:00', 'TROCA DE ÓLEO'),
('4620', 'PATIO', 'lavagem', '2025-01-30', 'PENDENTE', '05:00', ''),
('4581', 'OFICINA', 'lavagem_completa', '2025-01-31', 'PENDENTE', '20:00', 'Limpeza completa necessária')
ON CONFLICT DO NOTHING;

-- Comentários na tabela
COMMENT ON TABLE maintenance_records IS 'Tabela para controle de lavagem e lubrificação logística';
COMMENT ON COLUMN maintenance_records.frota IS 'Número da frota do veículo';
COMMENT ON COLUMN maintenance_records.local IS 'Local onde será realizada a manutenção';
COMMENT ON COLUMN maintenance_records.tipo_preventiva IS 'Tipo de manutenção preventiva';
COMMENT ON COLUMN maintenance_records.data_programada IS 'Data programada para a manutenção';
COMMENT ON COLUMN maintenance_records.data_realizada IS 'Data em que a manutenção foi realizada';
COMMENT ON COLUMN maintenance_records.situacao IS 'Situação atual da manutenção';
COMMENT ON COLUMN maintenance_records.horario_agendado IS 'Horário agendado para a manutenção';
COMMENT ON COLUMN maintenance_records.observacao IS 'Observações sobre a manutenção';
