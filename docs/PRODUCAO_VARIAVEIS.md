# Guia de Configuração de Variáveis para Produção

Este guia explica como configurar todas as variáveis de ambiente necessárias para o ambiente de produção do Sistema de Gestão Operacional da Branco Peres Agribusiness.

## Método Automatizado (Recomendado)

Utilizamos scripts para automatizar o processo de configuração:

1. Execute o script de configuração:
   \`\`\`bash
   chmod +x scripts/setup-production-env.sh
   ./scripts/setup-production-env.sh
   \`\`\`

2. Siga as instruções na tela para inserir os valores necessários.

3. Envie as variáveis para o Vercel:
   \`\`\`bash
   chmod +x scripts/vercel-env-push.sh
   ./scripts/vercel-env-push.sh
   \`\`\`

## Configuração Manual

Se preferir configurar manualmente, siga estas etapas:

### 1. Supabase

Acesse o [Dashboard do Supabase](https://app.supabase.com) e obtenha:

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima | Settings > API > Project API keys > `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço | Settings > API > Project API keys > `service_role` |

### 2. PostgreSQL (via Supabase)

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `POSTGRES_HOST` | Host do banco | Settings > Database > Connection Info > Host |
| `POSTGRES_PASSWORD` | Senha do banco | Settings > Database > Connection Info > Password |
| `POSTGRES_URL` | URL completa | Construa usando: `postgresql://postgres:SENHA@HOST:5432/postgres` |

### 3. Secrets de Segurança

Gere secrets seguros com:
\`\`\`bash
openssl rand -base64 32
\`\`\`

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Secret para tokens JWT |
| `NEXTAUTH_SECRET` | Secret para NextAuth |

### 4. URLs da Aplicação

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_BASE_URL` | URL base | `https://brancoperes.com.br` |
| `NEXT_PUBLIC_API_URL` | URL da API | `https://brancoperes.com.br/api` |
| `NEXTAUTH_URL` | URL para auth | `https://brancoperes.com.br` |

### 5. Monitoramento

#### Sentry
1. Crie uma conta em [Sentry](https://sentry.io)
2. Crie um projeto Next.js
3. Obtenha o DSN em Project Settings > Client Keys

| Variável | Descrição |
|----------|-----------|
| `SENTRY_DSN` | DSN do Sentry |

#### Google Analytics
1. Crie uma propriedade em [Google Analytics](https://analytics.google.com)
2. Obtenha o ID de medição (formato G-XXXXXXXXXX)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_GA_ID` | ID do Google Analytics |

### 6. Email (SendGrid)

1. Crie uma conta em [SendGrid](https://sendgrid.com)
2. Crie uma API key em Settings > API Keys

| Variável | Descrição |
|----------|-----------|
| `SENDGRID_API_KEY` | API key do SendGrid |

### 7. Armazenamento (AWS S3)

1. Crie um bucket S3 na [AWS](https://aws.amazon.com)
2. Crie um usuário IAM com permissões para o bucket
3. Gere access keys para o usuário

| Variável | Descrição |
|----------|-----------|
| `AWS_ACCESS_KEY_ID` | Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key |
| `AWS_REGION` | Região (ex: sa-east-1) |
| `S3_BUCKET_NAME` | Nome do bucket |

### 8. Cache (Redis)

Recomendamos [Upstash](https://upstash.com) para Redis serverless:

1. Crie uma conta e um database
2. Obtenha a URL de conexão

| Variável | Descrição |
|----------|-----------|
| `REDIS_URL` | URL de conexão Redis |

### 9. Outras Variáveis

| Variável | Descrição | Valor |
|----------|-----------|-------|
| `NODE_ENV` | Ambiente | `production` |
| `NEXT_PUBLIC_APP_VERSION` | Versão | `1.0.0` |
| `LOG_LEVEL` | Nível de logs | `error` |

## Adicionando Variáveis no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com)
2. Selecione seu projeto
3. Vá para Settings > Environment Variables
4. Adicione cada variável, marcando para qual ambiente ela se aplica (Production)
5. Clique em Save

## Verificação

Após o deploy, verifique se as variáveis estão funcionando corretamente:

\`\`\`bash
curl https://seu-dominio.vercel.app/api/health
\`\`\`

Resposta esperada:
\`\`\`json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
\`\`\`

## Solução de Problemas

Se encontrar problemas:

1. Verifique os logs no dashboard do Vercel
2. Confirme se todas as variáveis estão configuradas corretamente
3. Teste a conexão com o banco de dados
4. Verifique se as chaves do Supabase estão corretas
\`\`\`

Agora, vamos criar um arquivo de exemplo com valores reais para produção:
