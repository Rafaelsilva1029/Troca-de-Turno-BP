#!/bin/bash

echo "Gerando chaves seguras para produção..."
echo ""

# Gerar JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo ""

# Gerar NextAuth Secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""

# Instruções para outras chaves
echo "Para obter as chaves do Supabase:"
echo "1. Acesse: https://app.supabase.com/project/[SEU-PROJETO]/settings/api"
echo "2. Copie 'anon public' para NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "3. Copie 'service_role' para SUPABASE_SERVICE_ROLE_KEY"
echo "4. Copie a URL do projeto para NEXT_PUBLIC_SUPABASE_URL"
echo ""

echo "Para SendGrid:"
echo "1. Acesse: https://app.sendgrid.com/settings/api_keys"
echo "2. Crie uma nova API Key"
echo "3. Copie para SENDGRID_API_KEY"
echo ""

echo "Para AWS S3:"
echo "1. Acesse IAM no console AWS"
echo "2. Crie um usuário com permissões S3"
echo "3. Gere access keys"
echo ""

echo "Para Redis (Upstash):"
echo "1. Acesse: https://console.upstash.com/"
echo "2. Crie um novo database"
echo "3. Copie a Redis URL"
echo ""

echo "Para Google Analytics:"
echo "1. Acesse: https://analytics.google.com/"
echo "2. Crie uma propriedade"
echo "3. Copie o Measurement ID (G-XXXXXXXXXX)"
echo ""

echo "Para Sentry:"
echo "1. Acesse: https://sentry.io/"
echo "2. Crie um novo projeto Next.js"
echo "3. Copie o DSN"
