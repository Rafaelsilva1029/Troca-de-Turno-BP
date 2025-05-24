-- Criar tabela de registros de manutenção
CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  frota VARCHAR(50) NOT NULL,
  descricao_ponto VARCHAR(50) NOT NULL,
  tipo_preventiva VARCHAR(50) NOT NULL,
  data_programada DATE NOT NULL,
  data_realizada DATE,
  situacao VARCHAR(20) NOT NULL,
  horario_agendado VARCHAR(10) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir alguns dados de exemplo
INSERT INTO maintenance_records (frota, descricao_ponto, tipo_preventiva, data_programada, data_realizada, situacao, horario_agendado, observacao)
VALUES
  ('6597', 'LAVADOR', 'lavagem_lubrificacao', '2025-05-11', NULL, 'PENDENTE', '04:00', 'TROCA DE ÓLEO'),
  ('8805', 'LAVADOR', 'lavagem_lubrificacao', '2025-05-17', NULL, 'PENDENTE', '08:00', 'EM VIAGEM'),
  ('4597', 'LAVADOR', 'lavagem_lubrificacao', '2025-05-18', NULL, 'PENDENTE', '14:30', 'EM VIAGEM'),
  ('6602', 'LAVADOR', 'lavagem_lubrificacao', '2025-05-18', NULL, 'PENDENTE', '02:00', 'OFICINA GABELIM'),
  ('8790', 'LAVADOR', 'lavagem_lubrificacao', '2025-05-21', '2025-05-21', 'ENCERRADO', '07:00', NULL);
