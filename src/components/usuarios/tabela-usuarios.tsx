'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Key,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/auth';
import { formatarData } from '@/lib/utils';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'OPERADOR';
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  ultimoLogin?: string;
  avatar?: string;
}

interface FiltrosTabela {
  busca: string;
  perfil: string;
  status: string;
  ordenarPor: 'nome' | 'email' | 'perfil' | 'criadoEm' | 'ultimoLogin';
  ordem: 'asc' | 'desc';
}

interface TabelaUsuariosProps {
  usuarios: Usuario[];
  carregando?: boolean;
  paginaAtual: number;
  totalPaginas: number;
  totalUsuarios: number;
  itensPorPagina: number;
  filtros: FiltrosTabela;
  onFiltroChange: (filtros: Partial<FiltrosTabela>) => void;
  onPaginaChange: (pagina: number) => void;
  onItensPorPaginaChange: (itens: number) => void;
  onEditar: (usuario: Usuario) => void;
  onExcluir: (usuarioId: string) => void;
  onAlterarStatus: (usuarioId: string, ativo: boolean) => void;
  onRedefinirSenha: (usuarioId: string) => void;
  onVisualizarDetalhes: (usuarioId: string) => void;
  onNovoUsuario: () => void;
  onExportar: () => void;
  onImportar: () => void;
  onAtualizar: () => void;
}

