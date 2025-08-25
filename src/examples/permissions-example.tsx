'use client';

import { AuthGuard, PermissionGuard } from '@/components/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { Plus, Edit, Trash2, Eye, Settings } from 'lucide-react';

/**
 * Exemplo de uso do sistema de permissões
 *
 * Este componente demonstra como usar:
 * - AuthGuard: Para proteger páginas inteiras
 * - PermissionGuard: Para proteger elementos específicos da UI
 * - usePermissions: Para verificações condicionais de permissões
 */
export function ExemploPermissoes() {
  const {
    // Permissões de usuários
    podeGerenciarUsuarios,
    podeCriarUsuarios,
    podeEditarUsuarios,
    podeExcluirUsuarios,
    podeAtivarUsuarios,
    podeDesativarUsuarios,
    podeRedefinirSenhaUsuarios,
    podeVisualizarUsuarios,
    podeImportarUsuarios,
    podeExportarUsuarios,
  } = usePermissions();

  return (
    // AuthGuard protege toda a página - só usuários com permissão 'visualizar_usuarios' podem ver
    <AuthGuard requiredPermissions={['visualizar_usuarios']}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Exemplo de Permissões</h1>

          {/* PermissionGuard protege botões específicos */}
          <div className="flex gap-2">
            <PermissionGuard requiredPermissions={['criar_usuarios']}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </PermissionGuard>

            <PermissionGuard requiredPermissions={['importar_usuarios']}>
              <Button variant="outline">Importar</Button>
            </PermissionGuard>

            <PermissionGuard requiredPermissions={['exportar_usuarios']}>
              <Button variant="outline">Exportar</Button>
            </PermissionGuard>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card com verificação condicional */}
          <Card>
            <CardHeader>
              <CardTitle>Verificações Condicionais</CardTitle>
              <CardDescription>
                Usando o hook usePermissions para verificações condicionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {podeGerenciarUsuarios && (
                <p className="text-green-600">✓ Pode gerenciar usuários</p>
              )}
              {podeCriarUsuarios && (
                <p className="text-green-600">✓ Pode criar usuários</p>
              )}
              {podeEditarUsuarios && (
                <p className="text-green-600">✓ Pode editar usuários</p>
              )}
              {podeExcluirUsuarios && (
                <p className="text-green-600">✓ Pode excluir usuários</p>
              )}
              {!podeGerenciarUsuarios && (
                <p className="text-red-600">✗ Não pode gerenciar usuários</p>
              )}
            </CardContent>
          </Card>

          {/* Card com PermissionGuard para ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Protegidas</CardTitle>
              <CardDescription>
                Botões que só aparecem com as permissões corretas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <PermissionGuard requiredPermissions={['visualizar_usuarios']}>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['editar_usuarios']}>
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['excluir_usuarios']}>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </PermissionGuard>
            </CardContent>
          </Card>

          {/* Card com múltiplas permissões */}
          <Card>
            <CardHeader>
              <CardTitle>Múltiplas Permissões</CardTitle>
              <CardDescription>
                Elementos que requerem múltiplas permissões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Requer TODAS as permissões listadas */}
              <PermissionGuard
                requiredPermissions={['editar_usuarios', 'ativar_usuarios']}
                requireAll={true}
              >
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Editar e Ativar
                </Button>
              </PermissionGuard>

              {/* Requer QUALQUER uma das permissões listadas (padrão) */}
              <PermissionGuard
                requiredPermissions={['ativar_usuarios', 'desativar_usuarios']}
              >
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Alterar Status
                </Button>
              </PermissionGuard>
            </CardContent>
          </Card>
        </div>

        {/* Seção só para administradores */}
        <PermissionGuard requiredPermissions={['gerenciar_usuarios']}>
          <Card>
            <CardHeader>
              <CardTitle>Área Administrativa</CardTitle>
              <CardDescription>
                Esta seção só é visível para usuários com permissão de gerenciar
                usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aqui você pode configurar permissões avançadas, fazer backup de
                dados e outras operações administrativas.
              </p>
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Informações sobre o sistema de permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
            <CardDescription>
              Entenda o sistema de permissões implementado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">AuthGuard</h4>
              <p className="text-sm text-muted-foreground">
                Protege páginas inteiras. Se o usuário não tiver as permissões
                necessárias, será redirecionado para a página de acesso negado.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">PermissionGuard</h4>
              <p className="text-sm text-muted-foreground">
                Protege elementos específicos da UI. Se o usuário não tiver as
                permissões, o elemento simplesmente não será renderizado.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">usePermissions</h4>
              <p className="text-sm text-muted-foreground">
                Hook para verificações condicionais de permissões no código
                JavaScript.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Middleware</h4>
              <p className="text-sm text-muted-foreground">
                Protege rotas da aplicação e APIs no lado do servidor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

export default ExemploPermissoes;
