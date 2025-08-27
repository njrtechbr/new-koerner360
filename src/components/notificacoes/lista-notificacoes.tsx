'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  User,
  Mail,
} from 'lucide-react';
import { useNotificacoesAvaliacoes } from '@/hooks/use-notificacoes-avaliacoes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FiltrosNotificacao {
  status: 'todas' | 'nao_lida' | 'lida';
  urgencia: 'todas' | 'baixa' | 'media' | 'alta';
  tipo: 'todas' | 'pendente' | 'lembrete' | 'vencida';
  busca: string;
}

interface ListaNotificacoesProps {
  className?: string;
  limite?: number;
  mostrarFiltros?: boolean;
  compacta?: boolean;
}

export function ListaNotificacoes({
  className,
  limite,
  mostrarFiltros = true,
  compacta = false,
}: ListaNotificacoesProps) {
  const { toast } = useToast();
  const {
    notificacoes,
    carregando,
    erro,
    marcarComoLida,
    marcarComoNaoLida,
    atualizarNotificacoes,
  } = useNotificacoesAvaliacoes();

  const [filtros, setFiltros] = useState<FiltrosNotificacao>({
    status: 'todas',
    urgencia: 'todas',
    tipo: 'todas',
    busca: '',
  });

  // Filtrar notificações
  const notificacoesFiltradas = useMemo(() => {
    let resultado = notificacoes;

    // Filtro por status
    if (filtros.status !== 'todas') {
      resultado = resultado.filter((notif) => {
        if (filtros.status === 'lida') return notif.lida;
        if (filtros.status === 'nao_lida') return !notif.lida;
        return true;
      });
    }

    // Filtro por urgência
    if (filtros.urgencia !== 'todas') {
      resultado = resultado.filter((notif) => notif.urgencia === filtros.urgencia);
    }

    // Filtro por tipo
    if (filtros.tipo !== 'todas') {
      resultado = resultado.filter((notif) => notif.tipo === filtros.tipo);
    }

    // Filtro por busca
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (notif) =>
          notif.titulo.toLowerCase().includes(termo) ||
          notif.descricao.toLowerCase().includes(termo) ||
          notif.nomeAvaliado?.toLowerCase().includes(termo) ||
          notif.nomeAvaliador?.toLowerCase().includes(termo)
      );
    }

    // Aplicar limite se especificado
    if (limite) {
      resultado = resultado.slice(0, limite);
    }

    return resultado;
  }, [notificacoes, filtros, limite]);

  const handleMarcarLida = async (id: string, lida: boolean) => {
    try {
      if (lida) {
        await marcarComoLida(id);
        toast({
          title: 'Notificação marcada como lida',
          description: 'A notificação foi marcada como lida com sucesso.',
        });
      } else {
        await marcarComoNaoLida(id);
        toast({
          title: 'Notificação marcada como não lida',
          description: 'A notificação foi marcada como não lida com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da notificação.',
        variant: 'destructive',
      });
    }
  };

  const obterIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'pendente':
        return <Clock className="h-4 w-4" />;
      case 'lembrete':
        return <Bell className="h-4 w-4" />;
      case 'vencida':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const obterCorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const obterCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'pendente':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'lembrete':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'vencida':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (erro) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar notificações: {erro}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={atualizarNotificacoes}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {!compacta && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {notificacoesFiltradas.length > 0 && (
              <Badge variant="secondary">{notificacoesFiltradas.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Acompanhe suas notificações de avaliações
          </CardDescription>
        </CardHeader>
      )}

      {mostrarFiltros && (
        <CardContent className={cn('space-y-4', compacta && 'pt-6')}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={filtros.busca}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, busca: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filtros.status}
                onValueChange={(value: any) =>
                  setFiltros((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="nao_lida">Não lidas</SelectItem>
                  <SelectItem value="lida">Lidas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.urgencia}
                onValueChange={(value: any) =>
                  setFiltros((prev) => ({ ...prev, urgencia: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.tipo}
                onValueChange={(value: any) =>
                  setFiltros((prev) => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
        </CardContent>
      )}

      <CardContent className={cn('p-0', mostrarFiltros && 'pt-0')}>
        <div className={cn('h-96 overflow-y-auto', compacta && 'h-64')}>
          {carregando ? (
            <div className="p-6 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Carregando notificações...
            </div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação encontrada</p>
              {filtros.busca || filtros.status !== 'todas' || filtros.urgencia !== 'todas' || filtros.tipo !== 'todas' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFiltros({
                      status: 'todas',
                      urgencia: 'todas',
                      tipo: 'todas',
                      busca: '',
                    })
                  }
                  className="mt-2"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y">
              {notificacoesFiltradas.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 transition-colors',
                    !notificacao.lida && 'bg-blue-50/50 dark:bg-blue-950/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        'p-2 rounded-full',
                        obterCorTipo(notificacao.tipo)
                      )}>
                        {obterIconeTipo(notificacao.tipo)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            'font-medium text-sm',
                            !notificacao.lida && 'font-semibold'
                          )}>
                            {notificacao.titulo}
                          </h4>
                          {!notificacao.lida && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {notificacao.descricao}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {notificacao.nomeAvaliado && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {notificacao.nomeAvaliado}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(notificacao.criadoEm), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })}
                          </div>
                          
                          {notificacao.prazo && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prazo: {format(new Date(notificacao.prazo), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={obterCorUrgencia(notificacao.urgencia) as any}
                            className="text-xs"
                          >
                            {notificacao.urgencia.charAt(0).toUpperCase() + notificacao.urgencia.slice(1)}
                          </Badge>
                          
                          <Badge
                            variant="outline"
                            className={cn('text-xs', obterCorTipo(notificacao.tipo))}
                          >
                            {notificacao.tipo.charAt(0).toUpperCase() + notificacao.tipo.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarcarLida(notificacao.id, !notificacao.lida)}
                        className="h-8 w-8 p-0"
                      >
                        {notificacao.lida ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ListaNotificacoes;