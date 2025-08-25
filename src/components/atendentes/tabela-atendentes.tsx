'use client';

import React, { useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Eye,
  UserX,
  UserCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos
interface Atendente {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  dataAdmissao: string;
  ultimoAcesso?: string;
  foto?: string;
}

interface TabelaAtendentesProps {
  atendentes: Atendente[];
  carregando?: boolean;
  onEditar?: (atendente: Atendente) => void;
  onVisualizar?: (atendente: Atendente) => void;
  onAtivar?: (atendente: Atendente) => void;
  onDesativar?: (atendente: Atendente) => void;
  onAtualizar?: () => void;
}

type OrdenacaoColuna =
  | 'nomeCompleto'
  | 'email'
  | 'cargo'
  | 'departamento'
  | 'status'
  | 'dataAdmissao';
type DirecaoOrdenacao = 'asc' | 'desc';

const statusConfig = {
  ATIVO: {
    label: 'Ativo',
    variant: 'default' as const,
    color: 'bg-green-100 text-green-800',
  },
  INATIVO: {
    label: 'Inativo',
    variant: 'secondary' as const,
    color: 'bg-gray-100 text-gray-800',
  },
  SUSPENSO: {
    label: 'Suspenso',
    variant: 'destructive' as const,
    color: 'bg-red-100 text-red-800',
  },
};

const itensPorPaginaOpcoes = [10, 25, 50, 100];

export function TabelaAtendentes({
  atendentes,
  carregando = false,
  onEditar,
  onVisualizar,
  onAtivar,
  onDesativar,
  onAtualizar,
}: TabelaAtendentesProps) {
  // Estados para filtros e paginação
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [colunaOrdenacao, setColunaOrdenacao] =
    useState<OrdenacaoColuna>('nomeCompleto');
  const [direcaoOrdenacao, setDirecaoOrdenacao] =
    useState<DirecaoOrdenacao>('asc');

  // Filtrar e ordenar dados
  const dadosFiltrados = useMemo(() => {
    const resultado = atendentes.filter(atendente => {
      const textoMatch =
        filtroTexto === '' ||
        atendente.nomeCompleto
          .toLowerCase()
          .includes(filtroTexto.toLowerCase()) ||
        atendente.email.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        atendente.cargo.toLowerCase().includes(filtroTexto.toLowerCase());

      const statusMatch =
        filtroStatus === 'todos' || atendente.status === filtroStatus;
      const departamentoMatch =
        filtroDepartamento === 'todos' ||
        atendente.departamento === filtroDepartamento;

      return textoMatch && statusMatch && departamentoMatch;
    });

    // Ordenação
    resultado.sort((a, b) => {
      let valorA = a[colunaOrdenacao];
      let valorB = b[colunaOrdenacao];

      if (colunaOrdenacao === 'dataAdmissao') {
        valorA = new Date(valorA).getTime();
        valorB = new Date(valorB).getTime();
      } else {
        valorA = valorA.toString().toLowerCase();
        valorB = valorB.toString().toLowerCase();
      }

      if (valorA < valorB) return direcaoOrdenacao === 'asc' ? -1 : 1;
      if (valorA > valorB) return direcaoOrdenacao === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [
    atendentes,
    filtroTexto,
    filtroStatus,
    filtroDepartamento,
    colunaOrdenacao,
    direcaoOrdenacao,
  ]);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const dadosPaginados = dadosFiltrados.slice(indiceInicio, indiceFim);

  // Obter departamentos únicos para filtro
  const departamentos = useMemo(() => {
    const deps = [...new Set(atendentes.map(a => a.departamento))].sort();
    return deps;
  }, [atendentes]);

  // Funções de ordenação
  const handleOrdenacao = (coluna: OrdenacaoColuna) => {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
    } else {
      setColunaOrdenacao(coluna);
      setDirecaoOrdenacao('asc');
    }
  };

  const getIconeOrdenacao = (coluna: OrdenacaoColuna) => {
    if (colunaOrdenacao !== coluna) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return direcaoOrdenacao === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  // Funções de paginação
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual(Math.max(1, paginaAtual - 1));
  const irParaProximaPagina = () =>
    setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1));

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroTexto('');
    setFiltroStatus('todos');
    setFiltroDepartamento('todos');
    setPaginaAtual(1);
  };

  // Exportar dados
  const exportarDados = () => {
    try {
      const dadosExportacao = dadosFiltrados.map(atendente => ({
        'Nome Completo': atendente.nomeCompleto,
        Email: atendente.email,
        Telefone: atendente.telefone,
        Cargo: atendente.cargo,
        Departamento: atendente.departamento,
        Status: statusConfig[atendente.status].label,
        'Data de Admissão': new Date(atendente.dataAdmissao).toLocaleDateString(
          'pt-BR'
        ),
        'Último Acesso': atendente.ultimoAcesso
          ? new Date(atendente.ultimoAcesso).toLocaleDateString('pt-BR')
          : 'Nunca',
      }));

      const csv = [
        Object.keys(dadosExportacao[0] || {}).join(','),
        ...dadosExportacao.map(row => Object.values(row).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `atendentes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados.');
    }
  };

  // Formatação de data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Atendentes ({dadosFiltrados.length})</span>
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAtualizar}
              disabled={carregando}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${carregando ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportarDados}
              disabled={dadosFiltrados.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou cargo..."
                value={filtroTexto}
                onChange={e => setFiltroTexto(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
                <SelectItem value="SUSPENSO">Suspenso</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroDepartamento}
              onValueChange={setFiltroDepartamento}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Departamentos</SelectItem>
                {departamentos.map(dep => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={limparFiltros}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleOrdenacao('nomeCompleto')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Nome Completo
                      {getIconeOrdenacao('nomeCompleto')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleOrdenacao('email')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Email
                      {getIconeOrdenacao('email')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleOrdenacao('cargo')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Cargo
                      {getIconeOrdenacao('cargo')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleOrdenacao('departamento')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Departamento
                      {getIconeOrdenacao('departamento')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleOrdenacao('status')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Status
                      {getIconeOrdenacao('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleOrdenacao('dataAdmissao')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Admissão
                      {getIconeOrdenacao('dataAdmissao')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Carregando atendentes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : dadosPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {dadosFiltrados.length === 0 && atendentes.length > 0
                          ? 'Nenhum atendente encontrado com os filtros aplicados.'
                          : 'Nenhum atendente cadastrado.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosPaginados.map(atendente => (
                    <TableRow key={atendente.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {atendente.foto ? (
                              <img
                                src={atendente.foto}
                                alt={atendente.nomeCompleto}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {atendente.nomeCompleto
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {atendente.nomeCompleto}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {atendente.telefone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{atendente.email}</TableCell>
                      <TableCell>{atendente.cargo}</TableCell>
                      <TableCell>{atendente.departamento}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig[atendente.status].variant}
                          className={statusConfig[atendente.status].color}
                        >
                          {statusConfig[atendente.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{formatarData(atendente.dataAdmissao)}</div>
                          {atendente.ultimoAcesso && (
                            <div className="text-xs text-muted-foreground">
                              Último acesso:{' '}
                              {formatarDataHora(atendente.ultimoAcesso)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                              onClick={() => onVisualizar?.(atendente)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditar?.(atendente)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {atendente.status === 'ATIVO' ? (
                              <DropdownMenuItem
                                onClick={() => onDesativar?.(atendente)}
                                className="text-red-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => onAtivar?.(atendente)}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Mostrando {indiceInicio + 1} a{' '}
                {Math.min(indiceFim, dadosFiltrados.length)} de{' '}
                {dadosFiltrados.length} resultados
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Itens por página:
                </span>
                <Select
                  value={itensPorPagina.toString()}
                  onValueChange={value => {
                    setItensPorPagina(Number(value));
                    setPaginaAtual(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itensPorPaginaOpcoes.map(opcao => (
                      <SelectItem key={opcao} value={opcao.toString()}>
                        {opcao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irParaPrimeiraPagina}
                  disabled={paginaAtual === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irParaPaginaAnterior}
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm px-2">
                  Página {paginaAtual} de {totalPaginas}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={irParaProximaPagina}
                  disabled={paginaAtual === totalPaginas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irParaUltimaPagina}
                  disabled={paginaAtual === totalPaginas}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TabelaAtendentes;
export type { TabelaAtendentesProps, Atendente };
