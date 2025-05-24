#!/bin/bash

# Cores para melhor visualização
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENV_FILE=".env.production"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE           ${NC}"
echo -e "${BLUE}   Branco Peres Agribusiness                      ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Erro: Arquivo $ENV_FILE não encontrado!${NC}"
  echo "Execute primeiro o script setup-production-env.sh"
  exit 1
fi

# Lista de variáveis obrigatórias
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "POSTGRES_URL"
  "JWT_SECRET"
  "NEXT_PUBLIC_BASE_URL"
)

# Lista de variáveis recomendadas
RECOMMENDED_VARS=(
  "SENTRY_DSN"
  "NEXT_PUBLIC_GA_ID"
  "SENDGRID_API_KEY"
  "AWS_ACCESS_KEY_ID"
  "REDIS_URL"
)

echo -e "${YELLOW}Verificando variáveis obrigatórias...${NC}"
echo ""

MISSING_REQUIRED=0
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^$var=" "$ENV_FILE"; then
    echo -e "${GREEN}✓${NC} $var está configurado"
  else
    echo -e "${RED}✗${NC} $var NÃO está configurado (OBRIGATÓRIO)"
    MISSING_REQUIRED=$((MISSING_REQUIRED+1))
  fi
done

echo ""
echo -e "${YELLOW}Verificando variáveis recomendadas...${NC}"
echo ""

MISSING_RECOMMENDED=0
for var in "${RECOMMENDED_VARS[@]}"; do
  if grep -q "^$var=" "$ENV_FILE"; then
    echo -e "${GREEN}✓${NC} $var está configurado"
  else
    echo -e "${YELLOW}!${NC} $var NÃO está configurado (recomendado)"
    MISSING_RECOMMENDED=$((MISSING_RECOMMENDED+1))
  fi
done

echo ""
echo -e "${BLUE}==================================================${NC}"
if [ $MISSING_REQUIRED -eq 0 ]; then
  echo -e "${GREEN}✓ Todas as variáveis obrigatórias estão configuradas!${NC}"
else
  echo -e "${RED}✗ Faltam $MISSING_REQUIRED variáveis obrigatórias!${NC}"
fi

if [ $MISSING_RECOMMENDED -eq 0 ]; then
  echo -e "${GREEN}✓ Todas as variáveis recomendadas estão configuradas!${NC}"
else
  echo -e "${YELLOW}! Faltam $MISSING_RECOMMENDED variáveis recomendadas.${NC}"
fi
echo -e "${BLUE}==================================================${NC}"

echo ""
if [ $MISSING_REQUIRED -eq 0 ]; then
  echo -e "${GREEN}Seu ambiente está pronto para produção!${NC}"
  echo ""
  echo -e "${YELLOW}Próximos passos:${NC}"
  echo "1. Envie as variáveis para o Vercel:"
  echo -e "   ${GREEN}./scripts/vercel-env-push.sh${NC}"
  echo "2. Execute o deploy:"
  echo -e "   ${GREEN}vercel --prod${NC}"
else
  echo -e "${RED}Seu ambiente NÃO está pronto para produção!${NC}"
  echo ""
  echo -e "${YELLOW}Próximos passos:${NC}"
  echo "1. Configure as variáveis obrigatórias faltantes:"
  echo -e "   ${GREEN}./scripts/setup-production-env.sh${NC}"
fi
