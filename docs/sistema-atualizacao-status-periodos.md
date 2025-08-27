# Sistema de Atualização Automática de Status de Períodos

## Visão Geral

Este documento descreve o sistema implementado para atualização automática dos status dos períodos de avaliação baseado nas datas atuais do sistema.

## Componentes Implementados

### 1. Utilitário de Atualização (`src/lib/utils/periodo-status-updater.ts`)

Contém as funções principais para gerenciamento automático de status:

#### Funções Principais

- **`atualizarStatusPeriodos()`**: Atualiza o status de todos os períodos não cancelados
- **`atualizarStatusPeriodo(periodoId)`**: Atualiza o status de um período específico
- **`calcularStatusPeriodo(periodo)`**: Calcula o status correto sem alterar o banco de dados
- **`middlewareAtualizacaoStatus()`**: Middleware para integração em endpoints

#### Lógica de Status

```typescript
// Regras de negócio para determinação de status:
- PLANEJADO: dataInicio > agora
- ATIVO: dataInicio <= agora <= dataFim
- FINALIZADO: dataFim < agora
- CANCELADO: mantém status (não é alterado automaticamente)
```

### 2. Endpoint de Atualização Manual (`src/app/api/periodos-avaliacao/atualizar-status/route.ts`)

Fornece endpoints para atualização manual e verificação de status:

#### POST `/api/periodos-avaliacao/atualizar-status`
- Atualiza status manualmente
- Parâmetros opcionais:
  - `periodoId`: ID específico do período
  - `forcar`: Força atualização mesmo que não seja necessária
- Permissões: ADMIN, GESTOR

#### GET `/api/periodos-avaliacao/atualizar-status`
- Verifica quais períodos precisam de atualização (sem fazer alterações)
- Retorna lista de períodos com status atual e correto
- Permissões: ADMIN, GESTOR

### 3. Integração Automática em Endpoints

O middleware foi integrado nos seguintes endpoints para garantir atualização automática:

#### Períodos de Avaliação
- `GET /api/periodos-avaliacao` - Listar períodos
- `POST /api/periodos-avaliacao` - Criar período
- `GET /api/periodos-avaliacao/[id]` - Buscar período específico
- `PUT /api/periodos-avaliacao/[id]` - Atualizar período
- `DELETE /api/periodos-avaliacao/[id]` - Deletar período

#### Avaliações
- `GET /api/avaliacoes` - Listar avaliações
- `POST /api/avaliacoes` - Criar avaliação
- `GET /api/avaliacoes/[id]` - Buscar avaliação específica
- `PUT /api/avaliacoes/[id]` - Atualizar avaliação
- `DELETE /api/avaliacoes/[id]` - Deletar avaliação

## Benefícios

### 1. Consistência de Dados
- Status sempre reflete a situação real baseada nas datas
- Elimina inconsistências entre status e período atual

### 2. Automação
- Não requer intervenção manual para atualizar status
- Funciona de forma transparente em todas as operações

### 3. Performance
- Middleware executa rapidamente
- Atualiza apenas períodos que realmente precisam

### 4. Flexibilidade
- Permite atualização manual quando necessário
- Endpoint de verificação para auditoria

## Casos de Uso

### 1. Transição Automática de Status
```
PLANEJADO → ATIVO (quando dataInicio é atingida)
ATIVO → FINALIZADO (quando dataFim é ultrapassada)
```

### 2. Verificação de Períodos Ativos
- Ao criar nova avaliação, garante que o período está realmente ativo
- Evita criação de avaliações em períodos que deveriam estar finalizados

### 3. Relatórios e Listagens
- Dados sempre atualizados em relatórios
- Status correto em listagens administrativas

## Considerações Técnicas

### 1. Transações de Banco
- Utiliza transações para garantir consistência
- Rollback automático em caso de erro

### 2. Tratamento de Erros
- Logs detalhados para debugging
- Retorno de erros específicos para diferentes cenários

### 3. Validações
- Verifica existência de períodos antes de atualizar
- Valida permissões de usuário nos endpoints manuais

### 4. Performance
- Busca apenas períodos não cancelados
- Atualiza apenas quando necessário

## Monitoramento

### Logs de Sistema
Todos os processos de atualização são logados com:
- Timestamp da operação
- Períodos afetados
- Status anterior e novo
- Erros encontrados

### Endpoint de Verificação
Use `GET /api/periodos-avaliacao/atualizar-status` para:
- Verificar quais períodos precisam de atualização
- Auditar consistência de status
- Monitorar funcionamento do sistema

## Manutenção

### Atualizações Futuras
- Adicionar novos status se necessário
- Implementar regras de negócio específicas
- Otimizar performance conforme necessário

### Troubleshooting
1. Verificar logs de erro no console
2. Usar endpoint de verificação para diagnóstico
3. Executar atualização manual se necessário
4. Verificar permissões de usuário

## Segurança

- Endpoints protegidos por autenticação
- Verificação de permissões (ADMIN/GESTOR)
- Validação de dados de entrada
- Logs de auditoria para todas as operações

---

**Nota**: Este sistema garante que os status dos períodos de avaliação estejam sempre sincronizados com as datas atuais, proporcionando uma experiência consistente e confiável para todos os usuários do sistema.