# Requisitos MVP - Koerner 360

**Sistema de Gestão de Feedback e Avaliações 360°**

---

**Versão:** 1.0  
**Data:** 20/08/2025 17:42:45  
**Status:** Documento de Requisitos MVP  
**Autor:** Equipe Koerner 360

---

## 📋 Visão Geral do MVP

O Koerner 360 é um sistema completo de gestão de feedback e avaliações 360° que permite às organizações coletar, analisar e gerenciar avaliações de desempenho de forma estruturada e gamificada. O MVP foca nas funcionalidades essenciais para operação básica do sistema.

### Objetivo Principal

Fornecer uma plataforma robusta para:

- Gestão de usuários e atendentes
- Coleta e análise de avaliações
- Sistema de feedback estruturado
- Gamificação para engajamento
- Relatórios e métricas de performance

---

## 🎯 Funcionalidades Essenciais do MVP

### 1. Sistema de Autenticação e Autorização

#### 1.1 Autenticação Segura

- [ ] Login com email e senha
- [ ] Integração com Auth.js v5 (NextAuth.js)
- [ ] Hash de senhas com bcryptjs
- [ ] Senhas temporárias para novos usuários
- [ ] Middleware de proteção de rotas

#### 1.2 Controle de Acesso por Perfis

- [ ] **Admin**: Acesso total ao sistema
- [ ] **Supervisor**: Gerenciamento de atendentes e avaliações
- [ ] **Atendente**: Visualização de avaliações próprias
- [ ] **Consultor**: Acesso a métricas e rankings (somente leitura)

#### 1.3 Segurança

- [ ] Proteção contra ataques CSRF
- [ ] Validação de entrada com Zod
- [ ] Logs de auditoria
- [ ] Headers de segurança configurados

### 2. Gestão de Usuários

#### 2.1 CRUD de Usuários

- [ ] Cadastro de novos usuários
- [ ] Edição de dados pessoais
- [ ] Ativação/desativação de contas
- [ ] Alteração de perfis de acesso
- [ ] Verificação de email único

#### 2.2 Interface de Usuários

- [ ] Listagem paginada com filtros
- [ ] Busca por nome e email
- [ ] Filtros por tipo e status
- [ ] Modal de boas-vindas para novos usuários
- [ ] Geração de credenciais temporárias

### 3. Gestão de Atendentes

#### 3.1 Cadastro Completo

- [ ] Dados pessoais (nome, email, telefone)
- [ ] Dados profissionais (cargo, setor, portaria)
- [ ] Documentos (RG, CPF)
- [ ] Endereço e observações
- [ ] Upload de foto/avatar
- [ ] Data de admissão e nascimento

#### 3.2 Status e Controle

- [ ] Status: Ativo, Férias, Afastado, Inativo
- [ ] Conversão de atendente para usuário
- [ ] Relacionamento com usuário do sistema
- [ ] Histórico de alterações

### 4. Sistema de Avaliações

#### 4.1 Coleta de Avaliações

- [ ] Avaliações por período (mensal, trimestral, etc.)
- [ ] Notas de 1 a 5
- [ ] Comentários opcionais
- [ ] Relacionamento avaliador/avaliado
- [ ] Prevenção de avaliações duplicadas

#### 4.2 Métricas e Análise

- [ ] Cálculo de médias por período
- [ ] Percentual de satisfação
- [ ] Categorização de notas (excelente, boa, regular, ruim)
- [ ] Histórico temporal de performance

### 5. Sistema de Feedback

#### 5.1 Tipos de Feedback

- [ ] Elogio
- [ ] Sugestão
- [ ] Reclamação
- [ ] Melhoria

#### 5.2 Gestão de Feedback

- [ ] Prioridades: Baixa, Média, Alta, Urgente
- [ ] Status: Pendente, Em Análise, Resolvido, Rejeitado
- [ ] Relacionamento remetente/receptor
- [ ] Histórico de alterações

### 6. Sistema de Gamificação

#### 6.1 Pontuação e Níveis

