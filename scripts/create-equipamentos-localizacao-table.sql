-- Criar tabela para equipamentos localização
CREATE TABLE IF NOT EXISTS equipamentos_localizacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_frota VARCHAR(50) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    localizacao VARCHAR(255) NOT NULL,
    servico TEXT,
    status VARCHAR(50) DEFAULT 'ATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipamentos_localizacao_categoria ON equipamentos_localizacao(categoria);
CREATE INDEX IF NOT EXISTS idx_equipamentos_localizacao_numero_frota ON equipamentos_localizacao(numero_frota);
CREATE INDEX IF NOT EXISTS idx_equipamentos_localizacao_status ON equipamentos_localizacao(status);

-- Inserir dados de exemplo
INSERT INTO equipamentos_localizacao (numero_frota, categoria, localizacao, servico, status) VALUES
('4575', 'PIPAS ÁGUA BRUTA', 'Fundo 14', 'Molhando trajeto fundo 14 até 24', 'ATIVO'),
('4607', 'PIPAS ÁGUA BRUTA', 'Pátio Usina', 'Abastecimento de água', 'ATIVO'),
('3421', 'MUNCK DISPONÍVEL', 'Oficina Central', 'Disponível para serviços', 'ATIVO'),
('5678', 'CAÇAMBAS DISPONÍVEIS', 'Setor Norte', 'Coleta de resíduos', 'ATIVO'),
('7890', 'VEÍCULOS', 'Garagem Principal', 'Transporte de pessoal', 'MANUTENÇÃO');

COMMENT ON TABLE equipamentos_localizacao IS 'Tabela para controle de localização dos equipamentos por categoria';
