'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Clock,
  FileText,
  Users,
  Star,
  Activity,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interface para indicador individual
 */
interface Indicador {
  id: string;
  titulo: string;
  valor: number;
  meta?: number;
  unidade: string;
  tendencia?: {
    valor: number;
    periodo: string;
  };
  status: 'excelente' | 'bom' | 'regular' | 'ruim';
  descricao?: string;
  icone: React.ReactNode;
}

/**
 * Interface para dados de produtividade
 */
interface DadosProdutividade {
  avaliacoes: {
    media: number;
    total: number;
    meta?: number;
    tendencia?: {
      valor: number;
      periodo: string;
    };
  };
  documentos: {
    total: number;
    ativosNoPeriodo: number;
    meta?: number;
    tendencia?: {
      valor: number;
      periodo: string;
    };
  };
  atividade: {
    totalAlteracoes: number;
    meta?: number;
    tendencia?: {
      valor: number;
      periodo: string;
    };
  };
  eficiencia?: {
    pontuacao: number;
    ranking?: number;
    totalAtendentes?: number;
  };
  qualidade?: {
    pontuacao: number;
    meta?: number;
  };
  pontualidade?: {
    pontuacao: number;
    meta?: number;
  };
}

/**
 * Props do componente
 */
interface IndicadoresProdutividadeProps {
  dados: DadosProdutividade;
  periodo?: string;
  compacto?: boolean;
  mostrarTendencias?: boolean;
  className?: string;
}

/**
 * Função para determinar status baseado no valor e meta
 */
function determinarStatus(
  valor: number,
  meta?: number
): 'excelente' | 'bom' | 'regular' | 'ruim' {
  if (!meta) {
    if (valor >= 9) return 'excelente';
    if (valor >= 7) return 'bom';
    if (valor >= 5) return 'regular';
    return 'ruim';
  }

  const porcentagem = (valor / meta) * 100;
  if (porcentagem >= 100) return 'excelente';
  if (porcentagem >= 80) return 'bom';
  if (porcentagem >= 60) return 'regular';
  return 'ruim';
}

/**
 * Função para obter cor do status
 */