- [ ] Sistema de pontos baseado em avaliações
- [ ] Níveis de experiência
- [ ] Sequências de bom desempenho
- [ ] Ranking entre atendentes

#### 6.2 Conquistas

- [ ] Sistema de conquistas por categorias:
  - Volume (quantidade de avaliações)
  - Qualidade (notas altas)
  - Consistência (regularidade)
  - Tempo de serviço
  - Especiais (sazonais/únicas)
- [ ] Tipos: Bronze, Prata, Ouro, Platina, Diamante

#### 6.3 Métricas de Performance

- [ ] Métricas por período (mensal, trimestral, anual)
- [ ] Posição no ranking geral e por setor
- [ ] Análise de tendências
- [ ] Comparativos entre atendentes

### 7. Dashboard e Relatórios

#### 7.1 Dashboard Principal

- [ ] Métricas personalizadas por perfil de usuário
- [ ] Gráficos de performance (Recharts)
- [ ] Ações rápidas contextuais
- [ ] Resumo de atividades recentes

#### 7.2 Dashboard Consultor

- [ ] Rankings de atendentes
- [ ] Comparativos de performance
- [ ] Métricas de gamificação
- [ ] Análise de tendências
- [ ] Exportação de dados

#### 7.3 Relatórios

- [ ] Relatórios de avaliações por período
- [ ] Análise de satisfação
- [ ] Performance individual e por equipe
- [ ] Histórico de conquistas

### 8. Sistema de Changelog

#### 8.1 Versionamento Automático

- [ ] Geração automática de informações de build
- [ ] Parser de CHANGELOG.md
- [ ] População automática do banco de dados
- [ ] Categorização de mudanças

#### 8.2 Tipos de Mudanças

- [ ] Adicionado, Alterado, Corrigido
- [ ] Removido, Depreciado, Segurança
- [ ] Prioridades e categorias
- [ ] Página pública de changelog

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica Completa

#### 🎨 Frontend

- **Framework Principal**: Next.js 15.4.6 (App Router)
- **Linguagem**: TypeScript 5.x (strict mode)
- **Runtime React**: React 19.1.0 + React DOM 19.1.0
- **Build Tool**: Turbopack (Next.js 15)
- **Estilização**:
  - Tailwind CSS 4.x com CSS Variables
  - Lightning CSS para otimização
  - PostCSS para processamento
- **Sistema de Componentes**:
  - shadcn/ui (variante new-york)
  - Radix UI primitives
  - Class Variance Authority (CVA)
- **Ícones**: Lucide React 0.539.0
- **Formulários e Validação**:
  - React Hook Form 7.62.0
  - Zod para schemas de validação
  - @hookform/resolvers 5.2.1
- **Visualização de Dados**: Recharts 3.1.2
- **Notificações**: Sonner 2.0.7
- **Utilitários**:
  - date-fns para manipulação de datas
  - clsx para classes condicionais
  - tailwind-merge para merge de classes

#### ⚙️ Backend

- **Runtime**: Node.js com Turbopack
- **Banco de Dados**: PostgreSQL 15+
- **ORM**: Prisma 6.14.0
- **Autenticação**: Auth.js v5.0.0-beta.29 (NextAuth.js)
- **Criptografia**: bcryptjs 3.0.2
- **Validação**: Zod + @hookform/resolvers 5.2.1
- **API**: Next.js Route Handlers (App Router)

#### 🧪 Qualidade e Testes

- **Linting**: ESLint 9 com configuração personalizada
- **Formatação**: Prettier 3.6.2
- **Git Hooks**: Husky + lint-staged
- **Testes**:
  - Jest 29.7.0 (testes unitários)
  - Testing Library (testes de componentes)
  - Playwright (testes E2E)
- **Containerização**: Docker com docker-compose

#### 🛠️ Ferramentas de Desenvolvimento

- **Package Manager**: npm
- **Versionamento**: Git com GitHub
- **CI/CD**: GitHub Actions
- **Monitoramento**: Build info automático
- **Documentação**: Markdown + JSDoc

