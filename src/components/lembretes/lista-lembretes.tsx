'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLembretes } from '@/hooks/use-lembretes';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Mail, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Send, 
  Edit, 
  Trash2,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lembrete, FiltrosLembretes } from '@/hooks/use-lembretes';

interface ListaLembretesProps {
  className?: string;
  filtrosIniciais?: FiltrosLembretes;
}

export function ListaLembretes({ className, filtrosIniciais = {} }: ListaLembretesProps) {
  const [filtros, setFiltros] = useState<FiltrosLembretes>({
    limite: 50,
    pagina: 1,
    ...filtrosIniciais,
  });
  const [busca, setBusca] = useState('');
  const [lembreteDetalhes, setLembreteDetalhes] = useState<Lembrete | null>(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  const {
    lembretes,
    paginacao,
    carregando,
    erro,
    buscarLembretes,
    executarAcaoLembrete,
    removerLembrete,
  } = useLembretes(filtros);

  const { toast } = useToast();

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      buscarLembretes(filtros);
    }, 30000);

    return () => clearInterval(interval);
  }, [filtros, buscarLembretes]);

  const handleBuscar = () => {
    const novosFiltros = { ...filtros, pagina: 1 };
    if (busca.trim()) {
      // Implementar busca por nome do usuário ou avaliado
      // Por enquanto, apenas recarrega os dados
    }
    setFiltros(novosFiltros);
    buscarLembretes(novosFiltros);
  };

  const handleFiltroChange = (campo: keyof FiltrosLembretes, valor: any) => {
    const novosFiltros = { ...filtros, [campo]: valor, pagina: 1 };
    setFiltros(novosFiltros);
    buscarLembretes(novosFiltros);
  };

  const handlePaginacao = (novaPagina: number) => {
    const novosFiltros = { ...filtros, pagina: novaPagina };
    setFiltros(novosFiltros);
    buscarLembretes(novosFiltros);
  };

  const handleVerDetalhes = (lembrete: Lembrete) => {
    setLembreteDetalhes(lembrete);
    setMostrarDetalhes(true);
  };

  const handleReenviar = async (lembrete: Lembrete) => {
    try {
      await executarAcaoLembrete(lembrete.id, 'reenviar');
      toast({
        title: 'Sucesso',
        description: 'Lembrete reenviado com sucesso.',
      });
      // Atualizar lista após ação bem-sucedida
      buscarLembretes(filtros);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao reenviar lembrete.',
        variant: 'destructive',
      });
    }
  };

  const handleMarcarEnviado = async (lembrete: Lembrete) => {
    try {
      await executarAcaoLembrete(lembrete.id, 'marcar_enviado');
      toast({
        title: 'Sucesso',
        description: 'Lembrete marcado como enviado.',
      });
      // Atualizar lista após ação bem-sucedida
      buscarLembretes(filtros);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar lembrete como enviado.',
        variant: 'destructive',
      });
    }
  };

  const handleReagendar = async (lembrete: Lembrete) => {
    const novaData = prompt('Digite a nova data/hora (YYYY-MM-DD HH:MM):');
    if (novaData) {
      try {
        await executarAcaoLembrete(lembrete.id, 'reagendar', { dataEnvio: novaData });
        toast({
          title: 'Sucesso',
          description: 'Lembrete reagendado com sucesso.',
        });
        // Atualizar lista após ação bem-sucedida
        buscarLembretes(filtros);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao reagendar lembrete.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemover = async (lembrete: Lembrete) => {
    if (confirm(`Tem certeza que deseja remover o lembrete para ${lembrete.usuario.nome}?`)) {
      try {
        await removerLembrete(lembrete.id);
        toast({
          title: 'Sucesso',
          description: 'Lembrete removido com sucesso.',
        });
        // Atualizar lista após ação bem-sucedida
        buscarLembretes(filtros);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao remover lembrete.',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusIcon = (lembrete: Lembrete) => {
    if (lembrete.enviado) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (lembrete.erro) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (new Date(lembrete.dataEnvio) < new Date()) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  const getStatusText = (lembrete: Lembrete) => {
    if (lembrete.enviado) return 'Enviado';
    if (lembrete.erro) return 'Falha';
    if (new Date(lembrete.dataEnvio) < new Date()) return 'Atrasado';
    return 'Agendado';
  };

  const getStatusVariant = (lembrete: Lembrete): 'default' | 'secondary' | 'destructive' => {
    if (lembrete.enviado) return 'default';
    if (lembrete.erro) return 'destructive';
    if (new Date(lembrete.dataEnvio) < new Date()) return 'destructive';
    return 'secondary';
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'lembrete':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'vencimento':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Lembretes
          </CardTitle>
          <CardDescription>
            Gerencie todos os lembretes de avaliação do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="busca">Buscar</Label>
                <div className="flex gap-2">
                  <Input
                    id="busca"
                    placeholder="Buscar por usuário ou avaliado..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                  />
                  <Button onClick={handleBuscar} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => buscarLembretes()}
                variant="outline"
                size="icon"
                disabled={carregando}
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={filtros.tipo || 'todos'}
                  onValueChange={(value) => 
                    handleFiltroChange('tipo', value === 'todos' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="lembrete">Lembrete</SelectItem>
                    <SelectItem value="vencimento">Vencimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filtros.enviado === undefined ? 'todos' : filtros.enviado ? 'enviado' : 'pendente'}
                  onValueChange={(value) => {
                    let enviado: boolean | undefined;
                    if (value === 'enviado') enviado = true;
                    else if (value === 'pendente') enviado = false;
                    else enviado = undefined;
                    handleFiltroChange('enviado', enviado);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={(e) => handleFiltroChange('dataInicio', e.target.value || undefined)}
                />
              </div>

              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={(e) => handleFiltroChange('dataFim', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>

          {erro && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {/* Lista de Lembretes */}
          <div className="space-y-2">
            {carregando && lembretes.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Carregando lembretes...</p>
              </div>
            ) : lembretes.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Nenhum lembrete encontrado</p>
              </div>
            ) : (
              lembretes.map((lembrete) => (
                <Card key={lembrete.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getTipoIcon(lembrete.tipo)}
                          {getStatusIcon(lembrete)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{lembrete.usuario.nome}</h4>
                            <Badge variant={lembrete.tipo === 'vencimento' ? 'destructive' : 'default'}>
                              {lembrete.tipo}
                            </Badge>
                            <Badge variant={getStatusVariant(lembrete)}>
                              {getStatusText(lembrete)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-1">
                            <User className="h-3 w-3 inline mr-1" />
                            Avaliado: {lembrete.avaliacao.avaliado.nome}
                          </p>
                          
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Agendado: {format(new Date(lembrete.dataEnvio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                          
                          {lembrete.dataEnvioReal && (
                            <p className="text-sm text-muted-foreground">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Enviado: {format(new Date(lembrete.dataEnvioReal), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          )}
                          
                          {lembrete.erro && (
                            <p className="text-sm text-red-600">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              Erro: {lembrete.erro}
                            </p>
                          )}
                          
                          <p className="text-sm text-muted-foreground">
                            <RefreshCw className="h-3 w-3 inline mr-1" />
                            {lembrete.tentativas === 1 ? '1 tentativa' : `${lembrete.tentativas} tentativas`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDetalhes(lembrete)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        {!lembrete.enviado && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReenviar(lembrete)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReagendar(lembrete)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarcarEnviado(lembrete)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemover(lembrete)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Paginação */}
          {paginacao.totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {((paginacao.paginaAtual - 1) * paginacao.itensPorPagina) + 1} a{' '}
                {Math.min(paginacao.paginaAtual * paginacao.itensPorPagina, paginacao.totalItens)} de{' '}
                {paginacao.totalItens} lembretes
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginacao(paginacao.paginaAtual - 1)}
                  disabled={!paginacao.temPaginaAnterior || carregando}
                >
                  Anterior
                </Button>
                
                <span className="text-sm">
                  Página {paginacao.paginaAtual} de {paginacao.totalPaginas}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginacao(paginacao.paginaAtual + 1)}
                  disabled={!paginacao.temProximaPagina || carregando}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={mostrarDetalhes} onOpenChange={setMostrarDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lembrete</DialogTitle>
            <DialogDescription>
              Informações completas sobre o lembrete selecionado
            </DialogDescription>
          </DialogHeader>
          
          {lembreteDetalhes && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Usuário</Label>
                  <p className="font-medium">{lembreteDetalhes.usuario.nome}</p>
                  <p className="text-sm text-muted-foreground">{lembreteDetalhes.usuario.email}</p>
                </div>
                
                <div>
                  <Label>Avaliado</Label>
                  <p className="font-medium">{lembreteDetalhes.avaliacao.avaliado.nome}</p>
                  <p className="text-sm text-muted-foreground">{lembreteDetalhes.avaliacao.avaliado.email}</p>
                </div>
                
                <div>
                  <Label>Tipo</Label>
                  <Badge variant={lembreteDetalhes.tipo === 'vencimento' ? 'destructive' : 'default'}>
                    {lembreteDetalhes.tipo}
                  </Badge>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusVariant(lembreteDetalhes)}>
                    {getStatusText(lembreteDetalhes)}
                  </Badge>
                </div>
                
                <div>
                  <Label>Data Agendada</Label>
                  <p>{format(new Date(lembreteDetalhes.dataEnvio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
                
                {lembreteDetalhes.dataEnvioReal && (
                  <div>
                    <Label>Data de Envio</Label>
                    <p>{format(new Date(lembreteDetalhes.dataEnvioReal), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                )}
                
                <div>
                  <Label>Tentativas</Label>
                  <p>{lembreteDetalhes.tentativas}</p>
                </div>
                
                <div>
                  <Label>Prazo da Avaliação</Label>
                  <p>{format(new Date(lembreteDetalhes.avaliacao.prazo), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </div>
              
              {lembreteDetalhes.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{lembreteDetalhes.observacoes}</p>
                </div>
              )}
              
              {lembreteDetalhes.erro && (
                <div>
                  <Label>Erro</Label>
                  <p className="text-sm bg-red-50 text-red-700 p-2 rounded">{lembreteDetalhes.erro}</p>
                </div>
              )}
              
              <div>
                <Label>Período da Avaliação</Label>
                <p className="font-medium">{lembreteDetalhes.avaliacao.periodo.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(lembreteDetalhes.avaliacao.periodo.dataInicio), 'dd/MM/yyyy', { locale: ptBR })} a{' '}
                  {format(new Date(lembreteDetalhes.avaliacao.periodo.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ListaLembretes;