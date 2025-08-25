'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
} from 'lucide-react';
import { StatusConexao } from '@/hooks/use-metricas-tempo-real';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Props do componente de status em tempo real
 */
export interface StatusTempoRealProps {
  status: StatusConexao;
  carregando?: boolean;
  ativo?: boolean;
  intervalo?: number;
  onForcarAtualizacao?: () => void;
  onReconectar?: () => void;
  onToggleAtivo?: (ativo: boolean) => void;
  className?: string;
  compacto?: boolean;
}

/**
 * Componente para exibir status de conexão em tempo real
 */
export function StatusTempoReal({
  status,
  carregando = false,
  ativo = true,
  intervalo = 30000,
  onForcarAtualizacao,
  onReconectar,
  onToggleAtivo,
  className = '',
  compacto = false,
}: StatusTempoRealProps) {
  // Função para obter cor do status
  const obterCorStatus = () => {
    if (!ativo) return 'secondary';
    if (carregando) return 'default';
    if (status.conectado) return 'success';
    if (status.erro) return 'destructive';
    return 'warning';
  };

  // Função para obter ícone do status
  const obterIconeStatus = () => {
    if (!ativo) return <Pause className="h-3 w-3" />;
    if (carregando) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (status.conectado) return <Wifi className="h-3 w-3" />;
    if (status.erro) return <WifiOff className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  // Função para obter texto do status
  const obterTextoStatus = () => {
    if (!ativo) return 'Pausado';
    if (carregando) return 'Atualizando...';
    if (status.conectado) return 'Conectado';
    if (status.erro) return 'Desconectado';
    return 'Aguardando...';
  };

  // Função para obter descrição detalhada
  const obterDescricaoStatus = () => {
    if (!ativo) {
      return 'Atualização automática pausada';
    }

    if (carregando) {
      return 'Buscando dados atualizados...';
    }

    if (status.conectado && status.ultimaAtualizacao) {
      const tempoDecorrido = formatDistanceToNow(status.ultimaAtualizacao, {
        addSuffix: true,
        locale: ptBR,
      });
      return `Última atualização ${tempoDecorrido}`;
    }

    if (status.erro) {
      return `Erro: ${status.erro}`;
    }

    return 'Aguardando primeira atualização';
  };

  // Função para formatar intervalo
  const formatarIntervalo = (ms: number) => {
    const segundos = Math.floor(ms / 1000);
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    return `${minutos}m`;
  };

  // Renderização compacta
  if (compacto) {
    return (
      <TooltipProvider>
        <div className={`flex items-center gap-2 ${className}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={obterCorStatus() as any}
                className="flex items-center gap-1 cursor-help"
              >
                {obterIconeStatus()}
                <span className="text-xs">{obterTextoStatus()}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">{obterTextoStatus()}</p>
                <p className="text-muted-foreground">
                  {obterDescricaoStatus()}
                </p>
                <p className="text-xs mt-1">
                  Intervalo: {formatarIntervalo(intervalo)}
                </p>
                {status.tentativasReconexao > 0 && (
                  <p className="text-xs text-yellow-600">
                    Tentativas de reconexão: {status.tentativasReconexao}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Botões de ação */}
          <div className="flex items-center gap-1">
            {onForcarAtualizacao && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onForcarAtualizacao}
                    disabled={carregando}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${carregando ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forçar atualização</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onToggleAtivo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleAtivo(!ativo)}
                    className="h-6 w-6 p-0"
                  >
                    {ativo ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{ativo ? 'Pausar' : 'Retomar'} atualização automática</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Renderização completa
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Indicador de status */}
            <div className="flex items-center gap-2">
              <div
                className={`
                w-3 h-3 rounded-full flex items-center justify-center
                ${status.conectado && ativo ? 'bg-green-500' : ''}
                ${!status.conectado && ativo ? 'bg-red-500' : ''}
                ${!ativo ? 'bg-gray-400' : ''}
                ${carregando ? 'bg-blue-500 animate-pulse' : ''}
              `}
              >
                {carregando && (
                  <RefreshCw className="h-2 w-2 text-white animate-spin" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {obterTextoStatus()}
                  </span>
                  <Badge variant={obterCorStatus() as any} className="text-xs">
                    {formatarIntervalo(intervalo)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {obterDescricaoStatus()}
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            {status.erro && onReconectar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReconectar}
                className="text-xs"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Reconectar
              </Button>
            )}

            {onForcarAtualizacao && (
              <Button
                variant="outline"
                size="sm"
                onClick={onForcarAtualizacao}
                disabled={carregando}
                className="text-xs"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${carregando ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            )}

            {onToggleAtivo && (
              <Button
                variant={ativo ? 'secondary' : 'default'}
                size="sm"
                onClick={() => onToggleAtivo(!ativo)}
                className="text-xs"
              >
                {ativo ? (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Retomar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        {(status.tentativasReconexao > 0 || status.ultimaAtualizacao) && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {status.ultimaAtualizacao && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    Última atualização:{' '}
                    {status.ultimaAtualizacao.toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              )}

              {status.tentativasReconexao > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Tentativas: {status.tentativasReconexao}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Componente de indicador simples de status
 */
export function IndicadorStatusSimples({
  conectado,
  carregando,
  ativo = true,
  className = '',
}: {
  conectado: boolean;
  carregando?: boolean;
  ativo?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <div
              className={`
              w-2 h-2 rounded-full
              ${!ativo ? 'bg-gray-400' : ''}
              ${ativo && conectado && !carregando ? 'bg-green-500' : ''}
              ${ativo && !conectado && !carregando ? 'bg-red-500' : ''}
              ${carregando ? 'bg-blue-500 animate-pulse' : ''}
            `}
            />
            <span className="text-xs text-muted-foreground">
              {!ativo
                ? 'Pausado'
                : carregando
                  ? 'Atualizando'
                  : conectado
                    ? 'Online'
                    : 'Offline'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {!ativo
              ? 'Atualização pausada'
              : carregando
                ? 'Buscando dados...'
                : conectado
                  ? 'Conectado e atualizado'
                  : 'Desconectado'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default StatusTempoReal;
