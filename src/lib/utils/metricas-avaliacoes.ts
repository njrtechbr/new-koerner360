import { PrismaClient } from '@/generated/prisma';
import { StatusAvaliacao, StatusPeriodo } from '@/generated/prisma';

const prisma = new PrismaClient();

// Tipos para as métricas calculadas
export interface MetricasAtendente {
  atendenteId: string;
  nomeAtendente: string;
  setor: string;
  departamento?: string;
  totalAvaliacoes: number;
  media: number;
  mediana: number;
  desvioPadrao: number;
  notaMinima: number;
  notaMaxima: number;
  distribuicaoNotas: DistribuicaoNotas;
}

export interface DistribuicaoNotas {
  nota1: number;
  nota2: number;
  nota3: number;
  nota4: number;
  nota5: number;
}

export interface MetricasPeriodo {
  periodoId: string;
  nomePeriodo: string;
  dataInicio: Date;
  dataFim: Date;
  totalAvaliacoes: number;
  mediaGeral: number;
  medianaGeral: number;
  desvioPadraoGeral: number;
  distribuicaoGeral: DistribuicaoNotas;
  metricasPorAtendente: MetricasAtendente[];
}

export interface ComparativoTemporal {
  periodoId: string;
  nomePeriodo: string;
  dataInicio: Date;
  dataFim: Date;
  mediaGeral: number;
  totalAvaliacoes: number;
}

export interface FiltrosMetricas {
  periodoIds?: string[];
  atendenteIds?: string[];
  setores?: string[];
  departamentos?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  notaMinima?: number;
  notaMaxima?: number;
}

/**
 * Calcula a média de um array de números
 */
export function calcularMedia(valores: number[]): number {
  if (valores.length === 0) return 0;
  const soma = valores.reduce((acc, valor) => acc + valor, 0);
  return Number((soma / valores.length).toFixed(2));
}

/**
 * Calcula a mediana de um array de números
 */
export function calcularMediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const valoresOrdenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(valoresOrdenados.length / 2);
  
  if (valoresOrdenados.length % 2 === 0) {
    return Number(((valoresOrdenados[meio - 1] + valoresOrdenados[meio]) / 2).toFixed(2));
  } else {
    return valoresOrdenados[meio];
  }
}

/**
 * Calcula o desvio padrão de um array de números
 */
export function calcularDesvioPadrao(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const media = calcularMedia(valores);
  const variancia = valores.reduce((acc, valor) => {
    return acc + Math.pow(valor - media, 2);
  }, 0) / valores.length;
  
  return Number(Math.sqrt(variancia).toFixed(2));
}

/**
 * Calcula a distribuição de notas (1-5)
 */
export function calcularDistribuicaoNotas(notas: number[]): DistribuicaoNotas {
  const distribuicao: DistribuicaoNotas = {
    nota1: 0,
    nota2: 0,
    nota3: 0,
    nota4: 0,
    nota5: 0
  };
  
  notas.forEach(nota => {
    switch (nota) {
      case 1:
        distribuicao.nota1++;
        break;
      case 2:
        distribuicao.nota2++;
        break;
      case 3:
        distribuicao.nota3++;
        break;
      case 4:
        distribuicao.nota4++;
        break;
      case 5:
        distribuicao.nota5++;
        break;
    }
  });
  
  return distribuicao;
}

/**
 * Busca avaliações com filtros aplicados
 */
export async function buscarAvaliacoesComFiltros(filtros: FiltrosMetricas = {}) {
  const where: any = {
    status: StatusAvaliacao.CONCLUIDA
  };
  
  // Filtros por período
  if (filtros.periodoIds && filtros.periodoIds.length > 0) {
    where.periodoId = {
      in: filtros.periodoIds
    };
  }
  
  // Filtros por atendente
  if (filtros.atendenteIds && filtros.atendenteIds.length > 0) {
    where.avaliadoId = {
      in: filtros.atendenteIds
    };
  }
  
  // Filtros por setor/departamento
  if (filtros.setores && filtros.setores.length > 0) {
    where.avaliado = {
      setor: {
        in: filtros.setores
      }
    };
  }
  
  if (filtros.departamentos && filtros.departamentos.length > 0) {
    where.avaliado = {
      ...where.avaliado,
      departamento: {
        in: filtros.departamentos
      }
    };
  }
  
  // Filtros por data
  if (filtros.dataInicio || filtros.dataFim) {
    where.dataAvaliacao = {};
    if (filtros.dataInicio) {
      where.dataAvaliacao.gte = filtros.dataInicio;
    }
    if (filtros.dataFim) {
      where.dataAvaliacao.lte = filtros.dataFim;
    }
  }
  
  // Filtros por nota
  if (filtros.notaMinima !== undefined || filtros.notaMaxima !== undefined) {
    where.nota = {};
    if (filtros.notaMinima !== undefined) {
      where.nota.gte = filtros.notaMinima;
    }
    if (filtros.notaMaxima !== undefined) {
      where.nota.lte = filtros.notaMaxima;
    }
  }
  
  return await prisma.avaliacao.findMany({
    where,
    include: {
      avaliado: {
        include: {
          usuario: true
        }
      },
      periodo: true,
      avaliador: true
    },
    orderBy: {
      dataAvaliacao: 'desc'
    }
  });
}

