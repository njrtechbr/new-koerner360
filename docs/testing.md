# 🧪 Guia de Testes - Sistema de Notificações

Este documento descreve como executar e gerenciar os testes do sistema de notificações.

## 📋 Índice

- [Configuração](#configuração)
- [Executando Testes](#executando-testes)
- [Tipos de Teste](#tipos-de-teste)
- [Cobertura de Código](#cobertura-de-código)
- [Estrutura de Testes](#estrutura-de-testes)
- [Mocks e Utilitários](#mocks-e-utilitários)
- [Troubleshooting](#troubleshooting)

## ⚙️ Configuração

### Ferramentas de Teste

O projeto suporta duas ferramentas de teste:

- **Vitest** (recomendado): Ferramenta moderna e rápida
- **Jest**: Alternativa tradicional e robusta

### Arquivos de Configuração

```
├── vitest.config.ts          # Configuração do Vitest
├── jest.config.js            # Configuração do Jest
├── src/test/setup.ts         # Setup comum para ambas as ferramentas
└── scripts/test.js           # Script utilitário para executar testes
```

### Dependências

Certifique-se de que as seguintes dependências estão instaladas:

```bash
npm install --save-dev vitest @vitest/ui jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

## 🚀 Executando Testes

### Usando o Script Utilitário

```bash
# Exibir ajuda
node scripts/test.js help

# Verificar configurações
node scripts/test.js check

# Executar todos os testes
node scripts/test.js all

# Executar com Vitest
node scripts/test.js vitest

# Executar com Jest
node scripts/test.js jest

# Modo watch (desenvolvimento)
node scripts/test.js vitest:watch

# Com cobertura
node scripts/test.js vitest:coverage

# Interface gráfica (Vitest)
node scripts/test.js vitest:ui
```

### Comandos Diretos

```bash
# Vitest
npx vitest
npx vitest --watch
npx vitest --coverage
npx vitest --ui

# Jest
npx jest
npx jest --watch
npx jest --coverage
```

### Testes Específicos

```bash
# Apenas hooks
node scripts/test.js hooks

# Apenas componentes
node scripts/test.js components

# Apenas serviços
node scripts/test.js services

# Por funcionalidade
node scripts/test.js notificacoes
node scripts/test.js lembretes
node scripts/test.js preferencias
```

## 🎯 Tipos de Teste

### 1. Testes de Hooks

**Localização**: `src/hooks/__tests__/`

- `use-notificacoes-avaliacoes.test.ts`
- `use-lembretes.test.ts`
- `use-agendador-lembretes.test.ts`
- `use-preferencias-notificacao.test.ts`

**Cobertura**:
- Estados de carregamento
- Gerenciamento de dados
- Tratamento de erros
- Integração com APIs

### 2. Testes de Componentes

**Localização**: `src/components/__tests__/`

- `notificacoes/lista-notificacoes.test.tsx`
- `lembretes/lista-lembretes.test.tsx`
- `lembretes/painel-agendamento.test.tsx`
- `preferencias/configuracoes-notificacao.test.tsx`

**Cobertura**:
- Renderização
- Interações do usuário
- Estados visuais
- Acessibilidade
- Responsividade

### 3. Testes de Serviços

**Localização**: `src/lib/services/__tests__/`

- `notificacoes-avaliacoes.test.ts`
- `lembretes.test.ts`
- `agendador-lembretes.test.ts`
- `preferencias-notificacao.test.ts`

**Cobertura**:
- Lógica de negócio
- Integração com banco de dados
- Validações
- Performance

## 📊 Cobertura de Código

### Metas de Cobertura

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Relatórios

```bash
# Gerar relatório de cobertura
node scripts/test.js vitest:coverage

# Visualizar relatório HTML
# Abrir: coverage/index.html
```

### Arquivos Excluídos

- Arquivos de configuração
- Arquivos de teste
- Arquivos de setup
- Arquivos de índice (re-exports)
- Arquivos de tipos TypeScript

## 🏗️ Estrutura de Testes

### Organização

```
src/
├── hooks/
│   ├── __tests__/
│   │   ├── use-notificacoes-avaliacoes.test.ts
│   │   ├── use-lembretes.test.ts
│   │   ├── use-agendador-lembretes.test.ts
│   │   └── use-preferencias-notificacao.test.ts
│   └── ...
├── components/
│   ├── __tests__/
│   │   ├── notificacoes/
│   │   ├── lembretes/
│   │   └── preferencias/
│   └── ...
├── lib/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── notificacoes-avaliacoes.test.ts
│   │   │   ├── lembretes.test.ts
│   │   │   ├── agendador-lembretes.test.ts
│   │   │   └── preferencias-notificacao.test.ts
│   │   └── ...
│   └── ...
└── test/
    └── setup.ts
```

### Convenções de Nomenclatura

- **Arquivos de teste**: `*.test.ts` ou `*.test.tsx`
- **Arquivos de spec**: `*.spec.ts` ou `*.spec.tsx`
- **Diretórios**: `__tests__/`

## 🎭 Mocks e Utilitários

### Mocks Globais

**Localização**: `src/test/setup.ts`

- `fetch` global
- `localStorage` e `sessionStorage`
- `window.location`
- `window.matchMedia`
- `ResizeObserver`
- `IntersectionObserver`
- Hooks do Next.js

### Utilitários de Teste

```typescript
// Criar resposta mock
const response = createMockResponse({ data: 'test' });

// Criar fetch mock
const mockFetch = createMockFetch([{ success: true }]);

// Criar toast mock
const mockToast = createMockToast();

// Dados mock
const usuario = mockUsuario;
const avaliacao = mockAvaliacao;
const notificacao = mockNotificacao;
const lembrete = mockLembrete;
```

### Helpers Assíncronos

```typescript
// Aguardar tempo específico
await waitFor(1000);

// Aguardar promises pendentes
await flushPromises();
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Módulo Não Encontrado

```bash
# Verificar aliases de importação
# Verificar configuração em vitest.config.ts ou jest.config.js
```

#### 2. Testes Lentos

```bash
# Usar modo paralelo
npx vitest --reporter=verbose

# Verificar timeouts
# Verificar mocks desnecessários
```

#### 3. Falhas de Mock

```bash
# Limpar mocks entre testes
vi.clearAllMocks();

# Restaurar implementações originais
vi.restoreAllMocks();
```

#### 4. Problemas de DOM

```bash
# Verificar ambiente jsdom
# Verificar setup do testing-library
```

### Logs de Debug

```typescript
// Habilitar logs detalhados
console.log('Estado atual:', component.debug());

// Verificar queries disponíveis
screen.logTestingPlaygroundURL();
```

### Performance

```bash
# Executar com profiling
npx vitest --reporter=verbose --coverage

# Analisar tempo de execução
npx vitest --reporter=json > test-results.json
```

## 📚 Recursos Adicionais

### Documentação

- [Vitest](https://vitest.dev/)
- [Jest](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM](https://github.com/testing-library/jest-dom)

### Boas Práticas

1. **Testes Isolados**: Cada teste deve ser independente
2. **Nomes Descritivos**: Use nomes claros para testes e grupos
3. **Arrange-Act-Assert**: Organize testes em seções claras
4. **Mocks Mínimos**: Use apenas os mocks necessários
5. **Testes de Integração**: Teste fluxos completos quando possível

### Scripts Package.json

Adicione ao `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:jest": "jest",
    "test:jest:watch": "jest --watch",
    "test:jest:coverage": "jest --coverage",
    "test:hooks": "vitest src/hooks",
    "test:components": "vitest src/components",
    "test:services": "vitest src/lib/services",
    "test:all": "node scripts/test.js all"
  }
}
```

---

**Nota**: Este sistema de testes foi projetado para garantir a qualidade e confiabilidade do sistema de notificações. Mantenha os testes atualizados conforme o código evolui.