export function TabelaUsuarios({
  usuarios,
  carregando = false,
  paginaAtual,
  totalPaginas,
  totalUsuarios,
  itensPorPagina,
  filtros,
  onFiltroChange,
  onPaginaChange,
  onItensPorPaginaChange,
  onEditar,
  onExcluir,
  onAlterarStatus,
  onRedefinirSenha,
  onVisualizarDetalhes,
  onNovoUsuario,
  onExportar,
  onImportar,
  onAtualizar,
}: TabelaUsuariosProps) {
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>(
    []
  );
  // Permissões são agora gerenciadas pelo PermissionGuard

  // Obter iniciais do nome
  const obterIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Obter cor do badge do perfil
  const obterCorPerfil = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN':
        return 'destructive';
      case 'GESTOR':
        return 'default';
      case 'OPERADOR':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Manipular seleção de usuário
  const manipularSelecaoUsuario = (usuarioId: string, selecionado: boolean) => {
    if (selecionado) {
      setUsuariosSelecionados(prev => [...prev, usuarioId]);
    } else {
      setUsuariosSelecionados(prev => prev.filter(id => id !== usuarioId));
    }
  };

  // Manipular seleção de todos os usuários
  const manipularSelecaoTodos = (selecionado: boolean) => {
    if (selecionado) {
      setUsuariosSelecionados(usuarios.map(u => u.id));
    } else {
      setUsuariosSelecionados([]);
    }
  };

  // Manipular ordenação
  const manipularOrdenacao = (campo: FiltrosTabela['ordenarPor']) => {
    const novaOrdem =
      filtros.ordenarPor === campo && filtros.ordem === 'asc' ? 'desc' : 'asc';
    onFiltroChange({ ordenarPor: campo, ordem: novaOrdem });
  };

  // Renderizar ícone de ordenação
  const renderizarIconeOrdenacao = (campo: string) => {
    if (filtros.ordenarPor !== campo) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filtros.ordem === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Manipular ações em lote
  const manipularAcaoLote = async (
    acao: 'ativar' | 'desativar' | 'excluir'
  ) => {
    if (usuariosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um usuário');
      return;
    }

    const confirmacao = window.confirm(
      `Tem certeza que deseja ${acao} ${usuariosSelecionados.length} usuário(s) selecionado(s)?`
    );

    if (!confirmacao) return;

    try {
      // Aqui você implementaria a lógica para ações em lote
      // Por exemplo, fazer requisições para a API

      toast.success(
        `${usuariosSelecionados.length} usuário(s) ${acao === 'ativar' ? 'ativado(s)' : acao === 'desativar' ? 'desativado(s)' : 'excluído(s)'} com sucesso`
      );
      setUsuariosSelecionados([]);
      onAtualizar();
    } catch (error) {
      console.error(`Erro ao ${acao} usuários:`, error);
      toast.error(`Erro ao ${acao} usuários selecionados`);
    }
  };

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const ativos = usuarios.filter(u => u.ativo).length;
    const inativos = usuarios.filter(u => !u.ativo).length;
    const admins = usuarios.filter(u => u.perfil === 'ADMIN').length;
    const gestores = usuarios.filter(u => u.perfil === 'GESTOR').length;
    const operadores = usuarios.filter(u => u.perfil === 'OPERADOR').length;

    return { ativos, inativos, admins, gestores, operadores };
  }, [usuarios]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalUsuarios}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {estatisticas.ativos}
            </div>
            <div className="text-sm text-muted-foreground">Ativos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {estatisticas.inativos}
            </div>
            <div className="text-sm text-muted-foreground">Inativos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {estatisticas.admins}
            </div>
            <div className="text-sm text-muted-foreground">Admins</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {estatisticas.gestores}
            </div>
            <div className="text-sm text-muted-foreground">Gestores</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de ferramentas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Gerencie os usuários e suas permissões
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <PermissionGuard requiredPermissions={['criar_usuarios']}>
                <Button onClick={onNovoUsuario} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['importar_usuarios']}>
                <Button onClick={onImportar} variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['exportar_usuarios']}>
                <Button onClick={onExportar} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </PermissionGuard>

              <Button onClick={onAtualizar} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={filtros.busca}
                  onChange={e => onFiltroChange({ busca: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <Select
              value={filtros.perfil}
              onValueChange={value => onFiltroChange({ perfil: value })}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="GESTOR">Gestor</SelectItem>
                <SelectItem value="OPERADOR">Operador</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.status}
              onValueChange={value => onFiltroChange({ status: value })}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ações em lote */}
          {usuariosSelecionados.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {usuariosSelecionados.length} usuário(s) selecionado(s)
              </span>

              <div className="flex gap-2 ml-auto">
                {podeGerenciarUsuarios && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => manipularAcaoLote('ativar')}
                    >
                      <UserCheck className="mr-1 h-3 w-3" />
                      Ativar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => manipularAcaoLote('desativar')}
                    >
                      <UserX className="mr-1 h-3 w-3" />
                      Desativar
                    </Button>
                  </>
                )}

                {podeExcluirUsuarios && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => manipularAcaoLote('excluir')}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        usuariosSelecionados.length === usuarios.length &&
                        usuarios.length > 0
                      }
                      onCheckedChange={manipularSelecaoTodos}
                    />
                  </TableHead>

                  <TableHead className="w-[80px]">Avatar</TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => manipularOrdenacao('nome')}
                      className="h-auto p-0 font-semibold"
                    >
                      Nome
                      {renderizarIconeOrdenacao('nome')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => manipularOrdenacao('email')}
                      className="h-auto p-0 font-semibold"
                    >
                      Email
                      {renderizarIconeOrdenacao('email')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => manipularOrdenacao('perfil')}
                      className="h-auto p-0 font-semibold"
                    >
                      Perfil
                      {renderizarIconeOrdenacao('perfil')}
                    </Button>
                  </TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => manipularOrdenacao('criadoEm')}
                      className="h-auto p-0 font-semibold"
                    >
                      Criado em
                      {renderizarIconeOrdenacao('criadoEm')}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => manipularOrdenacao('ultimoLogin')}
                      className="h-auto p-0 font-semibold"
                    >
                      Último Login
                      {renderizarIconeOrdenacao('ultimoLogin')}
                    </Button>
                  </TableHead>

                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Carregando usuários...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        Nenhum usuário encontrado
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map(usuario => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <Checkbox
                          checked={usuariosSelecionados.includes(usuario.id)}
                          onCheckedChange={checked =>
                            manipularSelecaoUsuario(
                              usuario.id,
                              checked as boolean
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={usuario.avatar}
                            alt={usuario.nome}
                          />
                          <AvatarFallback className="text-xs">
                            {obterIniciais(usuario.nome)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      <TableCell className="font-medium">
                        {usuario.nome}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {usuario.email}
                      </TableCell>

                      <TableCell>
                        <Badge variant={obterCorPerfil(usuario.perfil)}>
                          {usuario.perfil}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={usuario.ativo ? 'default' : 'secondary'}
                          className={
                            usuario.ativo ? 'bg-green-500' : 'bg-gray-500'
                          }
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatarData(usuario.criadoEm)}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {usuario.ultimoLogin
                          ? formatarData(usuario.ultimoLogin)
                          : 'Nunca'}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => onVisualizarDetalhes(usuario.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>

                            <PermissionGuard
                              requiredPermissions={['editar_usuarios']}
                            >
                              <DropdownMenuItem
                                onClick={() => onEditar(usuario)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </PermissionGuard>

                            <PermissionGuard
                              requiredPermissions={
                                usuario.ativo
                                  ? ['desativar_usuarios']
                                  : ['ativar_usuarios']
                              }
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  onAlterarStatus(usuario.id, !usuario.ativo)
                                }
                              >
                                {usuario.ativo ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </PermissionGuard>

                            <PermissionGuard
                              requiredPermissions={['redefinir_senha_usuarios']}
                            >
                              <DropdownMenuItem
                                onClick={() => onRedefinirSenha(usuario.id)}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Redefinir senha
                              </DropdownMenuItem>
                            </PermissionGuard>

                            <PermissionGuard
                              requiredPermissions={['excluir_usuarios']}
                            >
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onExcluir(usuario.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </PermissionGuard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrando</span>
              <Select
                value={itensPorPagina.toString()}
                onValueChange={value => onItensPorPaginaChange(parseInt(value))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>de {totalUsuarios} usuários</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPaginaChange(paginaAtual - 1)}
                disabled={paginaAtual <= 1}
              >
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const pagina = i + 1;
                  return (
                    <Button
                      key={pagina}
                      variant={paginaAtual === pagina ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPaginaChange(pagina)}
                      className="w-8 h-8 p-0"
                    >
                      {pagina}
                    </Button>
                  );
                })}

                {totalPaginas > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant={
                        paginaAtual === totalPaginas ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => onPaginaChange(totalPaginas)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPaginas}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPaginaChange(paginaAtual + 1)}
                disabled={paginaAtual >= totalPaginas}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
