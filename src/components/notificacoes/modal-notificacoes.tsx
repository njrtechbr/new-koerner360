'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, User, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotificacoes } from '@/contexts/notificacoes-context';
import { formatarMensagemNotificacao } from '@/lib/utils/notificacoes-avaliacoes';
import type { AvaliacaoPendente } from '@/lib/utils/notificacoes-avaliacoes';

interface ModalNotificacoesProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ModalNotificacoes({
  trigger,
  open,
  onOpenChange,
}: ModalNotificacoesProps) {
  const {
    notificacoesPendentes,
    carregandoNotificacoes,
    marcarComoLida,
    atualizarNotificacoes,
  } = useNotificacoes();

  const [processandoLeitura, setProcessandoLeitura] = React.useState<string | null>(null);

  const handleMarcarComoLida = async (notificacaoId: string) => {
    setProcessandoLeitura(notificacaoId);
    try {
      await marcarComoLida(notificacaoId);
      await atualizarNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    } finally {
      setProcessandoLeitura(null);
    }
  };

  const getUrgenciaIcon = (urgencia: AvaliacaoPendente['urgencia']) => {
    switch (urgencia) {
      case 'alta':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'media':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'baixa':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUrgenciaBadgeVariant = (urgencia: AvaliacaoPendente['urgencia']) => {
    switch (urgencia) {
      case 'alta':
        return 'destructive' as const;
      case 'media':
        return 'secondary' as const;
      case 'baixa':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const urgenciaLabels = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative">
      <Bell className="h-4 w-4 mr-2" />
      Notificações
      {notificacoesPendentes.length > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {notificacoesPendentes.length}
        </Badge>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações de Avaliações
            {notificacoesPendentes.length > 0 && (
              <Badge variant="secondary">
                {notificacoesPendentes.length} pendente{notificacoesPendentes.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Acompanhe suas avaliações pendentes e prazos importantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {carregandoNotificacoes ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Carregando notificações...</span>
            </div>
          ) : notificacoesPendentes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma notificação pendente
              </h3>
              <p className="text-sm text-muted-foreground">
                Todas as suas avaliações estão em dia!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {notificacoesPendentes.map((notificacao) => {
                  const mensagem = formatarMensagemNotificacao(notificacao);
                  const isProcessando = processandoLeitura === notificacao.id;

                  return (
                    <Card key={notificacao.id} className="transition-all hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getUrgenciaIcon(notificacao.urgencia)}
                            <CardTitle className="text-sm font-medium">
                              {mensagem.titulo}
                            </CardTitle>
                          </div>
                          <Badge variant={getUrgenciaBadgeVariant(notificacao.urgencia)}>
                            {urgenciaLabels[notificacao.urgencia]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {mensagem.descricao}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Avaliado:</span>
                              <span className="font-medium">{notificacao.avaliado.nome}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Prazo:</span>
                              <span className="font-medium">
                                {new Date(notificacao.prazoFinal).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <Badge variant="outline" className="text-xs">
                              {notificacao.tipo}
                            </Badge>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.location.href = `/avaliacoes/${notificacao.avaliacaoId}`;
                                }}
                              >
                                Ver Avaliação
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleMarcarComoLida(notificacao.id)}
                                disabled={isProcessando}
                              >
                                {isProcessando ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Marcar como Lida
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={atualizarNotificacoes}
              disabled={carregandoNotificacoes}
            >
              {carregandoNotificacoes ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
              ) : (
                <Bell className="h-3 w-3 mr-2" />
              )}
              Atualizar
            </Button>
            
            {notificacoesPendentes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {notificacoesPendentes.length} notificação{notificacoesPendentes.length !== 1 ? 'ões' : ''} pendente{notificacoesPendentes.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}