/**
 * Calcula métricas para um atendente específico
 */
export async function calcularMetricasAtendente(
  atendenteId: string,
  filtros: FiltrosMetricas = {}
): Promise<MetricasAtendente | null> {
  const avaliacoes = await buscarAvaliacoesComFiltros({
    ...filtros,
    atendenteIds: [atendenteId]
  });
  
  if (avaliacoes.length === 0) return null;
  
  const notas = avaliacoes.map(av => av.nota);
  const atendente = avaliacoes[0].avaliado;
  
  return {
    atendenteId,
    nomeAtendente: atendente.usuario.nome,
    setor: atendente.setor,
    departamento: atendente.departamento || undefined,
    totalAvaliacoes: avaliacoes.length,
    media: calcularMedia(notas),
    mediana: calcularMediana(notas),
    desvioPadrao: calcularDesvioPadrao(notas),
    notaMinima: Math.min(...notas),
    notaMaxima: Math.max(...notas),
    distribuicaoNotas: calcularDistribuicaoNotas(notas)
  };
}

/**
 * Calcula métricas para um período específico
 */
export async function calcularMetricasPeriodo(
  periodoId: string,
  filtros: FiltrosMetricas = {}
): Promise<MetricasPeriodo | null> {
  const periodo = await prisma.periodoAvaliacao.findUnique({
    where: { id: periodoId }
  });
  
  if (!periodo) return null;
  
  const avaliacoes = await buscarAvaliacoesComFiltros({
    ...filtros,
    periodoIds: [periodoId]
  });
  
  if (avaliacoes.length === 0) {
    return {
      periodoId,
      nomePeriodo: periodo.nome,
      dataInicio: periodo.dataInicio,
      dataFim: periodo.dataFim,
      totalAvaliacoes: 0,
      mediaGeral: 0,
      medianaGeral: 0,
      desvioPadraoGeral: 0,
      distribuicaoGeral: {
        nota1: 0,
        nota2: 0,
        nota3: 0,
        nota4: 0,
        nota5: 0
      },
      metricasPorAtendente: []
    };
  }
  
  const notasGerais = avaliacoes.map(av => av.nota);
  
  // Agrupar avaliações por atendente
  const avaliacoesPorAtendente = avaliacoes.reduce((acc, avaliacao) => {
    const atendenteId = avaliacao.avaliadoId;
    if (!acc[atendenteId]) {
      acc[atendenteId] = [];
    }
    acc[atendenteId].push(avaliacao);
    return acc;
  }, {} as Record<string, typeof avaliacoes>);
  
  // Calcular métricas por atendente
  const metricasPorAtendente: MetricasAtendente[] = [];
  
  for (const [atendenteId, avaliacoesAtendente] of Object.entries(avaliacoesPorAtendente)) {
    const notas = avaliacoesAtendente.map(av => av.nota);
    const atendente = avaliacoesAtendente[0].avaliado;
    
    metricasPorAtendente.push({
      atendenteId,
      nomeAtendente: atendente.usuario.nome,
      setor: atendente.setor,
      departamento: atendente.departamento || undefined,
      totalAvaliacoes: avaliacoesAtendente.length,
      media: calcularMedia(notas),
      mediana: calcularMediana(notas),
      desvioPadrao: calcularDesvioPadrao(notas),
      notaMinima: Math.min(...notas),
      notaMaxima: Math.max(...notas),
      distribuicaoNotas: calcularDistribuicaoNotas(notas)
    });
  }
  
  return {
    periodoId,
    nomePeriodo: periodo.nome,
    dataInicio: periodo.dataInicio,
    dataFim: periodo.dataFim,
    totalAvaliacoes: avaliacoes.length,
    mediaGeral: calcularMedia(notasGerais),
    medianaGeral: calcularMediana(notasGerais),
    desvioPadraoGeral: calcularDesvioPadrao(notasGerais),
    distribuicaoGeral: calcularDistribuicaoNotas(notasGerais),
    metricasPorAtendente: metricasPorAtendente.sort((a, b) => b.media - a.media)
  };
}

