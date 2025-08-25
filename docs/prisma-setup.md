# Configuração do Prisma - Koerner360

Este documento descreve a configuração e uso do Prisma ORM no projeto Koerner360.

## 📋 Visão Geral

O Prisma foi configurado como ORM principal do projeto, fornecendo:

- Type-safe database access
- Migrações automáticas
- Query builder intuitivo
- Geração automática de tipos TypeScript

## 🗄️ Banco de Dados

- **SGBD**: PostgreSQL 15+
- **Banco**: `koerner360_dev`
- **Host**: localhost:5432
- **Schema**: public

## 📁 Estrutura de Arquivos

```
src/
├── lib/
│   ├── prisma.ts           # Cliente Prisma configurado
│   ├── types.ts            # Tipos TypeScript exportados
│   └── database-utils.ts   # Utilitários para operações de BD
├── examples/
│   └── prisma-usage.ts     # Exemplos de uso
├── generated/
│   └── prisma/             # Cliente Prisma gerado
prisma/
├── schema.prisma           # Schema do banco de dados
└── migrations/             # Histórico de migrações
```

## 🏗️ Modelos de Dados

### Usuário

- **Tabela**: `usuarios`
- **Campos**: id, email, nome, senha, userType, ativo, timestamps
- **Relacionamentos**: 1:1 com Atendente (opcional)

### Atendente

- **Tabela**: `atendentes`
- **Campos**: id, usuarioId, cpf, telefone, endereco, dataAdmissao, cargo, setor, salario, status, observacoes, timestamps
- **Relacionamentos**: N:1 com Usuario, 1:N com Avaliacao, N:N com Conquista

### Avaliação

- **Tabela**: `avaliacoes`
- **Campos**: id, atendenteId, nota, comentario, periodo, dataAvaliacao, avaliadorId, timestamps
- **Relacionamentos**: N:1 com Atendente
- **Restrições**: Única por atendente/período

### Feedback

- **Tabela**: `feedbacks`
- **Campos**: id, tipo, status, prioridade, titulo, conteudo, autorId, responsavelId, resolucao, dataResolucao, timestamps

### Gamificação

- **Tabela**: `gamificacao_atendentes`
- **Campos**: id, atendenteId, pontos, nivel, badges, timestamps
- **Relacionamentos**: 1:1 com Atendente

### Conquista

- **Tabela**: `conquistas`
- **Campos**: id, nome, descricao, icone, pontos, timestamps
- **Relacionamentos**: N:N com Atendente

## 🚀 Comandos Principais

```powershell
# Gerar cliente Prisma
npx prisma generate

# Criar e aplicar migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
npx prisma migrate deploy

# Resetar banco de dados (desenvolvimento)
npx prisma migrate reset

# Visualizar banco no Prisma Studio
npx prisma studio

# Verificar status das migrações
npx prisma migrate status

# Testar connection pooling
npx tsx src/examples/connection-pooling-demo.ts

# Testar configuração básica
npx tsx src/examples/prisma-usage.ts

# Sincronizar schema sem migração
npx prisma db push
```

## 💻 Uso Básico

### Importar Cliente

```typescript
import prisma from '../lib/prisma';
// ou
import {
  prisma,
  checkDatabaseConnection,
  performHealthCheck,
  executeWithMonitoring,
  getConnectionPoolStats,
} from '../lib/prisma';
```

## 🔄 Connection Pooling

O projeto está configurado com connection pooling avançado para otimizar a performance e gerenciar conexões de forma eficiente.

### Configurações de Pool

As configurações estão definidas no arquivo `.env`:

```env
# Connection Pooling
DB_CONNECTION_LIMIT=10
DB_POOL_TIMEOUT=20
DB_CONNECT_TIMEOUT=10
DB_SSL_MODE=prefer
```

### Monitoramento de Performance

```typescript
// Executar query com monitoramento
const resultado = await executeWithMonitoring(async () => {
  return await prisma.usuario.findMany({ take: 10 });
}, 'buscar_usuarios');

console.log(`Query executada em ${resultado.duration}ms`);
```

### Health Check Completo

```typescript
// Verificar saúde do sistema
const healthCheck = await performHealthCheck();
console.log('Status do sistema:', healthCheck);
```

### Estatísticas do Pool

```typescript
// Obter estatísticas do pool de conexões
const stats = getConnectionPoolStats();
console.log('Estatísticas do pool:', stats);
```

