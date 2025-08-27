'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Badge,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Separator,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';
import {
  AvaliacaoPendente,
  EstatisticasNotificacoes,
  formatarMensagemNotificacao
} from '@/lib/utils/notificacoes-avaliacoes';

interface NotificacoesAvaliacoesProps {
  usuarioId: string;
  avaliacoesPendentes: AvaliacaoPendente[];
  estatisticas: EstatisticasNotificacoes;
  onAvaliacaoClick?: (avaliacaoId: string) => void;
  onMarcarComoLida?: (avaliacaoId: string) => void;
  className?: string;
}

interface NotificacaoItem {
  id: string;
  tipo: 'lembrete' | 'urgente' | 'vencida';
  titulo: string;
  mensagem: string;
  avaliacao: AvaliacaoPendente;
  lida: boolean;
  criadaEm: Date;
}

export function NotificacoesAvaliacoes({
  usuarioId,
  avaliacoesPendentes,
  estatisticas,
  onAvaliacaoClick,
  onMarcarComoLida,
  className
}: NotificacoesAvaliacoesProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Gerar notificações baseadas nas avaliações pendentes
  useEffect(() => {
    const novasNotificacoes: NotificacaoItem[] = avaliacoesPendentes.map(avaliacao => {
      let tipo: 'lembrete' | 'urgente' | 'vencida';
      
      if (avaliacao.diasRestantes < 0) {
        tipo = 'vencida';
      } else if (avaliacao.urgencia === 'critica' || avaliacao.urgencia === 'alta') {
        tipo = 'urgente';
      } else {
        tipo = 'lembrete';
      }

      const { titulo, mensagem } = formatarMensagemNotificacao(avaliacao, tipo);

      return {
        id: `notif-${avaliacao.id}`,
        tipo,
        titulo,
        mensagem,
        avaliacao,
        lida: false,
        criadaEm: new Date()
      };
    });

    setNotificacoes(novasNotificacoes);
  }, [avaliacoesPendentes]);

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);
  const notificacoesExibidas = mostrarTodas ? notificacoes : notificacoesNaoLidas.slice(0, 5);

  const handleMarcarComoLida = (notificacaoId: string) => {
    setNotificacoes(prev => 
      prev.map(n => 
        n.id === notificacaoId ? { ...n, lida: true } : n
      )
    );
    
    const notificacao = notificacoes.find(n => n.id === notificacaoId);
    if (notificacao && onMarcarComoLida) {
      onMarcarComoLida(notificacao.avaliacao.id);
    }
  };

  const handleAvaliacaoClick = (avaliacaoId: string) => {
    if (onAvaliacaoClick) {
      onAvaliacaoClick(avaliacaoId);
    }
  };

  const getIconeUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'critica':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'alta':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'media':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'critica':
        return 'destructive';
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificações de Avaliações</CardTitle>
            {notificacoesNaoLidas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notificacoesNaoLidas.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMostrarTodas(!mostrarTodas)}
          >
            {mostrarTodas ? 'Mostrar Menos' : 'Ver Todas'}
          </Button>
        </div>
        <CardDescription>
          Acompanhe suas avaliações pendentes e prazos
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{estatisticas.criticas}</div>
            <div className="text-sm text-red-600">Críticas</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{estatisticas.altas}</div>
            <div className="text-sm text-orange-600">Altas</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.vencidas}</div>
            <div className="text-sm text-yellow-600">Vencidas</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.totalPendentes}</div>
            <div className="text-sm text-blue-600">Total</div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Lista de Notificações */}
        {notificacoesExibidas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">Nenhuma notificação pendente</p>
            <p className="text-sm">Todas as suas avaliações estão em dia!</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {notificacoesExibidas.map((notificacao) => (
                <Alert
                  key={notificacao.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    notificacao.lida ? 'opacity-60' : ''
                  }`}
                  variant={notificacao.tipo === 'vencida' ? 'destructive' : 'default'}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3 flex-1">
                      {getIconeUrgencia(notificacao.avaliacao.urgencia)}
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          {notificacao.titulo}
                          <Badge variant={getCorUrgencia(notificacao.avaliacao.urgencia)}>
                            {notificacao.avaliacao.urgencia}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {notificacao.mensagem}
                        </AlertDescription>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Avaliado: {notificacao.avaliacao.avaliado.nome}</span>
                          <span>Período: {notificacao.avaliacao.periodo.nome}</span>
                          <span>
                            Prazo: {format(notificacao.avaliacao.dataLimite, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAvaliacaoClick(notificacao.avaliacao.id);
                              }}
                            >
                              Avaliar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ir para a avaliação</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {!notificacao.lida && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarcarComoLida(notificacao.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Marcar como lida</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Rodapé com informações adicionais */}
        {notificacoes.length > 5 && !mostrarTodas && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setMostrarTodas(true)}
            >
              Ver mais {notificacoes.length - 5} notificações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificacoesAvaliacoes;