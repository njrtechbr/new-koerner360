'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNotificacoesAvaliacoes } from '@/hooks/use-notificacoes-avaliacoes';
import { useEmailNotificacoes } from '@/hooks/use-email-notificacoes';
import { cn } from '@/lib/utils';

interface ResumoNotificacoesProps {
  className?: string;
  mostrarAcoes?: boolean;
  compacto?: boolean;
}

export function ResumoNotificacoes({
  className,
  mostrarAcoes = true,
  compacto = false,
}: ResumoNotificacoesProps) {
  const {
    notificacoes,
    estatisticas,
    carregando,
    erro,
    atualizarNotificacoes,
    marcarTodasComoLidas,
  } = useNotificacoesAvaliacoes();

  const { estatisticas: estatisticasEmail } = useEmailNotificacoes();

  // Calcular estatísticas locais
  const totalNotificacoes = notificacoes.length;
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const lidas = notificacoes.filter((n) => n.lida).length;
  const vencidas = notificacoes.filter((n) => n.tipo === 'vencida').length;
  const pendentes = notificacoes.filter((n) => n.tipo === 'pendente').length;
  const lembretes = notificacoes.filter((n) => n.tipo === 'lembrete').length;
  
  const urgenciaAlta = notificacoes.filter((n) => n.urgencia === 'alta').length;
  const urgenciaMedia = notificacoes.filter((n) => n.urgencia === 'media').length;
  const urgenciaBaixa = notificacoes.filter((n) => n.urgencia === 'baixa').length;

  const percentualLidas = totalNotificacoes > 0 ? (lidas / totalNotificacoes) * 100 : 0;
  const percentualVencidas = totalNotificacoes > 0 ? (vencidas / totalNotificacoes) * 100 : 0;

  const obterTendencia = (atual: number, anterior: number) => {
    if (atual > anterior) return { icone: TrendingUp, cor: 'text-red-600', texto: 'Aumentou' };
    if (atual < anterior) return { icone: TrendingDown, cor: 'text-green-600', texto: 'Diminuiu' };
    return { icone: Minus, cor: 'text-gray-600', texto: 'Estável' };
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await marcarTodasComoLidas();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  if (erro) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar resumo: {erro}</p>
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
    <div className={cn('space-y-4', className)}>
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className={cn('p-4', compacto && 'p-3')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalNotificacoes}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
            {estatisticas && (
              <div className="mt-2 flex items-center text-xs">
                {(() => {
                  const tendencia = obterTendencia(totalNotificacoes, estatisticas.totalAnterior || 0);
                  const Icone = tendencia.icone;
                  return (
                    <>
                      <Icone className={cn('h-3 w-3 mr-1', tendencia.cor)} />
                      <span className={tendencia.cor}>{tendencia.texto}</span>
                    </>
                  );
                })()
                }
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className={cn('p-4', compacto && 'p-3')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Não Lidas</p>
                <p className="text-2xl font-bold text-blue-600">{naoLidas}</p>
              </div>
              <EyeOff className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={totalNotificacoes > 0 ? (naoLidas / totalNotificacoes) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={cn('p-4', compacto && 'p-3')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{vencidas}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2">
              <Progress value={percentualVencidas} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={cn('p-4', compacto && 'p-3')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Leitura</p>
                <p className="text-2xl font-bold text-green-600">{percentualLidas.toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={percentualLidas} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Tipo e Urgência */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className={cn('pb-3', compacto && 'pb-2')}>
            <CardTitle className="text-lg">Por Tipo</CardTitle>
            <CardDescription>Distribuição por tipo de notificação</CardDescription>
          </CardHeader>
          <CardContent className={cn('space-y-3', compacto && 'space-y-2')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Pendentes</span>
              </div>
              <Badge variant="secondary">{pendentes}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Lembretes</span>
              </div>
              <Badge variant="secondary">{lembretes}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Vencidas</span>
              </div>
              <Badge variant="destructive">{vencidas}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={cn('pb-3', compacto && 'pb-2')}>
            <CardTitle className="text-lg">Por Urgência</CardTitle>
            <CardDescription>Distribuição por nível de urgência</CardDescription>
          </CardHeader>
          <CardContent className={cn('space-y-3', compacto && 'space-y-2')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-600 rounded-full" />
                <span className="text-sm">Alta</span>
              </div>
              <Badge variant="destructive">{urgenciaAlta}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-yellow-600 rounded-full" />
                <span className="text-sm">Média</span>
              </div>
              <Badge variant="default">{urgenciaMedia}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-600 rounded-full" />
                <span className="text-sm">Baixa</span>
              </div>
              <Badge variant="secondary">{urgenciaBaixa}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de E-mail */}
      {estatisticasEmail && (
        <Card>
          <CardHeader className={cn('pb-3', compacto && 'pb-2')}>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-mails de Notificação
            </CardTitle>
            <CardDescription>Estatísticas de envio de e-mails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estatisticasEmail.totalEnviados}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticasEmail.sucessos}</p>
                <p className="text-sm text-muted-foreground">Sucessos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estatisticasEmail.falhas}</p>
                <p className="text-sm text-muted-foreground">Falhas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{estatisticasEmail.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
            {estatisticasEmail.totalEnviados > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de Sucesso</span>
                  <span>{((estatisticasEmail.sucessos / estatisticasEmail.totalEnviados) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(estatisticasEmail.sucessos / estatisticasEmail.totalEnviados) * 100} 
                  className="h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {mostrarAcoes && (
        <Card>
          <CardContent className={cn('p-4', compacto && 'p-3')}>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={atualizarNotificacoes}
                disabled={carregando}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', carregando && 'animate-spin')} />
                Atualizar
              </Button>
              
              {naoLidas > 0 && (
                <Button
                  onClick={handleMarcarTodasLidas}
                  variant="default"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Marcar Todas como Lidas ({naoLidas})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ResumoNotificacoes;