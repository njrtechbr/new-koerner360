'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { AuthGuard } from '@/components/auth';
import { FormularioUsuario } from '@/components/usuarios/formulario-usuario';
import { ExportarUsuarios } from '@/components/usuarios/exportar-usuarios';
import { ImportarUsuarios } from '@/components/usuarios/importar-usuarios';
import { TabelaUsuarios } from '@/components/usuarios/tabela-usuarios';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

interface FiltrosUsuarios {
  busca?: string;
  perfil?: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  ativo?: boolean;
  ordenarPor?: 'nome' | 'email' | 'criadoEm' | 'atualizadoEm';
  ordem?: 'asc' | 'desc';
}

interface PaginacaoUsuarios {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export default function UsuariosPage() {
  const router = useRouter();
  // Permissões são agora gerenciadas pelo AuthGuard e PermissionGuard

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    busca: '',
    perfil: 'todos',
    status: 'todos',
    ordenarPor: 'nome' as
      | 'nome'
      | 'email'
      | 'perfil'
      | 'criadoEm'
      | 'ultimoLogin',
    ordem: 'asc' as 'asc' | 'desc',
  });
  const [paginacao, setPaginacao] = useState<PaginacaoUsuarios>({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExportacao, setModalExportacao] = useState(false);
  const [modalImportacao, setModalImportacao] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState(false);

  // Verificar permissões
  useEffect(() => {
    if (!podeGerenciarUsuarios) {
      toast.error('Você não tem permissão para acessar esta página');
      router.push('/dashboard');
      return;
    }
  }, [podeGerenciarUsuarios, router]);

  // Carregar usuários
  const carregarUsuarios = async () => {
    try {
      setCarregando(true);

      const params = new URLSearchParams({
        pagina: paginacao.pagina.toString(),
        limite: paginacao.limite.toString(),
        ...(filtros.busca && { busca: filtros.busca }),
        ...(filtros.perfil && { perfil: filtros.perfil }),
        ...(filtros.ativo !== undefined && { ativo: filtros.ativo.toString() }),
        ordenarPor: filtros.ordenarPor || 'nome',
        ordem: filtros.ordem || 'asc',
      });

      const response = await fetch(`/api/usuarios?${params}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsuarios(data.usuarios);
      setPaginacao(prev => ({
        ...prev,
        total: data.total,
        totalPaginas: data.totalPaginas,
      }));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para carregar usuários quando filtros ou paginação mudam
  useEffect(() => {
    carregarUsuarios();
  }, [filtros, paginacao.pagina, paginacao.limite]);

  // Alternar status do usuário
  const alternarStatusUsuario = async (usuario: Usuario) => {
    try {
      const endpoint = usuario.ativo
        ? `/api/usuarios/${usuario.id}`
        : `/api/usuarios/${usuario.id}/ativar`;

      const method = usuario.ativo ? 'DELETE' : 'PATCH';

      const response = await fetch(endpoint, { method });

      if (!response.ok) {
        throw new Error(
          `Erro ao ${usuario.ativo ? 'desativar' : 'ativar'} usuário`
        );
      }

      toast.success(
        `Usuário ${usuario.ativo ? 'desativado' : 'ativado'} com sucesso`
      );
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error(`Erro ao ${usuario.ativo ? 'desativar' : 'ativar'} usuário`);
    }
  };

  // Excluir usuário permanentemente
  const excluirUsuario = async (usuario: Usuario) => {
    try {
      const response = await fetch(
        `/api/usuarios/${usuario.id}?permanente=true`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }

      toast.success('Usuário excluído permanentemente');
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (novosFiltros: FiltrosUsuarios) => {
    setFiltros(novosFiltros);
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      ordenarPor: 'nome',
      ordem: 'asc',
    });
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
  };

  // Renderizar badge do perfil
  const renderizarBadgePerfil = (perfil: string) => {
    const cores = {
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      GESTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      OPERADOR:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
      <Badge className={cores[perfil as keyof typeof cores]}>{perfil}</Badge>
    );
  };

  // Renderizar badge do status
  const renderizarBadgeStatus = (ativo: boolean) => {
    return (
      <Badge variant={ativo ? 'default' : 'secondary'}>
        {ativo ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  return (
    <AuthGuard requiredPermissions={['visualizar_usuarios']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários, permissões e controle de acesso do sistema
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setModalImportacao(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>

            <Button
              variant="outline"
              onClick={() => setModalExportacao(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            <Button
              onClick={() => {
                setUsuarioSelecionado(null);
                setModalAberto(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar usuários específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={filtros.busca || ''}
                    onChange={e =>
                      aplicarFiltros({ ...filtros, busca: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filtros.perfil || 'todos'}
                onValueChange={value =>
                  aplicarFiltros({
                    ...filtros,
                    perfil:
                      value === 'todos'
                        ? undefined
                        : (value as 'ADMIN' | 'GESTOR' | 'OPERADOR'),
                  })
                }
              >
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os perfis</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="GESTOR">Gestor</SelectItem>
                  <SelectItem value="OPERADOR">Operador</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={
                  filtros.ativo === undefined
                    ? 'todos'
                    : filtros.ativo.toString()
                }
                onValueChange={value =>
                  aplicarFiltros({
                    ...filtros,
                    ativo: value === 'todos' ? undefined : value === 'true',
                  })
                }
              >
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setFiltrosAvancados(true)}
              >
                Filtros Avançados
              </Button>

              <Button variant="outline" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de usuários */}
        <TabelaUsuarios
          usuarios={usuarios}
          carregando={carregando}
          paginaAtual={paginacao.pagina}
          totalPaginas={paginacao.totalPaginas}
          totalUsuarios={paginacao.total}
          itensPorPagina={paginacao.limite}
          filtros={filtros}
          onFiltroChange={novosFiltros =>
            setFiltros(prev => ({ ...prev, ...novosFiltros }))
          }
          onPaginaChange={pagina => setPaginacao(prev => ({ ...prev, pagina }))}
          onItensPorPaginaChange={limite =>
            setPaginacao(prev => ({ ...prev, limite, pagina: 1 }))
          }
          onEditar={usuario => {
            setUsuarioSelecionado(usuario);
            setModalAberto(true);
          }}
          onExcluir={usuarioId => {
            const usuario = usuarios.find(u => u.id === usuarioId);
            if (usuario) excluirUsuario(usuario);
          }}
          onAlterarStatus={(usuarioId, ativo) => {
            const usuario = usuarios.find(u => u.id === usuarioId);
            if (usuario) alternarStatusUsuario(usuario);
          }}
          onRedefinirSenha={usuarioId => {
            // Implementar redefinição de senha
            toast.info('Funcionalidade de redefinir senha será implementada');
          }}
          onVisualizarDetalhes={usuarioId => {
            const usuario = usuarios.find(u => u.id === usuarioId);
            if (usuario) {
              setUsuarioSelecionado(usuario);
              // Implementar modal de detalhes
              toast.info('Modal de detalhes será implementado');
            }
          }}
          onNovoUsuario={() => {
            setUsuarioSelecionado(null);
            setModalAberto(true);
          }}
          onExportar={() => setModalExportacao(true)}
          onImportar={() => setModalImportacao(true)}
          onAtualizar={carregarUsuarios}
        />

        {/* Modal de formulário */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {usuarioSelecionado ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {usuarioSelecionado
                  ? 'Edite as informações do usuário abaixo'
                  : 'Preencha as informações para criar um novo usuário'}
              </DialogDescription>
            </DialogHeader>
            <FormularioUsuario
              usuario={usuarioSelecionado}
              onSucesso={() => {
                setModalAberto(false);
                setUsuarioSelecionado(null);
                carregarUsuarios();
              }}
              onCancelar={() => {
                setModalAberto(false);
                setUsuarioSelecionado(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de exportação */}
        <Dialog open={modalExportacao} onOpenChange={setModalExportacao}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Usuários</DialogTitle>
              <DialogDescription>
                Escolha o formato e filtros para exportação dos dados
              </DialogDescription>
            </DialogHeader>
            <ExportarUsuarios
              filtros={filtros}
              onSucesso={() => setModalExportacao(false)}
              onCancelar={() => setModalExportacao(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de importação */}
        <Dialog open={modalImportacao} onOpenChange={setModalImportacao}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Usuários</DialogTitle>
              <DialogDescription>
                Faça upload de um arquivo para importar usuários em lote
              </DialogDescription>
            </DialogHeader>
            <ImportarUsuarios
              onSucesso={() => {
                setModalImportacao(false);
                carregarUsuarios();
              }}
              onCancelar={() => setModalImportacao(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de filtros avançados */}
        <Dialog open={filtrosAvancados} onOpenChange={setFiltrosAvancados}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtros Avançados</DialogTitle>
              <DialogDescription>
                Configure filtros detalhados para busca de usuários
              </DialogDescription>
            </DialogHeader>
            <FiltrosAvancados
              filtros={filtros}
              onAplicar={novosFiltros => {
                aplicarFiltros(novosFiltros);
                setFiltrosAvancados(false);
              }}
              onCancelar={() => setFiltrosAvancados(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