#### 📦 Dependências Principais

```json
{
  "next": "15.4.6",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "5.x",
  "@prisma/client": "6.14.0",
  "next-auth": "5.0.0-beta.29",
  "tailwindcss": "4.x",
  "@radix-ui/react-*": "latest",
  "react-hook-form": "7.62.0",
  "zod": "latest",
  "recharts": "3.1.2",
  "lucide-react": "0.539.0",
  "sonner": "2.0.7",
  "bcryptjs": "3.0.2",
  "date-fns": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest"
}
```

### Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js 15
│   ├── (auth)/            # Rotas autenticadas
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── usuarios/      # Gestão de usuários
│   │   ├── atendentes/    # Gestão de atendentes
│   │   ├── avaliacoes/    # Gestão de avaliações
│   │   ├── feedbacks/     # Gestão de feedbacks
│   │   └── consultor/     # Dashboard consultor
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação
│   │   ├── usuarios/      # CRUD usuários
│   │   ├── atendentes/    # CRUD atendentes
│   │   ├── consultor/     # Métricas consultor
│   │   └── changelog/     # Sistema changelog
│   └── login/             # Página de login
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── layout/           # Layout components
│   └── [feature]/        # Por funcionalidade
├── lib/                  # Utilitários
│   ├── auth.ts           # Configuração Auth.js
│   ├── prisma.ts         # Cliente Prisma
│   └── validations/      # Schemas Zod
└── types/                # Tipos TypeScript
```

---

## 🗄️ Modelo de Dados

### Entidades Principais

#### Usuario

- **Campos**: id, email, nome, senha, userType, ativo
- **Tipos**: ADMIN, SUPERVISOR, ATENDENTE, CONSULTOR
- **Relacionamentos**: supervisor/supervisões, avaliações, feedbacks

#### Atendente

- **Campos**: dados pessoais, profissionais, documentos
- **Status**: ATIVO, FERIAS, AFASTADO, INATIVO
- **Relacionamentos**: usuário, avaliações, gamificação

#### Avaliacao

- **Campos**: nota (1-5), comentário, período
- **Relacionamentos**: avaliado, avaliador, atendente
- **Restrições**: única por avaliado/avaliador/período

#### Feedback

- **Tipos**: ELOGIO, SUGESTAO, RECLAMACAO, MELHORIA
- **Status**: PENDENTE, EM_ANALISE, RESOLVIDO, REJEITADO
- **Prioridades**: BAIXA, MEDIA, ALTA, URGENTE

#### Gamificação

- **GamificacaoAtendente**: pontos, nível, experiência
- **Conquista**: nome, descrição, requisitos, pontos
- **MetricaPerformance**: métricas por período

---

## 🔐 Segurança e Compliance

### Medidas de Segurança

- [ ] Autenticação robusta com Auth.js
- [ ] Hash de senhas com bcryptjs
- [ ] Validação de entrada com Zod
- [ ] Proteção CSRF
- [ ] Headers de segurança
- [ ] Logs de auditoria
- [ ] Sanitização de dados
- [ ] Rate limiting em APIs críticas

### Controle de Acesso

- [ ] Middleware de autenticação
- [ ] Verificação de permissões por rota
- [ ] Controle granular por perfil
- [ ] Logs de ações sensíveis

---

## 📊 Métricas e KPIs

### Métricas de Usuário

- Total de usuários ativos
- Distribuição por perfil
- Taxa de adoção
- Frequência de uso

### Métricas de Avaliação

- Total de avaliações por período
- Média geral de satisfação
- Distribuição de notas
- Taxa de resposta

### Métricas de Gamificação

- Pontuação média por atendente
- Conquistas mais obtidas
- Evolução de rankings
- Engajamento do sistema

---

## 🚀 Roadmap de Implementação

### Fase 1: Core MVP (Pendente)

- [ ] Sistema de autenticação
- [ ] Gestão de usuários e atendentes
- [ ] Sistema básico de avaliações
- [ ] Dashboard principal

### Fase 2: Gamificação (Pendente)

- [ ] Sistema de pontos e níveis
- [ ] Conquistas e rankings
- [ ] Métricas de performance
- [ ] Dashboard consultor

### Fase 3: Melhorias e Otimizações (Em Andamento)

- [ ] Sistema de changelog automático
- [ ] Auditoria completa
- [ ] Notificações em tempo real
- [ ] Relatórios avançados

### Fase 4: Funcionalidades Avançadas (Planejada)

- [ ] API pública para integrações
- [ ] Mobile app companion
- [ ] IA para análise de feedback
- [ ] Dashboard executivo
- [ ] Exportação avançada de dados

---

## 🎯 Critérios de Aceitação do MVP

### Funcionalidades Obrigatórias

- [ ] Login seguro e controle de acesso
- [ ] CRUD completo de usuários e atendentes
- [ ] Sistema de avaliações funcionando
- [ ] Dashboard com métricas básicas
- [ ] Sistema de gamificação operacional
- [ ] Relatórios de performance

### Qualidade Técnica

- [ ] Código TypeScript sem erros
- [ ] Testes unitários básicos
- [ ] Build sem warnings
- [ ] Performance adequada (< 3s carregamento)
- [ ] Responsividade mobile

### Segurança

- [ ] Autenticação robusta
- [ ] Validação de entrada
- [ ] Logs de auditoria
- [ ] Proteção contra vulnerabilidades comuns

---

## 📈 Métricas de Sucesso

### Adoção

- **Meta**: 80% dos usuários ativos mensalmente
- **Atual**: Sistema em produção

### Performance

- **Meta**: Tempo de carregamento < 3 segundos
- **Meta**: 99% de uptime

### Satisfação

- **Meta**: NPS > 70
- **Meta**: Taxa de retenção > 85%

### Engajamento

- **Meta**: 70% dos atendentes com conquistas
- **Meta**: Média de 10 avaliações/mês por atendente

---

## 🔧 Configuração e Deploy

### Requisitos do Sistema

- **Node.js**: v22.18.0+
- **PostgreSQL**: 15+
- **Memória**: 2GB RAM mínimo
- **Armazenamento**: 10GB disponível

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
NODE_ENV=production
```

