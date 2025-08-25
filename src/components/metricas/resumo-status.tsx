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
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Building,
  Briefcase,
  Star,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interface para dados de resumo
 */
interface DadosResumo {
  totalAtendentes: number;
  atendentesPorStatus: {
    ativo: number;
    inativo: number;
    pendente: number;
    suspenso: number;
  };
  atendentesPorSetor: Array<{
    setor: string;
    quantidade: number;
    porcentagem: number;
  }>;
  atendentesPorCargo: Array<{
    cargo: string;
    quantidade: number;
    porcentagem: number;
  }>;
  metricas: {
    documentosCriados: {
      total: number;
      tendencia?: {
        valor: number;
        periodo: string;
      };
    };
    avaliacoes: {
      media: number;
      total: number;
      tendencia?: {
        valor: number;
        periodo: string;
      };
    };
    alteracoes: {
      total: number;
      tendencia?: {
        valor: number;
        periodo: string;
      };
    };
  };
  desempenho: {
    excelente: number;
    bom: number;
    regular: number;
    ruim: number;
  };
  alertas?: {
    atendentesSemDocumentos: number;
    atendentesComAvaliacaoBaixa: number;
    atendentesSemAtividade: number;
  };
}

/**
 * Props do componente
 */
interface ResumoStatusProps {
  dados: DadosResumo;
  periodo?: string;
  compacto?: boolean;
  mostrarTendencias?: boolean;
  mostrarAlertas?: boolean;
  className?: string;
}

/**
 * Função para renderizar tendência
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
 * Componente para cartão de métrica
 */
