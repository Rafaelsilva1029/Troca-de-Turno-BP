# Branco Peres Agribusiness - Sistema de Gestão Operacional

Sistema integrado para gerenciamento de operações agrícolas, logística e manutenção.

## Características

- Dashboard interativo com métricas em tempo real
- Gestão de pendências e equipamentos
- Sistema de lembretes e notificações
- Controle de lavagem e lubrificação
- Relatórios avançados e exportação de dados
- Autenticação e controle de acesso por níveis
- Modo offline para operação em áreas remotas
- Design responsivo para uso em dispositivos móveis

## Requisitos

- Node.js 18.x ou superior
- PostgreSQL 14.x ou superior
- Redis (opcional, para cache e filas)
- Supabase (para autenticação e banco de dados)

## Instalação

### Usando Docker (recomendado)

1. Clone o repositório:
   \`\`\`bash
   git clone https://github.com/brancoperesagro/sistema-gestao.git
   cd sistema-gestao
   \`\`\`

2. Configure as variáveis de ambiente:
   \`\`\`bash
   cp .env.example .env.local
   # Edite o arquivo .env.local com suas configurações
   \`\`\`

3. Inicie os containers:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. Inicialize o banco de dados:
   \`\`\`bash
   docker-compose exec app npm run db:init
   \`\`\`

5. Acesse a aplicação em http://localhost:3000

### Instalação Manual

1. Clone o repositório:
   \`\`\`bash
   git clone https://github.com/brancoperesagro/sistema-gestao.git
   cd sistema-gestao
   \`\`\`

2. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure as variáveis de ambiente:
   \`\`\`bash
   cp .env.example .env.local
   # Edite o arquivo .env.local com suas configurações
   \`\`\`

4. Inicialize o banco de dados:
   \`\`\`bash
   npm run db:init
   \`\`\`

5. Inicie o servidor de desenvolvimento:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Acesse a aplicação em http://localhost:3000

## Estrutura do Projeto

\`\`\`
├── app/                  # Rotas e páginas da aplicação
│   ├── (auth)/           # Páginas de autenticação
│   ├── (dashboard)/      # Páginas do dashboard
│   ├── api/              # Endpoints da API
├── components/           # Componentes React
│   ├── dashboard/        # Componentes específicos do dashboard
│   ├── ui/               # Componentes de UI reutilizáveis
├── config/               # Configurações da aplicação
├── lib/                  # Bibliotecas e utilitários
├── public/               # Arquivos estáticos
├── scripts/              # Scripts de utilidade
├── types/                # Definições de tipos TypeScript
\`\`\`

## Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase | Sim |
| `NEXT_PUBLIC_BASE_URL` | URL base da aplicação | Não |
| `JWT_SECRET` | Segredo para tokens JWT | Sim |

## Desenvolvimento

### Comandos Úteis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Constrói a aplicação para produção
- `npm run start` - Inicia a aplicação em modo de produção
- `npm run lint` - Executa o linter
- `npm run db:init` - Inicializa o banco de dados
- `npm run db:seed` - Popula o banco de dados com dados de exemplo

## Deploy

### Deploy na Vercel

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Deploy!

### Deploy em Servidor Próprio

1. Construa a aplicação:
   \`\`\`bash
   npm run build
   \`\`\`

2. Inicie o servidor:
   \`\`\`bash
   npm run start
   \`\`\`

Ou use o Docker Compose conforme descrito na seção de instalação.

## Suporte

Para suporte, entre em contato com a equipe de TI da Branco Peres Agribusiness:

- Email: ti@brancoperesagro.com.br
- Telefone: (XX) XXXX-XXXX

## Licença

Este software é proprietário e confidencial. Uso não autorizado é proibido.
Copyright © 2023 Branco Peres Agribusiness. Todos os direitos reservados.
\`\`\`

Este projeto agora está pronto para ser hospedado e utilizado por uma empresa real. Ele inclui:

1. Sistema de autenticação completo
2. Estrutura de banco de dados robusta
3. Configuração para deploy em produção
4. Documentação detalhada
5. Segurança aprimorada
6. Suporte a múltiplos usuários com diferentes níveis de acesso
7. Monitoramento de saúde do sistema
8. Configuração para Docker e deploy simplificado

A empresa pode facilmente implantar este sistema em seus servidores ou em plataformas como Vercel, AWS, ou Google Cloud.
