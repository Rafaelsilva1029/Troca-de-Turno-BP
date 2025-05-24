#!/bin/bash

# Cores para melhor visualização
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   CONFIGURAÇÃO DE VARIÁVEIS PARA PRODUÇÃO        ${NC}"
echo -e "${BLUE}   Branco Peres Agribusiness                      ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Criar arquivo .env.production
ENV_FILE=".env.production"
touch $ENV_FILE
echo "# Variáveis de ambiente para produção - Gerado em $(date)" > $ENV_FILE
echo "# Branco Peres Agribusiness - Sistema de Gestão Operacional" >> $ENV_FILE
echo "" >> $ENV_FILE

# Função para adicionar variável ao arquivo
add_var() {
  echo "$1=$2" >> $ENV_FILE
  echo -e "${GREEN}✓${NC} $1 configurado"
}

# Função para gerar secret seguro
generate_secret() {
  openssl rand -base64 32
}

echo -e "${YELLOW}Gerando secrets seguros...${NC}"
JWT_SECRET=$(generate_secret)
add_var "JWT_SECRET" "$JWT_SECRET"

NEXTAUTH_SECRET=$(generate_secret)
add_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"

echo ""
echo -e "${YELLOW}Configurando Supabase...${NC}"
echo -e "Acesse: ${BLUE}https://app.supabase.com/project/_/settings/api${NC}"
echo "Copie os valores do seu projeto Supabase:"
echo ""

read -p "URL do Supabase (ex: https://abcdefghijklm.supabase.co): " SUPABASE_URL
add_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"

read -p "Chave anon/public: " SUPABASE_ANON_KEY
add_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
add_var "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

read -p "Chave service_role: " SUPABASE_SERVICE_ROLE_KEY
add_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
add_var "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo -e "${YELLOW}Configurando PostgreSQL (via Supabase)...${NC}"
echo "Acesse: ${BLUE}https://app.supabase.com/project/_/settings/database${NC}"
echo ""

read -p "Host do PostgreSQL (ex: db.abcdefghijklm.supabase.co): " PG_HOST
add_var "POSTGRES_HOST" "$PG_HOST"

read -p "Senha do PostgreSQL: " PG_PASSWORD
add_var "POSTGRES_PASSWORD" "$PG_PASSWORD"
add_var "POSTGRES_USER" "postgres"
add_var "POSTGRES_DATABASE" "postgres"

# Construir URLs do PostgreSQL
PG_URL="postgresql://postgres:$PG_PASSWORD@$PG_HOST:5432/postgres"
add_var "POSTGRES_URL" "$PG_URL"
add_var "POSTGRES_URL_NON_POOLING" "$PG_URL"
add_var "POSTGRES_PRISMA_URL" "$PG_URL?pgbouncer=true&connect_timeout=15"

echo ""
echo -e "${YELLOW}Configurando URLs da aplicação...${NC}"
read -p "URL base da aplicação (ex: https://brancoperes.com.br): " BASE_URL
add_var "NEXT_PUBLIC_BASE_URL" "$BASE_URL"
add_var "NEXT_PUBLIC_API_URL" "$BASE_URL/api"
add_var "NEXTAUTH_URL" "$BASE_URL"

echo ""
echo -e "${YELLOW}Configurando monitoramento...${NC}"
echo -e "Para Sentry, crie um projeto em: ${BLUE}https://sentry.io/${NC}"
read -p "Sentry DSN (deixe em branco para pular): " SENTRY_DSN
if [ ! -z "$SENTRY_DSN" ]; then
  add_var "SENTRY_DSN" "$SENTRY_DSN"
fi

echo -e "Para Google Analytics, crie uma propriedade em: ${BLUE}https://analytics.google.com/${NC}"
read -p "Google Analytics ID (ex: G-XXXXXXXXXX, deixe em branco para pular): " GA_ID
if [ ! -z "$GA_ID" ]; then
  add_var "NEXT_PUBLIC_GA_ID" "$GA_ID"
fi

echo ""
echo -e "${YELLOW}Configurando email (SendGrid)...${NC}"
echo -e "Crie uma API key em: ${BLUE}https://app.sendgrid.com/settings/api_keys${NC}"
read -p "SendGrid API Key (deixe em branco para pular): " SENDGRID_KEY
if [ ! -z "$SENDGRID_KEY" ]; then
  add_var "SENDGRID_API_KEY" "$SENDGRID_KEY"
fi

echo ""
echo -e "${YELLOW}Configurando armazenamento (AWS S3)...${NC}"
read -p "Configurar AWS S3? (s/n): " SETUP_S3
if [ "$SETUP_S3" = "s" ]; then
  read -p "AWS Access Key ID: " AWS_ACCESS_KEY
  add_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY"
  
  read -p "AWS Secret Access Key: " AWS_SECRET_KEY
  add_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_KEY"
  
  read -p "AWS Region (padrão: sa-east-1): " AWS_REGION
  AWS_REGION=${AWS_REGION:-sa-east-1}
  add_var "AWS_REGION" "$AWS_REGION"
  
  read -p "S3 Bucket Name (ex: brancoperes-producao): " S3_BUCKET
  add_var "S3_BUCKET_NAME" "$S3_BUCKET"
fi

echo ""
echo -e "${YELLOW}Configurando cache (Redis)...${NC}"
echo -e "Recomendamos Upstash: ${BLUE}https://console.upstash.com/${NC}"
read -p "Redis URL (deixe em branco para pular): " REDIS_URL
if [ ! -z "$REDIS_URL" ]; then
  add_var "REDIS_URL" "$REDIS_URL"
fi

echo ""
echo -e "${YELLOW}Configurando outras variáveis...${NC}"
add_var "NODE_ENV" "production"
add_var "NEXT_PUBLIC_APP_VERSION" "1.0.0"
add_var "LOG_LEVEL" "error"

echo ""
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}✓ Configuração concluída!${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "Arquivo ${GREEN}$ENV_FILE${NC} criado com sucesso."
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Revise o arquivo $ENV_FILE"
echo "2. Adicione as variáveis no Vercel:"
echo -e "   ${BLUE}https://vercel.com/[seu-time]/[seu-projeto]/settings/environment-variables${NC}"
echo "3. Execute o deploy:"
echo -e "   ${GREEN}vercel --prod${NC}"
echo ""
echo -e "${RED}IMPORTANTE:${NC} Mantenha estas variáveis seguras e nunca as compartilhe!"
