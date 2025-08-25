'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  FileX,
  Filter,
  History,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoAlteracao {
  id: string;
  atendenteId: string;
  atendente: {
    nome: string;
    email: string;
    cargo: string;
    setor: string;
  };
  tipoAlteracao:
    | 'CRIACAO'
    | 'ATUALIZACAO'
    | 'EXCLUSAO'
    | 'ATIVACAO'
    | 'DESATIVACAO'
    | 'MUDANCA_STATUS'
    | 'UPLOAD_DOCUMENTO'
    | 'REMOCAO_DOCUMENTO';
  descricao: string;
  dadosAnteriores: any;
  dadosNovos: any;
  alteradoPor: {
    id: string;
    nome: string;
    email: string;
  };
  dataAlteracao: string;
  ipOrigem?: string;
  userAgent?: string;
}

interface FiltrosHistorico {
  busca?: string;
  atendenteId?: string;
  tipo?: string;
  criadoPorId?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
}

interface EstatisticasHistorico {
  totalAlteracoes: number;
  alteracoesPorTipo: Record<string, number>;
  alteracoesPorUsuario: Record<string, number>;
  alteracoesPorPeriodo: Array<{
    data: string;
    total: number;
  }>;
}

export default function HistoricoAtendentesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [estatisticas, setEstatisticas] =
    useState<EstatisticasHistorico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalItens: 0,
    itensPorPagina: 20,
  });
  const [filtros, setFiltros] = useState<FiltrosHistorico>({
    atendenteId: searchParams.get('atendenteId') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    dataInicio: searchParams.get('dataInicio') || undefined,
    dataFim: searchParams.get('dataFim') || undefined,
  });
  const [alteracaoSelecionada, setAlteracaoSelecionada] =
    useState<HistoricoAlteracao | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [atendentes, setAtendentes] = useState<
    Array<{ id: string; nome: string; email: string }>
  >([]);
  const [usuarios, setUsuarios] = useState<
    Array<{ id: string; nome: string; email: string }>
  >([]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarAtendentes();
    carregarUsuarios();
  }, []);

  // Carregar histórico quando filtros ou paginação mudam
  useEffect(() => {
    carregarHistorico();
  }, [filtros, paginacao.paginaAtual, paginacao.itensPorPagina]);

  // Carregar lista de atendentes para filtro
  const carregarAtendentes = async () => {
    try {
      const response = await fetch(
        '/api/atendentes?limite=1000&campos=id,nome,email'
      );
      if (response.ok) {
        const data = await response.json();
        setAtendentes(data.atendentes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
    }
  };

  // Carregar lista de usuários para filtro
  const carregarUsuarios = async () => {
    try {
      const response = await fetch(
        '/api/usuarios?limite=1000&campos=id,nome,email'
      );
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Carregar histórico de alterações
  const carregarHistorico = async () => {
    try {
      setCarregando(true);

      const params = new URLSearchParams();
      params.append('pagina', paginacao.paginaAtual.toString());
      params.append('limite', paginacao.itensPorPagina.toString());

      if (filtros.atendenteId)
        params.append('atendenteId', filtros.atendenteId);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.criadoPorId)
        params.append('criadoPorId', filtros.criadoPorId);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros.busca) params.append('busca', filtros.busca);

      const response = await fetch(`/api/atendentes/historico?${params}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const data = await response.json();
      setHistorico(data.historico || []);
      setEstatisticas(data.estatisticas || null);
      setPaginacao(prev => ({
        ...prev,
        totalPaginas: data.paginacao?.totalPaginas || 1,
        totalItens: data.paginacao?.totalItens || 0,
      }));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de alterações');
    } finally {
      setCarregando(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (novosFiltros: Partial<FiltrosHistorico>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({});
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
  };

  // Exportar histórico
  const exportarHistorico = async () => {
    try {
      const params = new URLSearchParams();
      params.append('formato', 'excel');

      if (filtros.atendenteId)
        params.append('atendenteId', filtros.atendenteId);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.criadoPorId)
        params.append('criadoPorId', filtros.criadoPorId);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros.busca) params.append('busca', filtros.busca);

      const response = await fetch(
        `/api/atendentes/historico/exportar?${params}`
      );

      if (!response.ok) {
        throw new Error('Erro ao exportar histórico');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-atendentes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Histórico exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar histórico:', error);
      toast.error('Erro ao exportar histórico');
    }
  };

  // Obter ícone do tipo de alteração
  const obterIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'CRIACAO':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'ATUALIZACAO':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DESATIVACAO':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'ATIVACAO':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'EXCLUSAO':
        return <Trash2 className="h-4 w-4 text-red-800" />;
      case 'MUDANCA_STATUS':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'UPLOAD_DOCUMENTO':
        return <Upload className="h-4 w-4 text-purple-600" />;
      case 'REMOCAO_DOCUMENTO':
        return <FileX className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Obter cor do badge do tipo
  const obterCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'CRIACAO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ATUALIZACAO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DESATIVACAO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ATIVACAO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EXCLUSAO':
        return 'bg-red-200 text-red-900 border-red-300';
      case 'MUDANCA_STATUS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'UPLOAD_DOCUMENTO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REMOCAO_DOCUMENTO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Formatar nome do tipo
  const formatarTipo = (tipo: string) => {
    const tipos = {
      CRIACAO: 'Criação',
      ATUALIZACAO: 'Atualização',
      DESATIVACAO: 'Desativação',
      ATIVACAO: 'Ativação',
      EXCLUSAO: 'Exclusão',
      MUDANCA_STATUS: 'Mudança de Status',
      UPLOAD_DOCUMENTO: 'Upload de Documento',
      REMOCAO_DOCUMENTO: 'Remoção de Documento',
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  // Navegar entre páginas
  const irParaPagina = (pagina: number) => {
    setPaginacao(prev => ({ ...prev, paginaAtual: pagina }));
  };

  // Visualizar detalhes da alteração
  const visualizarDetalhes = (alteracao: HistoricoAlteracao) => {
    setAlteracaoSelecionada(alteracao);
    setModalDetalhesAberto(true);
  };

  return (
    <AuthGuard requiredPermissions={['visualizar_historico_atendentes']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Histórico de Alterações
            </h1>
            <p className="text-muted-foreground">
              Registro completo de todas as alterações realizadas nos atendentes
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => carregarHistorico()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>

            <Button variant="outline" size="sm" onClick={exportarHistorico}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/atendentes')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Alterações
                </CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.totalAlteracoes}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registros encontrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tipo Mais Comum
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.entries(estatisticas.alteracoesPorTipo).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[1] || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatarTipo(
                    Object.entries(estatisticas.alteracoesPorTipo).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[0] || ''
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuários Ativos
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(estatisticas.alteracoesPorUsuario).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Realizaram alterações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Período Analisado
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estatisticas.alteracoesPorPeriodo.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dias com atividade
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Configure os filtros para refinar a busca no histórico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição..."
                    value={filtros.busca || ''}
                    onChange={e => aplicarFiltros({ busca: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Atendente
                </label>
                <Select
                  value={filtros.atendenteId || 'todos'}
                  onValueChange={value =>
                    aplicarFiltros({
                      atendenteId: value === 'todos' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os atendentes</SelectItem>
                    {atendentes.map(atendente => (
                      <SelectItem key={atendente.id} value={atendente.id}>
                        {atendente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Alteração
                </label>
                <Select
                  value={filtros.tipo || 'todos'}
                  onValueChange={value =>
                    aplicarFiltros({
                      tipo: value === 'todos' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="CRIACAO">Criação</SelectItem>
                    <SelectItem value="ATUALIZACAO">Atualização</SelectItem>
                    <SelectItem value="DESATIVACAO">Desativação</SelectItem>
                    <SelectItem value="ATIVACAO">Ativação</SelectItem>
                    <SelectItem value="EXCLUSAO">Exclusão</SelectItem>
                    <SelectItem value="MUDANCA_STATUS">
                      Mudança de Status
                    </SelectItem>
                    <SelectItem value="UPLOAD_DOCUMENTO">
                      Upload de Documento
                    </SelectItem>
                    <SelectItem value="REMOCAO_DOCUMENTO">
                      Remoção de Documento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Alterado Por
                </label>
                <Select
                  value={filtros.criadoPorId || 'todos'}
                  onValueChange={value =>
                    aplicarFiltros({
                      criadoPorId: value === 'todos' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os usuários</SelectItem>
                    {usuarios.map(usuario => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={e => aplicarFiltros({ dataInicio: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={e => aplicarFiltros({ dataFim: e.target.value })}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista do Histórico */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Histórico de Alterações</CardTitle>
                <CardDescription>
                  {paginacao.totalItens > 0
                    ? `Mostrando ${(paginacao.paginaAtual - 1) * paginacao.itensPorPagina + 1} a ${Math.min(paginacao.paginaAtual * paginacao.itensPorPagina, paginacao.totalItens)} de ${paginacao.totalItens} registros`
                    : 'Nenhum registro encontrado'}
                </CardDescription>
              </div>

              <Select
                value={paginacao.itensPorPagina.toString()}
                onValueChange={value =>
                  setPaginacao(prev => ({
                    ...prev,
                    itensPorPagina: parseInt(value),
                    paginaAtual: 1,
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Carregando histórico...
                </span>
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma alteração encontrada
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente ajustar os filtros para encontrar registros
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historico.map(alteracao => (
                  <div
                    key={alteracao.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {obterIconeTipo(alteracao.tipoAlteracao)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={obterCorTipo(alteracao.tipoAlteracao)}
                            >
                              {formatarTipo(alteracao.tipoAlteracao)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(
                                new Date(alteracao.dataAlteracao),
                                'dd/MM/yyyy HH:mm',
                                { locale: ptBR }
                              )}
                            </span>
                          </div>

                          <h4 className="font-medium mb-1">
                            {alteracao.atendente.nome}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alteracao.atendente.cargo} -{' '}
                            {alteracao.atendente.setor}
                          </p>

                          <p className="text-sm mb-2">{alteracao.descricao}</p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {alteracao.alteradoPor.nome}
                            </span>
                            {alteracao.ipOrigem && (
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {alteracao.ipOrigem}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => visualizarDetalhes(alteracao)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {paginacao.totalPaginas > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {paginacao.paginaAtual} de {paginacao.totalPaginas}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => irParaPagina(1)}
                disabled={paginacao.paginaAtual === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => irParaPagina(paginacao.paginaAtual - 1)}
                disabled={paginacao.paginaAtual === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-4 py-2 text-sm">{paginacao.paginaAtual}</span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => irParaPagina(paginacao.paginaAtual + 1)}
                disabled={paginacao.paginaAtual === paginacao.totalPaginas}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => irParaPagina(paginacao.totalPaginas)}
                disabled={paginacao.paginaAtual === paginacao.totalPaginas}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Modal de Detalhes */}
        <Dialog
          open={modalDetalhesAberto}
          onOpenChange={setModalDetalhesAberto}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {alteracaoSelecionada &&
                  obterIconeTipo(alteracaoSelecionada.tipoAlteracao)}
                Detalhes da Alteração
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre a alteração realizada
              </DialogDescription>
            </DialogHeader>

            {alteracaoSelecionada && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Informações Gerais</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <Badge
                          className={obterCorTipo(
                            alteracaoSelecionada.tipoAlteracao
                          )}
                        >
                          {formatarTipo(alteracaoSelecionada.tipoAlteracao)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span>
                          {format(
                            new Date(alteracaoSelecionada.dataAlteracao),
                            'dd/MM/yyyy HH:mm:ss',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Alterado por:
                        </span>
                        <span>{alteracaoSelecionada.alteradoPor.nome}</span>
                      </div>
                      {alteracaoSelecionada.ipOrigem && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP:</span>
                          <span>{alteracaoSelecionada.ipOrigem}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Atendente</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span>{alteracaoSelecionada.atendente.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{alteracaoSelecionada.atendente.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cargo:</span>
                        <span>{alteracaoSelecionada.atendente.cargo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Setor:</span>
                        <span>{alteracaoSelecionada.atendente.setor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {alteracaoSelecionada.descricao}
                  </p>
                </div>

                {/* Dados Anteriores e Novos */}
                {(alteracaoSelecionada.dadosAnteriores ||
                  alteracaoSelecionada.dadosNovos) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {alteracaoSelecionada.dadosAnteriores && (
                      <div>
                        <h4 className="font-medium mb-2 text-red-600">
                          Dados Anteriores
                        </h4>
                        <pre className="text-xs bg-red-50 p-3 rounded-lg overflow-auto max-h-60 border border-red-200">
                          {JSON.stringify(
                            alteracaoSelecionada.dadosAnteriores,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}

                    {alteracaoSelecionada.dadosNovos && (
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">
                          Dados Novos
                        </h4>
                        <pre className="text-xs bg-green-50 p-3 rounded-lg overflow-auto max-h-60 border border-green-200">
                          {JSON.stringify(
                            alteracaoSelecionada.dadosNovos,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Informações Técnicas */}
                {alteracaoSelecionada.userAgent && (
                  <div>
                    <h4 className="font-medium mb-2">Informações Técnicas</h4>
                    <div className="text-xs bg-muted p-3 rounded-lg">
                      <div className="mb-2">
                        <span className="font-medium">User Agent:</span>
                      </div>
                      <div className="break-all">
                        {alteracaoSelecionada.userAgent}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
