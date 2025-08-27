'use client';

import React, { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useNotificacoesAvaliacoes } from '@/hooks/use-notificacoes-avaliacoes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WidgetNotificacoesProps {
  className?: string;
  limite?: number;
  mostrarHeader?: boolean;
  mostrarAcoes?: boolean;
  apenasNaoLidas?: boolean;
  onVerTodas?: () => void;
  onConfigurar?: () => void;
}

export function WidgetNotificacoes({
  className,
  limite = 5,
  mostrarHeader = true,
  mostrarAcoes = true,
  apenasNaoLidas = false,
  onVerTodas,
  onConfigurar,
}: WidgetNotificacoesProps) {
  const { toast } = useToast();
  const {
    notificacoes,
    carregando,
    erro,
    marcarComoLida,
    atualizarNotificacoes,
  } = useNotificacoesAvaliacoes();

  const [expandido, setExpandido] = useState(false);

  // Filtrar e limitar notificações
  const notificacoesFiltradas = React.useMemo(() => {
    let resultado = notificacoes;
    
    if (apenasNaoLidas) {
      resultado = resultado.filter((n) => !n.lida);
    }
    
    // Ordenar por urgência e data
    resultado = resultado.sort((a, b) => {
      // Primeiro por urgência (alta > média > baixa)
      const urgenciaOrder = { alta: 3, media: 2, baixa: 1 };
      const urgenciaA = urgenciaOrder[a.urgencia as keyof typeof urgenciaOrder] || 0;
      const urgenciaB = urgenciaOrder[b.urgencia as keyof typeof urgenciaOrder] || 0;
      
      if (urgenciaA !== urgenciaB) {
        return urgenciaB - urgenciaA;
      }
      
      // Depois por data (mais recente primeiro)
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
    
    return expandido ? resultado : resultado.slice(0, limite);
  }, [notificacoes, apenasNaoLidas, limite, expandido]);

  const totalNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const totalVencidas = notificacoes.filter((n) => n.tipo === 'vencida').length;

  const handleMarcarLida = async (id: string) => {
    try {
      await marcarComoLida(id);
      toast({
        title: 'Notificação marcada como lida',
        description: 'A notificação foi marcada como lida com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a notificação como lida.',
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
        return 'text-blue-600';
      case 'lembrete':
        return 'text-yellow-600';
      case 'vencida':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (erro) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Erro ao carregar notificações</p>
            <Button
              variant="outline"
              size="sm"
              onClick={atualizarNotificacoes}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {mostrarHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notificações
                {totalNaoLidas > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {totalNaoLidas}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {totalVencidas > 0 ? (
                  <span className="text-red-600">
                    {totalVencidas} avaliação{totalVencidas > 1 ? 'ões' : ''} vencida{totalVencidas > 1 ? 's' : ''}
                  </span>
                ) : (
                  'Acompanhe suas notificações'
                )}
              </CardDescription>
            </div>
            
            {mostrarAcoes && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={atualizarNotificacoes}
                  disabled={carregando}
                >
                  <RefreshCw className={cn('h-4 w-4', carregando && 'animate-spin')} />
                </Button>
                
                {onConfigurar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onConfigurar}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {carregando ? (
          <div className="p-6 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Carregando...</p>
          </div>
        ) : notificacoesFiltradas.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {apenasNaoLidas ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {notificacoesFiltradas.map((notificacao, index) => (
                  <div
                    key={notificacao.id}
                    className={cn(
                      'p-4 hover:bg-muted/50 transition-colors',
                      !notificacao.lida && 'bg-blue-50/50 dark:bg-blue-950/20',
                      index === 0 && 'border-t-0'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-1.5 rounded-full bg-muted', obterCorTipo(notificacao.tipo))}>
                        {obterIconeTipo(notificacao.tipo)}
                      </div>
                      
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            'font-medium text-sm leading-tight',
                            !notificacao.lida && 'font-semibold'
                          )}>
                            {notificacao.titulo}
                            {!notificacao.lida && (
                              <span className="ml-2 inline-block h-2 w-2 bg-blue-600 rounded-full" />
                            )}
                          </h4>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarcarLida(notificacao.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {notificacao.lida ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notificacao.descricao}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={obterCorUrgencia(notificacao.urgencia) as any}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {notificacao.urgencia}
                            </Badge>
                            
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notificacao.criadoEm), 'dd/MM HH:mm', {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          
                          {notificacao.prazo && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(notificacao.prazo), 'dd/MM', {
                                locale: ptBR,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Rodapé com ações */}
            <div className="p-3 border-t bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {expandido ? (
                    `${notificacoesFiltradas.length} de ${notificacoes.length} notificações`
                  ) : (
                    `${Math.min(limite, notificacoesFiltradas.length)} de ${notificacoes.length} notificações`
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {notificacoes.length > limite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandido(!expandido)}
                      className="text-xs h-7"
                    >
                      {expandido ? 'Mostrar menos' : `Ver todas (${notificacoes.length})`}
                      <ChevronRight className={cn(
                        'h-3 w-3 ml-1 transition-transform',
                        expandido && 'rotate-90'
                      )} />
                    </Button>
                  )}
                  
                  {onVerTodas && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onVerTodas}
                      className="text-xs h-7"
                    >
                      Gerenciar
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default WidgetNotificacoes;