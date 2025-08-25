# Regras do Projeto

## 1. Gestão de Tarefas com Task Master

### 1.1 Princípios Fundamentais

- **NUNCA pular tasks ou subtasks**: Todas as tarefas devem ser executadas na ordem correta
- **Respeitar dependências**: Verificar sempre as dependências antes de iniciar uma task
- **Seguir o fluxo sequencial**: Completar uma task antes de passar para a próxima
- **Documentar progresso**: Atualizar status das tasks conforme o andamento

### 1.2 Workflow Obrigatório

1. **Verificar próxima task**: Usar `next_task` para identificar a próxima tarefa disponível
2. **Analisar dependências**: Confirmar que todas as dependências foram concluídas
3. **Executar task completa**: Implementar todos os requisitos da task
4. **Atualizar status**: Marcar como concluída apenas quando 100% finalizada
5. **Validar resultado**: Testar e verificar se a implementação está correta

### 1.3 Regras de Status

- **pending**: Task aguardando execução
- **in-progress**: Task sendo executada atualmente (máximo 1 por vez)
- **done**: Task completamente finalizada e testada
- **blocked**: Task impedida por dependência não resolvida
- **review**: Task aguardando revisão
- **deferred**: Task adiada temporariamente
- **cancelled**: Task cancelada

### 1.4 Gestão de Subtasks

- Todas as subtasks devem ser concluídas antes de marcar a task pai como done
- Subtasks podem ter suas próprias dependências
- Não pular subtasks mesmo que pareçam opcionais
- Expandir tasks complexas em subtasks quando necessário

### 1.5 Dependências

- **Verificar sempre**: Antes de iniciar qualquer task, verificar dependências
- **Não quebrar fluxo**: Nunca iniciar uma task se suas dependências não estão concluídas
- **Documentar bloqueios**: Se uma dependência impede o progresso, marcar como blocked
- **Resolver em ordem**: Priorizar resolução de dependências bloqueantes

## 2. Controle de Qualidade

### 2.1 Critérios de Conclusão

Uma task só pode ser marcada como "done" quando:

- Todos os requisitos foram implementados
- Código foi testado e está funcionando
- Documentação foi atualizada (se aplicável)
- Não há erros ou warnings críticos
- Todas as subtasks foram concluídas

### 2.2 Validação Contínua

- Executar testes após cada implementação
- Verificar se não há regressões
- Validar integração com outras partes do sistema
- Confirmar que a funcionalidade atende aos requisitos

## 3. Comunicação e Documentação

### 3.1 Atualizações de Progresso

- Atualizar status das tasks em tempo real
- Documentar problemas encontrados
- Registrar soluções implementadas
- Manter histórico de mudanças

### 3.2 Relatórios

- Gerar relatórios de complexidade quando necessário
- Acompanhar métricas de progresso
- Identificar gargalos no desenvolvimento
- Planejar expansões de tasks complexas

## 4. Boas Práticas

### 4.1 Planejamento

- Analisar complexidade antes de iniciar
- Quebrar tasks grandes em subtasks menores
- Estimar tempo necessário para cada task
- Identificar riscos e dependências externas

### 4.2 Execução

- Focar em uma task por vez
- Manter código limpo e bem documentado
- Fazer commits frequentes com mensagens descritivas
- Testar incrementalmente

### 4.3 Revisão

- Revisar código antes de marcar como done
- Validar com stakeholders quando necessário
- Documentar lições aprendidas
- Atualizar estimativas para tasks futuras

## 5. Ferramentas e Comandos

### 5.1 Comandos Essenciais do Task Master

- `get_tasks`: Visualizar todas as tasks
- `next_task`: Identificar próxima task disponível
- `get_task [id]`: Obter detalhes de uma task específica
- `set_task_status [id] [status]`: Atualizar status da task
- `validate_dependencies`: Verificar integridade das dependências

### 5.2 Workflow Recomendado

```bash
# 1. Verificar próxima task
next_task

# 2. Analisar detalhes da task
get_task [id]

# 3. Marcar como em progresso
set_task_status [id] in-progress

# 4. Executar implementação
# ... desenvolvimento ...

# 5. Marcar como concluída
set_task_status [id] done

# 6. Verificar próxima task
next_task
```

## 6. Responsabilidades

### 6.1 Desenvolvedor

- Seguir rigorosamente o fluxo de tasks
- Não pular etapas ou subtasks
- Manter comunicação clara sobre progresso
- Reportar bloqueios imediatamente

### 6.2 Task Master

- Manter estrutura de tasks atualizada
- Garantir clareza nas descrições
- Monitorar dependências
- Facilitar resolução de bloqueios

---

**IMPORTANTE**: Estas regras são fundamentais para o sucesso do projeto. O não cumprimento pode resultar em:

- Retrabalho desnecessário
- Bugs e inconsistências
- Atrasos no cronograma
- Perda de qualidade do produto final

**LEMBRE-SE**: O Task Master é nossa ferramenta de organização principal. Confie no processo e siga as tasks na ordem correta!