function obterCorStatus(status: string): string {
  switch (status) {
    case 'excelente':
      return 'text-green-600';
    case 'bom':
      return 'text-blue-600';
    case 'regular':
      return 'text-yellow-600';
    case 'ruim':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Função para obter cor de fundo do status
 */
function obterCorFundoStatus(status: string): string {
  switch (status) {
    case 'excelente':
      return 'bg-green-50 border-green-200';
    case 'bom':
      return 'bg-blue-50 border-blue-200';
    case 'regular':
      return 'bg-yellow-50 border-yellow-200';
    case 'ruim':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

/**
 * Componente para renderizar tendência
 */
function RenderizarTendencia({
  tendencia,
}: {
  tendencia?: { valor: number; periodo: string };
}) {
  if (!tendencia) return null;

  const { valor, periodo } = tendencia;

  if (valor > 0) {
    return (
      <div className="flex items-center text-green-600 text-sm">
        <TrendingUp className="h-3 w-3 mr-1" />
        <span>
          +{valor.toFixed(1)}% ({periodo})
        </span>
      </div>
    );
  } else if (valor < 0) {
    return (
      <div className="flex items-center text-red-600 text-sm">
        <TrendingDown className="h-3 w-3 mr-1" />
        <span>
          {valor.toFixed(1)}% ({periodo})
        </span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-500 text-sm">
        <Minus className="h-3 w-3 mr-1" />
        <span>0% ({periodo})</span>
      </div>
    );
  }
}

/**
 * Componente para cartão de indicador individual
 */
function CartaoIndicador({
  indicador,
  compacto = false,
  mostrarTendencia = true,
}: {
  indicador: Indicador;
  compacto?: boolean;
  mostrarTendencia?: boolean;
}) {
  const porcentagemMeta = indicador.meta
    ? (indicador.valor / indicador.meta) * 100
    : 0;
  const corStatus = obterCorStatus(indicador.status);
  const corFundoStatus = obterCorFundoStatus(indicador.status);

  if (compacto) {
    return (
      <div className={cn('p-4 rounded-lg border', corFundoStatus)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={corStatus}>{indicador.icone}</div>
            <span className="font-medium text-sm">{indicador.titulo}</span>
          </div>
          <Badge
            variant={
              indicador.status === 'excelente'
                ? 'default'
                : indicador.status === 'bom'
                  ? 'secondary'
                  : indicador.status === 'regular'
                    ? 'outline'
                    : 'destructive'
            }
          >
            {indicador.status}
          </Badge>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold">{indicador.valor}</span>
          <span className="text-sm text-gray-500">{indicador.unidade}</span>
          {indicador.meta && (
            <span className="text-xs text-gray-400">/ {indicador.meta}</span>
          )}
        </div>
        {indicador.meta && (
          <Progress
            value={Math.min(porcentagemMeta, 100)}
            className="mt-2 h-1"
          />
        )}
      </div>
    );
  }

  return (
    <Card className={corFundoStatus}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={corStatus}>{indicador.icone}</div>
            <CardTitle className="text-lg">{indicador.titulo}</CardTitle>
          </div>
          <Badge
            variant={
              indicador.status === 'excelente'
                ? 'default'
                : indicador.status === 'bom'
                  ? 'secondary'
                  : indicador.status === 'regular'
                    ? 'outline'
                    : 'destructive'
            }
          >
            {indicador.status}
          </Badge>
        </div>
        {indicador.descricao && (
          <CardDescription>{indicador.descricao}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold">{indicador.valor}</span>
            <span className="text-lg text-gray-500">{indicador.unidade}</span>
            {indicador.meta && (
              <span className="text-sm text-gray-400">
                / {indicador.meta} (meta)
              </span>
            )}
          </div>

          {indicador.meta && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{porcentagemMeta.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(porcentagemMeta, 100)}
                className="h-2"
              />
            </div>
          )}

          {mostrarTendencia && indicador.tendencia && (
            <RenderizarTendencia tendencia={indicador.tendencia} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente principal de indicadores de produtividade
 */
export function IndicadoresProdutividade({
  dados,
  periodo = '30 dias',
  compacto = false,
  mostrarTendencias = true,
  className,
}: IndicadoresProdutividadeProps) {
  // Preparar indicadores baseados nos dados
  const indicadores: Indicador[] = [
    {
      id: 'avaliacoes',
      titulo: 'Avaliações',
      valor: dados.avaliacoes.media,
      meta: dados.avaliacoes.meta || 8,
      unidade: '/10',
      tendencia: dados.avaliacoes.tendencia,
      status: determinarStatus(
        dados.avaliacoes.media,
        dados.avaliacoes.meta || 8
      ),
      descricao: `${dados.avaliacoes.total} avaliações no período`,
      icone: <Star className="h-5 w-5" />,
    },
    {
      id: 'documentos',
      titulo: 'Documentos',
      valor: dados.documentos.total,
      meta: dados.documentos.meta || 10,
      unidade: 'docs',
      tendencia: dados.documentos.tendencia,
      status: determinarStatus(
        dados.documentos.total,
        dados.documentos.meta || 10
      ),
      descricao: `${dados.documentos.ativosNoPeriodo} ativos no período`,
      icone: <FileText className="h-5 w-5" />,
    },
    {
      id: 'atividade',
      titulo: 'Atividade',
      valor: dados.atividade.totalAlteracoes,
      meta: dados.atividade.meta || 20,
      unidade: 'ações',
      tendencia: dados.atividade.tendencia,
      status: determinarStatus(
        dados.atividade.totalAlteracoes,
        dados.atividade.meta || 20
      ),
      descricao: 'Alterações e atualizações',
      icone: <Activity className="h-5 w-5" />,
    },
  ];

  // Adicionar indicadores opcionais se disponíveis
  if (dados.eficiencia) {
    indicadores.push({
      id: 'eficiencia',
      titulo: 'Eficiência',
      valor: dados.eficiencia.pontuacao,
      meta: 100,
      unidade: '%',
      status: determinarStatus(dados.eficiencia.pontuacao, 100),
      descricao: dados.eficiencia.ranking
        ? `Posição ${dados.eficiencia.ranking} de ${dados.eficiencia.totalAtendentes}`
        : 'Pontuação geral de eficiência',
      icone: <Target className="h-5 w-5" />,
    });
  }

  if (dados.qualidade) {
    indicadores.push({
      id: 'qualidade',
      titulo: 'Qualidade',
      valor: dados.qualidade.pontuacao,
      meta: dados.qualidade.meta || 90,
      unidade: '%',
      status: determinarStatus(
        dados.qualidade.pontuacao,
        dados.qualidade.meta || 90
      ),
      descricao: 'Índice de qualidade do trabalho',
      icone: <Award className="h-5 w-5" />,
    });
  }

  if (dados.pontualidade) {
    indicadores.push({
      id: 'pontualidade',
      titulo: 'Pontualidade',
      valor: dados.pontualidade.pontuacao,
      meta: dados.pontualidade.meta || 95,
      unidade: '%',
      status: determinarStatus(
        dados.pontualidade.pontuacao,
        dados.pontualidade.meta || 95
      ),
      descricao: 'Cumprimento de prazos',
      icone: <Clock className="h-5 w-5" />,
    });
  }

  // Calcular resumo geral
  const indicadoresExcelentes = indicadores.filter(
    i => i.status === 'excelente'
  ).length;
  const indicadoresBons = indicadores.filter(i => i.status === 'bom').length;
  const indicadoresRegulares = indicadores.filter(
    i => i.status === 'regular'
  ).length;
  const indicadoresRuins = indicadores.filter(i => i.status === 'ruim').length;

  const statusGeral =
    indicadoresExcelentes >= indicadores.length * 0.7
      ? 'excelente'
      : indicadoresExcelentes + indicadoresBons >= indicadores.length * 0.6
        ? 'bom'
        : indicadoresRuins <= indicadores.length * 0.3
          ? 'regular'
          : 'ruim';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Resumo Geral */}
      <Card className={obterCorFundoStatus(statusGeral)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Resumo de Produtividade</span>
              </CardTitle>
              <CardDescription>Período: {periodo}</CardDescription>
            </div>
            <Badge
              variant={
                statusGeral === 'excelente'
                  ? 'default'
                  : statusGeral === 'bom'
                    ? 'secondary'
                    : statusGeral === 'regular'
                      ? 'outline'
                      : 'destructive'
              }
              className="text-lg px-3 py-1"
            >
              {statusGeral.charAt(0).toUpperCase() + statusGeral.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-green-600">
                  {indicadoresExcelentes}
                </span>
              </div>
              <span className="text-sm text-gray-500">Excelentes</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-2xl font-bold text-blue-600">
                  {indicadoresBons}
                </span>
              </div>
              <span className="text-sm text-gray-500">Bons</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-1" />
                <span className="text-2xl font-bold text-yellow-600">
                  {indicadoresRegulares}
                </span>
              </div>
              <span className="text-sm text-gray-500">Regulares</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-2xl font-bold text-red-600">
                  {indicadoresRuins}
                </span>
              </div>
              <span className="text-sm text-gray-500">Ruins</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores Individuais */}
      <div
        className={cn(
          compacto
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'grid grid-cols-1 md:grid-cols-2 gap-6'
        )}
      >
        {indicadores.map(indicador => (
          <CartaoIndicador
            key={indicador.id}
            indicador={indicador}
            compacto={compacto}
            mostrarTendencia={mostrarTendencias}
          />
        ))}
      </div>
    </div>
  );
}

export default IndicadoresProdutividade;
