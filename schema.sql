-- Schema for Washing and Lubrication Control System

-- Maintenance Records Table
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frota VARCHAR(255) NOT NULL,
  descricao_ponto VARCHAR(255) NOT NULL,
  tipo_preventiva VARCHAR(255) NOT NULL,
  data_programada DATE NOT NULL,
  data_realizada DATE,
  situacao VARCHAR(50) NOT NULL,
  horario_agendado VARCHAR(10) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responsavel VARCHAR(255),
  km_atual INTEGER,
  proximo_km INTEGER,
  tempo_execucao INTEGER,
  produtos_utilizados TEXT
);

-- Create index for faster queries
CREATE INDEX idx_maintenance_records_frota ON maintenance_records(frota);
CREATE INDEX idx_maintenance_records_situacao ON maintenance_records(situacao);
CREATE INDEX idx_maintenance_records_data_programada ON maintenance_records(data_programada);

-- Create RLS policies for security
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can read all maintenance records"
  ON maintenance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance records"
  ON maintenance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their maintenance records"
  ON maintenance_records
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete their maintenance records"
  ON maintenance_records
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_maintenance_records_updated_at
BEFORE UPDATE ON maintenance_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
