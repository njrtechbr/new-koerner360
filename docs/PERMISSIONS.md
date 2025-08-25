# Sistema de Permissões

Este documento descreve como usar o sistema de permissões implementado na aplicação.

## Visão Geral

O sistema de permissões é composto por:

1. **AuthGuard**: Componente para proteger páginas inteiras
2. **PermissionGuard**: Componente para proteger elementos específicos da UI
3. **usePermissions**: Hook para verificações condicionais
4. **Middleware**: Proteção de rotas no servidor
5. **API de Autorização**: Funções utilitárias para verificação de permissões

## Componentes

### AuthGuard

Protege páginas inteiras. Se o usuário não tiver as permissões necessárias, será redirecionado para `/acesso-negado`.

```tsx
import { AuthGuard } from '@/components/auth';

function MinhaPage() {
  return (
    <AuthGuard requiredPermissions={['visualizar_usuarios']}>
      <div>{/* Conteúdo da página */}</div>
    </AuthGuard>
  );
}
```

**Propriedades:**

- `requiredPermissions`: Array de permissões necessárias
- `requireAll`: Se `true`, requer TODAS as permissões. Se `false` (padrão), requer QUALQUER uma
- `fallback`: Componente a ser exibido enquanto verifica as permissões
- `redirectTo`: URL para redirecionamento (padrão: `/acesso-negado`)

### PermissionGuard

Protege elementos específicos da UI. Se o usuário não tiver as permissões, o elemento não será renderizado.

```tsx
import { PermissionGuard } from '@/components/auth';

function MeuComponente() {
  return (
    <div>
      <PermissionGuard requiredPermissions={['criar_usuarios']}>
        <Button>Novo Usuário</Button>
      </PermissionGuard>

      {/* Múltiplas permissões - requer TODAS */}
      <PermissionGuard
        requiredPermissions={['editar_usuarios', 'ativar_usuarios']}
        requireAll={true}
      >
        <Button>Editar e Ativar</Button>
      </PermissionGuard>

      {/* Múltiplas permissões - requer QUALQUER uma */}
      <PermissionGuard
        requiredPermissions={['ativar_usuarios', 'desativar_usuarios']}
      >
        <Button>Alterar Status</Button>
      </PermissionGuard>
    </div>
  );
}
```

**Propriedades:**

- `requiredPermissions`: Array de permissões necessárias
- `requireAll`: Se `true`, requer TODAS as permissões. Se `false` (padrão), requer QUALQUER uma
- `fallback`: Componente a ser exibido se não tiver permissão
- `children`: Elementos filhos a serem protegidos

### usePermissions Hook

Para verificações condicionais de permissões no código JavaScript.

```tsx
import { usePermissions } from '@/hooks/use-permissions';

function MeuComponente() {
  const {
    podeGerenciarUsuarios,
    podeCriarUsuarios,
    podeEditarUsuarios,
    podeExcluirUsuarios,
    // ... outras permissões
  } = usePermissions();

  return (
    <div>
      {podeGerenciarUsuarios && <p>Você pode gerenciar usuários!</p>}

      {podeCriarUsuarios ? (
        <Button>Criar Usuário</Button>
      ) : (
        <p>Sem permissão para criar usuários</p>
      )}
    </div>
  );
}
```

**Permissões Disponíveis:**

#### Usuários

- `podeGerenciarUsuarios`: Permissão geral para gerenciar usuários
- `podeCriarUsuarios`: Criar novos usuários
- `podeEditarUsuarios`: Editar usuários existentes
- `podeExcluirUsuarios`: Excluir usuários
- `podeAtivarUsuarios`: Ativar usuários
- `podeDesativarUsuarios`: Desativar usuários
- `podeRedefinirSenhaUsuarios`: Redefinir senhas de usuários
- `podeVisualizarUsuarios`: Visualizar lista de usuários
- `podeImportarUsuarios`: Importar usuários
- `podeExportarUsuarios`: Exportar usuários

#### Atendentes

- `podeGerenciarAtendentes`: Permissão geral para gerenciar atendentes
- `podeCriarAtendentes`: Criar novos atendentes
- `podeEditarAtendentes`: Editar atendentes existentes
- `podeExcluirAtendentes`: Excluir atendentes
- `podeVisualizarAtendentes`: Visualizar lista de atendentes

#### Relatórios

- `podeVisualizarRelatorios`: Visualizar relatórios
- `podeExportarRelatorios`: Exportar relatórios
- `podeGerarRelatorios`: Gerar novos relatórios