/**
 * Gera comparativo temporal entre períodos
 */
export async function gerarComparativoTemporal(
  filtros: FiltrosMetricas = {}
): Promise<ComparativoTemporal[]> {
  const periodos = await prisma.periodoAvaliacao.findMany({
    where: {
      status: {
        in: [StatusPeriodo.ATIVO, StatusPeriodo.FINALIZADO]
      },
      ...(filtros.periodoIds && {
        id: {
          in: filtros.periodoIds
        }
      })
    },
    orderBy: {
      dataInicio: 'asc'
    }
  });
  
  const comparativo: ComparativoTemporal[] = [];
  
  for (const periodo of periodos) {
    const avaliacoes = await buscarAvaliacoesComFiltros({
      ...filtros,
      periodoIds: [periodo.id]
    });
    
    const notas = avaliacoes.map(av => av.nota);
    
    comparativo.push({
      periodoId: periodo.id,
      nomePeriodo: periodo.nome,
      dataInicio: periodo.dataInicio,
      dataFim: periodo.dataFim,
      mediaGeral: calcularMedia(notas),
      totalAvaliacoes: avaliacoes.length
    });
  }
  
  return comparativo;
}

/**
 * Busca métricas consolidadas com filtros
 */
export async function buscarMetricasConsolidadas(
  filtros: FiltrosMetricas = {}
) {
  const avaliacoes = await buscarAvaliacoesComFiltros(filtros);
  
  if (avaliacoes.length === 0) {
    return {
      totalAvaliacoes: 0,
      mediaGeral: 0,
      medianaGeral: 0,
      desvioPadraoGeral: 0,
      distribuicaoGeral: {
        nota1: 0,
        nota2: 0,
        nota3: 0,
        nota4: 0,
        nota5: 0
      },
      atendentesAvaliados: 0,
      periodosAtivos: 0
    };
  }
  
  const notas = avaliacoes.map(av => av.nota);
  const atendentesUnicos = new Set(avaliacoes.map(av => av.avaliadoId));
  const periodosUnicos = new Set(avaliacoes.map(av => av.periodoId));
  
  return {
    totalAvaliacoes: avaliacoes.length,
    mediaGeral: calcularMedia(notas),
    medianaGeral: calcularMediana(notas),
    desvioPadraoGeral: calcularDesvioPadrao(notas),
    distribuicaoGeral: calcularDistribuicaoNotas(notas),
    atendentesAvaliados: atendentesUnicos.size,
    periodosAtivos: periodosUnicos.size
  };
}

/**
 * Busca ranking de atendentes por média de avaliações
 */
export async function buscarRankingAtendentes(
  filtros: FiltrosMetricas = {},
  limite: number = 10
): Promise<MetricasAtendente[]> {
  const avaliacoes = await buscarAvaliacoesComFiltros(filtros);
  
  // Agrupar por atendente
  const avaliacoesPorAtendente = avaliacoes.reduce((acc, avaliacao) => {
    const atendenteId = avaliacao.avaliadoId;
    if (!acc[atendenteId]) {
      acc[atendenteId] = [];
    }
    acc[atendenteId].push(avaliacao);
    return acc;
  }, {} as Record<string, typeof avaliacoes>);
  
  const ranking: MetricasAtendente[] = [];
  
  for (const [atendenteId, avaliacoesAtendente] of Object.entries(avaliacoesPorAtendente)) {
    const notas = avaliacoesAtendente.map(av => av.nota);
    const atendente = avaliacoesAtendente[0].avaliado;
    
    ranking.push({
      atendenteId,
      nomeAtendente: atendente.usuario.nome,
      setor: atendente.setor,
      departamento: atendente.departamento || undefined,
      totalAvaliacoes: avaliacoesAtendente.length,
      media: calcularMedia(notas),
      mediana: calcularMediana(notas),
      desvioPadrao: calcularDesvioPadrao(notas),
      notaMinima: Math.min(...notas),
      notaMaxima: Math.max(...notas),
      distribuicaoNotas: calcularDistribuicaoNotas(notas)
    });
  }
  
  return ranking
    .sort((a, b) => b.media - a.media)
    .slice(0, limite);
}