### Scripts de Deploy

```bash
npm run build              # Build de produção
npm run lint               # Verificação de código
npx tsc --noEmit          # Verificação TypeScript
npm run build:info         # Atualizar build info
```

---

## 📚 Documentação

### Documentos Disponíveis

- [README.md](../README.md) - Visão geral do projeto
- [CHANGELOG.md](../CHANGELOG.md) - Histórico de versões
- [docs/api.md](./api.md) - Documentação da API
- [docs/development.md](./development.md) - Guia de desenvolvimento
- [docs/setup.md](./setup.md) - Configuração do ambiente
- [docs/database.md](./database.md) - Documentação do banco

### Recursos Adicionais

- Prisma Studio para visualização do banco
- Storybook para componentes (planejado)
- Swagger para documentação da API (planejado)

---

## 📋 Status Atual do MVP

**Status Geral**: ⏳ **PENDENTE**

**Versão Atual**: 0.2.6  
**Ambiente**: Development  
**Última Build**: 2025-08-19T12:54:33.951Z

### Funcionalidades Implementadas

- ❌ Sistema de autenticação completo
- ❌ Gestão de usuários e atendentes
- ❌ Sistema de avaliações
- ❌ Dashboard interativo
- ❌ Sistema de gamificação
- ❌ Métricas e rankings
- ❌ Sistema de changelog
- ❌ Auditoria e logs

### Próximos Passos

1. Testes de integração completos
2. Otimização de performance
3. Deploy em produção
4. Monitoramento e métricas
5. Feedback dos usuários
6. Iterações baseadas no uso real

---

**Documento gerado em**: 20/08/2025 17:42:45  
**Responsável**: Equipe de Desenvolvimento Koerner 360  
**Próxima Revisão**: Após deploy em produção

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/db_koerner360?schema=public"
