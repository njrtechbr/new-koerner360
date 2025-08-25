# Koerner 360 - Sistema de Gestão de Atendimento

## Descrição

O Koerner 360 é um sistema completo de gestão de atendimento que permite avaliar, monitorar e gamificar o desempenho de atendentes. O sistema oferece funcionalidades de autenticação, gestão de usuários, avaliações, feedback e um sistema de gamificação para motivar e reconhecer o desempenho dos colaboradores.

## Tecnologias Utilizadas

- **Frontend**: Next.js 15 com App Router
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 4.x
- **Componentes UI**: shadcn/ui com Radix UI
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma 6.14.0
- **Autenticação**: Auth.js v5 (NextAuth)
- **Validação**: Zod
- **Notificações**: Sonner
- **Temas**: next-themes (claro/escuro)
- **Build Tool**: Turbopack

## Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- Node.js 18+
- npm, yarn, pnpm ou bun
- PostgreSQL 15+
- Git

## Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd koerner-360
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure as variáveis de ambiente:

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Configure as seguintes variáveis:
DATABASE_URL="postgresql://usuario:senha@localhost:5432/koerner360"
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. Configure o banco de dados:

```bash
# Execute as migrações
npx prisma migrate dev

# (Opcional) Execute o seed para dados iniciais
npx prisma db seed
```

## Como Executar

### Desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Produção

```bash
# Build da aplicação
npm run build

# Iniciar em produção
npm run start
```

## Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Páginas protegidas
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
│   ├── auth/             # Componentes de autenticação
│   ├── forms/            # Formulários
│   ├── layout/           # Componentes de layout
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── usuarios/         # Componentes específicos de usuários
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
│   ├── auth/            # Configurações de autenticação
│   ├── validations/     # Schemas de validação
│   └── utils.ts         # Funções utilitárias
└── middleware.ts         # Middleware do Next.js
```

## Funcionalidades Principais

### 🔐 Sistema de Autenticação

- Login/logout seguro
- Registro de novos usuários
- Recuperação de senha
- Controle de acesso baseado em perfis (Admin, Gestor, Atendente)

### 👥 Gestão de Usuários

- Cadastro e edição de atendentes
- Controle de status (Ativo, Inativo, Suspenso, Treinamento)
- Gestão de dados pessoais e profissionais

### ⭐ Sistema de Avaliações

- Avaliações periódicas de atendentes
- Notas de 1 a 5 com comentários
- Histórico de avaliações

### 💬 Sistema de Feedback

- Coleta de sugestões, reclamações e elogios
- Classificação por tipo e prioridade
- Acompanhamento de resolução

### 🎮 Gamificação

- Sistema de pontos e níveis
- Conquistas e badges
- Ranking de desempenho

## Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento com Turbopack
- `npm run build` - Gera build de produção
- `npm run start` - Executa a aplicação em produção
- `npm run lint` - Executa o linter
- `npm run format` - Formata o código com Prettier

## Banco de Dados

O projeto utiliza PostgreSQL com Prisma ORM. Os principais modelos incluem:

- **Usuario**: Dados básicos e credenciais
- **Atendente**: Informações detalhadas dos atendentes
- **Avaliacao**: Avaliações periódicas
- **Feedback**: Sistema de feedback
- **GamificacaoAtendente**: Pontos e níveis
- **Conquista**: Sistema de conquistas

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Para suporte e dúvidas, entre em contato através dos canais oficiais do projeto.