## Middleware de Proteção

O middleware protege rotas automaticamente baseado no tipo de usuário:

```typescript
// middleware.ts
const ROTAS_POR_TIPO = {
  ADMIN: [
    '/dashboard',
    '/usuarios',
    '/atendentes',
    '/relatorios',
    '/configuracoes',
  ],
  GESTOR: [
    '/dashboard',
    '/usuarios', // Gestores podem gerenciar usuários
    '/atendentes',
    '/relatorios',
  ],
  ATENDENTE: [
    '/dashboard',
    '/atendentes', // Apenas visualização
  ],
};
```

### Proteção de APIs

As rotas de API são protegidas automaticamente:

```typescript
// Exemplo: /api/usuarios/[id]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica permissão específica
    const permissaoValida = await verificarPermissaoAPI(
      request,
      'excluir_usuarios'
    );
    if (!permissaoValida.sucesso) {
      // Registra tentativa de acesso não autorizada
      await registrarTentativaAcesso({
        rota: `/api/usuarios/${params.id}`,
        metodo: 'DELETE',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        sucesso: false,
        motivo: permissaoValida.erro,
      });

      return NextResponse.json({ erro: permissaoValida.erro }, { status: 403 });
    }

    // Lógica da API...
  } catch (error) {
    // Tratamento de erro...
  }
}
```

## Funções Utilitárias

### verificarPermissaoAPI

Verifica se o usuário tem uma permissão específica:

```typescript
import { verificarPermissaoAPI } from '@/lib/auth/authorization';

const resultado = await verificarPermissaoAPI(request, 'criar_usuarios');
if (resultado.sucesso) {
  // Usuário tem permissão
} else {
  // Usuário não tem permissão
  console.log(resultado.erro);
}
```

### registrarTentativaAcesso

Registra tentativas de acesso para auditoria:

```typescript
import { registrarTentativaAcesso } from '@/lib/auth/authorization';

await registrarTentativaAcesso({
  rota: '/api/usuarios',
  metodo: 'POST',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  sucesso: false,
  motivo: 'Usuário não tem permissão para criar usuários',
});
```

## Mapeamento de Permissões por Tipo

### ADMIN

- Todas as permissões disponíveis
- Acesso completo ao sistema

### GESTOR

- Gerenciar usuários (criar, editar, excluir, ativar, desativar)
- Gerenciar atendentes
- Visualizar e gerar relatórios
- Redefinir senhas

### ATENDENTE

- Visualizar próprio perfil
- Atualizar próprios dados básicos
- Visualizar relatórios limitados

## Página de Acesso Negado

Quando um usuário tenta acessar uma rota sem permissão, é redirecionado para `/acesso-negado`:

- Mostra informações sobre a rota tentada
- Exibe o perfil atual do usuário
- Oferece sugestões de ações
- Botões para voltar ou ir ao dashboard

## Exemplos de Uso

Veja o arquivo `src/examples/permissions-example.tsx` para exemplos práticos de como usar todos os componentes e hooks do sistema de permissões.

## Boas Práticas

1. **Use AuthGuard para páginas**: Sempre proteja páginas inteiras com AuthGuard
2. **Use PermissionGuard para elementos**: Proteja botões, links e seções específicas
3. **Combine ambos quando necessário**: AuthGuard para a página + PermissionGuard para elementos específicos
4. **Verifique permissões nas APIs**: Sempre valide permissões no servidor
5. **Registre tentativas de acesso**: Use registrarTentativaAcesso para auditoria
6. **Seja específico com permissões**: Use permissões granulares em vez de permissões muito amplas
7. **Teste diferentes cenários**: Teste com diferentes tipos de usuário

## Troubleshooting

### Problema: Usuário não consegue acessar uma página

1. Verifique se o usuário está autenticado
2. Verifique se o usuário tem o tipo correto (ADMIN, GESTOR, ATENDENTE)
3. Verifique se a rota está mapeada corretamente no middleware
4. Verifique se as permissões estão corretas no AuthGuard

### Problema: Elemento não aparece na tela

1. Verifique se o PermissionGuard tem as permissões corretas
2. Verifique se o usuário tem as permissões necessárias
3. Use o hook usePermissions para debug

### Problema: API retorna 403

1. Verifique se a API está usando verificarPermissaoAPI
2. Verifique se a permissão passada está correta
3. Verifique se o token de autenticação é válido
4. Verifique os logs de tentativas de acesso