function CartaoMetrica({
  titulo,
  valor,
  unidade,
  icone,
  tendencia,
  descricao,
  cor = 'blue',
}: {
  titulo: string;
  valor: number | string;
  unidade?: string;
  icone: React.ReactNode;
  tendencia?: { valor: number; periodo: string };
  descricao?: string;
  cor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const coresIcone = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={coresIcone[cor]}>{icone}</div>
              <span className="text-sm font-medium text-gray-600">
                {titulo}
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold">{valor}</span>
              {unidade && (
                <span className="text-sm text-gray-500">{unidade}</span>
              )}
            </div>
            {descricao && <p className="text-xs text-gray-500">{descricao}</p>}
            <RenderizarTendencia tendencia={tendencia} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente para distribuição por categoria
 */
function DistribuicaoCategoria({
  titulo,
  dados,
  icone,
  corPrimaria = 'blue',
}: {
  titulo: string;
  dados: Array<{
    nome?: string;
    setor?: string;
    cargo?: string;
    quantidade: number;
    porcentagem: number;
  }>;
  icone: React.ReactNode;
  corPrimaria?: string;
}) {
  const coresProgress = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {icone}
          <span>{titulo}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dados.map((item, index) => {
          const nome =
            item.nome || item.setor || item.cargo || `Item ${index + 1}`;
          return (
            <div key={nome} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{nome}</span>
                <span className="text-gray-500">
                  {item.quantidade} ({item.porcentagem.toFixed(1)}%)
                </span>
              </div>
              <Progress value={item.porcentagem} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Componente principal de resumo de status
 */
export function ResumoStatus({
  dados,
  periodo = '30 dias',
  compacto = false,
  mostrarTendencias = true,
  mostrarAlertas = true,
  className,
}: ResumoStatusProps) {
  const {
    totalAtendentes,
    atendentesPorStatus,
    atendentesPorSetor,
    atendentesPorCargo,
    metricas,
    desempenho,
    alertas,
  } = dados;

  // Calcular porcentagens de status
  const porcentagemAtivos = (atendentesPorStatus.ativo / totalAtendentes) * 100;
  const porcentagemInativos =
    (atendentesPorStatus.inativo / totalAtendentes) * 100;
  const porcentagemPendentes =
    (atendentesPorStatus.pendente / totalAtendentes) * 100;
  const porcentagemSuspensos =
    (atendentesPorStatus.suspenso / totalAtendentes) * 100;

  // Calcular total de alertas
  const totalAlertas = alertas
    ? alertas.atendentesSemDocumentos +
      alertas.atendentesComAvaliacaoBaixa +
      alertas.atendentesSemAtividade
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cabeçalho com resumo geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span>Resumo Geral de Atendentes</span>
              </CardTitle>
              <CardDescription>Período: {periodo}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalAtendentes}</div>
              <div className="text-sm text-gray-500">Total de Atendentes</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {atendentesPorStatus.ativo}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
              <div className="text-xs text-gray-500">
                {porcentagemAtivos.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-center mb-2">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {atendentesPorStatus.inativo}
              </div>
              <div className="text-sm text-gray-600">Inativos</div>
              <div className="text-xs text-gray-500">
                {porcentagemInativos.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {atendentesPorStatus.pendente}
              </div>
              <div className="text-sm text-gray-600">Pendentes</div>
              <div className="text-xs text-gray-500">
                {porcentagemPendentes.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {atendentesPorStatus.suspenso}
              </div>
              <div className="text-sm text-gray-600">Suspensos</div>
              <div className="text-xs text-gray-500">
                {porcentagemSuspensos.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CartaoMetrica
          titulo="Documentos Criados"
          valor={metricas.documentosCriados.total}
          unidade="docs"
          icone={<FileText className="h-5 w-5" />}
          tendencia={
            mostrarTendencias ? metricas.documentosCriados.tendencia : undefined
          }
          descricao="Total no período"
          cor="blue"
        />

        <CartaoMetrica
          titulo="Avaliação Média"
          valor={metricas.avaliacoes.media.toFixed(1)}
          unidade="/10"
          icone={<Star className="h-5 w-5" />}
          tendencia={
            mostrarTendencias ? metricas.avaliacoes.tendencia : undefined
          }
          descricao={`${metricas.avaliacoes.total} avaliações`}
          cor="yellow"
        />

        <CartaoMetrica
          titulo="Alterações"
          valor={metricas.alteracoes.total}
          unidade="ações"
          icone={<Activity className="h-5 w-5" />}
          tendencia={
            mostrarTendencias ? metricas.alteracoes.tendencia : undefined
          }
          descricao="Atividades registradas"
          cor="purple"
        />
      </div>

      {/* Distribuição por desempenho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Distribuição por Desempenho</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {desempenho.excelente}
              </div>
              <div className="text-sm text-gray-600">Excelente</div>
              <div className="text-xs text-gray-500">
                {((desempenho.excelente / totalAtendentes) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {desempenho.bom}
              </div>
              <div className="text-sm text-gray-600">Bom</div>
              <div className="text-xs text-gray-500">
                {((desempenho.bom / totalAtendentes) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {desempenho.regular}
              </div>
              <div className="text-sm text-gray-600">Regular</div>
              <div className="text-xs text-gray-500">
                {((desempenho.regular / totalAtendentes) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {desempenho.ruim}
              </div>
              <div className="text-sm text-gray-600">Ruim</div>
              <div className="text-xs text-gray-500">
                {((desempenho.ruim / totalAtendentes) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuições por setor e cargo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DistribuicaoCategoria
          titulo="Por Setor"
          dados={atendentesPorSetor.map(item => ({
            ...item,
            nome: item.setor,
          }))}
          icone={<Building className="h-5 w-5" />}
          corPrimaria="blue"
        />

        <DistribuicaoCategoria
          titulo="Por Cargo"
          dados={atendentesPorCargo.map(item => ({
            ...item,
            nome: item.cargo,
          }))}
          icone={<Briefcase className="h-5 w-5" />}
          corPrimaria="purple"
        />
      </div>

      {/* Alertas (se habilitado e existirem) */}
      {mostrarAlertas && alertas && totalAlertas > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas e Atenção</span>
              <Badge variant="outline" className="ml-auto">
                {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.atendentesSemDocumentos > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Atendentes sem documentos</span>
                </div>
                <Badge variant="outline">
                  {alertas.atendentesSemDocumentos}
                </Badge>
              </div>
            )}

            {alertas.atendentesComAvaliacaoBaixa > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    Atendentes com avaliação baixa
                  </span>
                </div>
                <Badge variant="outline">
                  {alertas.atendentesComAvaliacaoBaixa}
                </Badge>
              </div>
            )}

            {alertas.atendentesSemAtividade > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    Atendentes sem atividade recente
                  </span>
                </div>
                <Badge variant="outline">
                  {alertas.atendentesSemAtividade}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ResumoStatus;