### Operações CRUD

#### Criar Registro

```typescript
const usuario = await prisma.usuario.create({
  data: {
    email: 'usuario@exemplo.com',
    nome: 'João Silva',
    senha: 'senha_hash',
    userType: 'FUNCIONARIO',
  },
});
```

#### Buscar Registros

```typescript
const usuarios = await prisma.usuario.findMany({
  where: {
    ativo: true,
    userType: 'FUNCIONARIO',
  },
  include: {
    atendente: true,
  },
  orderBy: {
    criadoEm: 'desc',
  },
});
```

#### Atualizar Registro

```typescript
const usuario = await prisma.usuario.update({
  where: { id: 'user-id' },
  data: {
    nome: 'Novo Nome',
    ativo: false,
  },
});
```

#### Deletar Registro

```typescript
const usuario = await prisma.usuario.delete({
  where: { id: 'user-id' },
});
```

### Transações

```typescript
const resultado = await prisma.$transaction(async tx => {
  const usuario = await tx.usuario.create({
    data: {
      /* dados do usuário */
    },
  });

  const atendente = await tx.atendente.create({
    data: {
      usuarioId: usuario.id,
      /* outros dados */
    },
  });

  return { usuario, atendente };
});
```

### Consultas Avançadas

```typescript
// Agregações
const estatisticas = await prisma.avaliacao.aggregate({
  _avg: { nota: true },
  _count: { id: true },
  where: {
    dataAvaliacao: {
      gte: new Date('2024-01-01'),
    },
  },
});

// Agrupamento
const atendentesPorSetor = await prisma.atendente.groupBy({
  by: ['setor'],
  _count: { id: true },
  orderBy: {
    _count: { id: 'desc' },
  },
});
```

## 🛠️ Utilitários Disponíveis

### Validações

- `validarCPF(cpf: string)`: Valida formato e dígitos do CPF
- `validarEmail(email: string)`: Valida formato do email
- `cpfJaExiste(cpf: string)`: Verifica duplicidade de CPF
- `emailJaExiste(email: string)`: Verifica duplicidade de email

### Formatação

- `formatarCPF(cpf: string)`: Formata CPF com pontos e hífen
- `formatarTelefone(telefone: string)`: Formata telefone com parênteses e hífen

### Paginação

- `aplicarPaginacao(params)`: Calcula skip/take para paginação
- `criarResultadoPaginado(dados, total, pagina, limite)`: Cria objeto de resultado paginado

### Filtros

- `construirFiltroUsuarios(filtros)`: Constrói where clause para usuários
- `construirFiltroAtendentes(filtros)`: Constrói where clause para atendentes
- `construirFiltroFeedbacks(filtros)`: Constrói where clause para feedbacks

## 🔍 Exemplos Práticos

Veja o arquivo `src/examples/prisma-usage.ts` para exemplos completos de:

- Verificação de conexão
- Operações CRUD
- Validações
- Paginação
- Estatísticas

## 🚨 Boas Práticas

### Performance

1. **Use índices**: Já configurados nos campos mais consultados
2. **Limite resultados**: Sempre use paginação em listas
3. **Select específico**: Use `select` para campos específicos quando possível
4. **Include consciente**: Evite includes desnecessários

### Segurança

1. **Validação de entrada**: Sempre valide dados antes de inserir
2. **Sanitização**: Use os utilitários de formatação
3. **Transações**: Use para operações que afetam múltiplas tabelas
4. **Logs**: Configure logs apropriados para cada ambiente

### Manutenção

1. **Migrações**: Sempre crie migrações para mudanças de schema
2. **Backup**: Faça backup antes de migrações em produção
3. **Testes**: Teste migrações em ambiente de desenvolvimento primeiro
4. **Documentação**: Mantenha este documento atualizado

## 🔧 Troubleshooting

### Cliente não inicializado

```
Error: @prisma/client did not initialize yet
```

**Solução**: Execute `npx prisma generate`

### Erro de conexão

```
Can't reach database server
```

**Verificações**:

1. PostgreSQL está rodando?
2. Credenciais corretas no `.env`?
3. Banco de dados existe?

### Schema desatualizado

```
Your database is now in sync with your schema
```

**Solução**: Execute `npx prisma migrate dev`

### Conflito de migração

```
Migration conflict detected
```

**Solução**: Resolva conflitos manualmente ou reset o banco

## 📚 Recursos Adicionais

- [Documentação Oficial do Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
