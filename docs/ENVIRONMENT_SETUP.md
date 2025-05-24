# Configuração de Variáveis de Ambiente

## Desenvolvimento Local

1. Copie o arquivo `.env.local` para a raiz do projeto
2. As variáveis já estão preenchidas com valores de desenvolvimento

## Produção

### 1. Supabase

1. Acesse [Supabase](https://app.supabase.com)
2. Crie um novo projeto ou use um existente
3. Vá em Settings > API
4. Copie:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Gerar Secrets Seguros

Execute o script:
\`\`\`bash
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh
\`\`\`

### 3. SendGrid (Email)

1. Crie uma conta em [SendGrid](https://sendgrid.com)
2. Vá em Settings > API Keys
3. Crie uma Full Access API Key
4. Copie para `SENDGRID_API_KEY`

### 4. AWS S3 (Storage)

1. No console AWS, vá em IAM
2. Crie um usuário com política `AmazonS3FullAccess`
3. Gere access keys
4. Crie um bucket S3 na região `sa-east-1`

### 5. Redis (Cache)

**Opção 1: Upstash (Recomendado)**
1. Crie conta em [Upstash](https://upstash.com)
2. Crie um database Redis
3. Copie a connection string

**Opção 2: Redis Cloud**
1. Use [Redis Cloud](https://redis.com/cloud/)
2. Crie um database free tier
3. Copie a connection string

### 6. Monitoramento

**Sentry:**
1. Crie conta em [Sentry](https://sentry.io)
2. Crie projeto Next.js
3. Copie o DSN

**Google Analytics:**
1. Acesse [Google Analytics](https://analytics.google.com)
2. Crie propriedade
3. Copie Measurement ID

### 7. Configurar no Vercel

1. No dashboard do Vercel, vá em Settings > Environment Variables
2. Adicione cada variável do `.env.production`
3. Marque as variáveis apropriadas para Production/Preview/Development

## Variáveis Obrigatórias

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `JWT_SECRET`
- ✅ `POSTGRES_URL`

## Variáveis Opcionais

- ⚡ `SENDGRID_API_KEY` (para emails)
- ⚡ `AWS_*` (para upload de arquivos)
- ⚡ `REDIS_URL` (para cache)
- ⚡ `SENTRY_DSN` (para monitoramento de erros)
- ⚡ `NEXT_PUBLIC_GA_ID` (para analytics)

## Verificação

Execute o health check após configurar:
\`\`\`bash
curl https://seu-dominio.vercel.app/api/health
\`\`\`

Resposta esperada:
\`\`\`json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected",
  "version": "1.0.0"
}
