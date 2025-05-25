-- Atualizar a estrutura da tabela veiculos_logistica
-- Primeiro, vamos verificar se as colunas existem e adicioná-las se necessário

-- Alterar o tipo da coluna id para string se necessário
ALTER TABLE veiculos_logistica ALTER COLUMN id TYPE TEXT;

-- Adicionar novas colunas se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna categoria
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'categoria') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN categoria TEXT NOT NULL DEFAULT 'veiculos-leves';
    END IF;
    
    -- Adicionar coluna placa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'placa') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN placa TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Adicionar coluna modelo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'modelo') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN modelo TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Adicionar coluna ano
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'ano') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN ano TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Adicionar coluna ultima_manutencao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'ultima_manutencao') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN ultima_manutencao DATE;
    END IF;
    
    -- Adicionar coluna proxima_manutencao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'proxima_manutencao') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN proxima_manutencao DATE;
    END IF;
    
    -- Adicionar coluna motorista
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'motorista') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN motorista TEXT;
    END IF;
    
    -- Adicionar coluna observacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'observacoes') THEN
        ALTER TABLE veiculos_logistica ADD COLUMN observacoes TEXT;
    END IF;
    
    -- Remover coluna item_id se existir (não é mais necessária)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veiculos_logistica' AND column_name = 'item_id') THEN
        ALTER TABLE veiculos_logistica DROP COLUMN item_id;
    END IF;
END $$;

-- Atualizar registros existentes com valores padrão se necessário
UPDATE veiculos_logistica 
SET 
    categoria = COALESCE(categoria, 'veiculos-leves'),
    placa = COALESCE(placa, ''),
    modelo = COALESCE(modelo, ''),
    ano = COALESCE(ano, '2020')
WHERE categoria IS NULL OR placa IS NULL OR modelo IS NULL OR ano IS NULL;
