#!/bin/bash

# Cores para melhor visualização
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENV_FILE=".env.production"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   ENVIANDO VARIÁVEIS PARA VERCEL                 ${NC}"
echo -e "${BLUE}   Branco Peres Agribusiness                      ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Erro: Arquivo $ENV_FILE não encontrado!${NC}"
  echo "Execute primeiro o script setup-production-env.sh"
  exit 1
fi

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}Vercel CLI não encontrado. Instalando...${NC}"
  npm i -g vercel
fi

# Login no Vercel se necessário
echo -e "${YELLOW}Verificando login no Vercel...${NC}"
vercel whoami &> /dev/null || vercel login

# Perguntar pelo nome do projeto
read -p "Nome do projeto no Vercel (ex: branco-peres): " PROJECT_NAME

echo -e "${YELLOW}Enviando variáveis para o projeto $PROJECT_NAME...${NC}"
echo ""

# Ler o arquivo .env.production e adicionar cada variável ao Vercel
while IFS= read -r line || [[ -n "$line" ]]; do
  # Ignorar linhas em branco ou comentários
  if [[ -z "$line" || "$line" == \#* ]]; then
    continue
  fi
  
  # Extrair nome e valor da variável
  var_name=$(echo "$line" | cut -d '=' -f 1)
  var_value=$(echo "$line" | cut -d '=' -f 2-)
  
  echo -e "Adicionando ${BLUE}$var_name${NC}..."
  
  # Adicionar a variável ao Vercel
  vercel env add "$var_name" production -y --project "$PROJECT_NAME" <<< "$var_value" &> /dev/null
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $var_name adicionado com sucesso"
  else
    echo -e "${RED}✗${NC} Erro ao adicionar $var_name"
  fi
done < "$ENV_FILE"

echo ""
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}✓ Variáveis enviadas para o Vercel!${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Verifique as variáveis no dashboard do Vercel:"
echo -e "   ${BLUE}https://vercel.com/[seu-time]/$PROJECT_NAME/settings/environment-variables${NC}"
echo "2. Execute o deploy:"
echo -e "   ${GREEN}vercel --prod${NC}"
