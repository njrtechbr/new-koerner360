import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buscarRankingAtendentes, FiltrosMetricas } from '@/lib/utils/metricas-avaliacoes';
import { z } from 'zod';

// Schema de validação para os filtros e parâmetros
const rankingSchema = z.object({
  filtros: z.object({
    periodoIds: z.array(z.string()).optional(),
    atendenteIds: z.array(z.string()).optional(),
    setores: z.array(z.string()).optional(),
    departamentos: z.array(z.string()).optional(),
    dataInicio: z.string().transform(str => str ? new Date(str) : undefined).optional(),
    dataFim: z.string().transform(str => str ? new Date(str) : undefined).optional(),
    notaMinima: z.number().min(1).max(5).optional(),
    notaMaxima: z.number().min(1).max(5).optional()
  }).optional(),
  limite: z.number().min(1).max(100).optional().default(10)
});

/**
 * POST /api/avaliacoes/metricas/ranking
 * Busca ranking de atendentes por média de avaliações
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR podem acessar métricas)
    if (!['ADMIN', 'GESTOR'].includes(session.user.userType)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores e gestores podem acessar métricas.' },
        { status: 403 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();
    const validacao = rankingSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validacao.error.errors
        },
        { status: 400 }
      );
    }

    const { filtros = {}, limite } = validacao.data;

    // Buscar ranking de atendentes
    const ranking = await buscarRankingAtendentes(filtros, limite);

    return NextResponse.json({
      success: true,
      data: ranking,
      message: `Ranking de ${ranking.length} atendentes obtido com sucesso`,
      meta: {
        total: ranking.length,
        limite
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ranking de atendentes:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar o ranking de atendentes'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/avaliacoes/metricas/ranking
 * Busca ranking de atendentes com parâmetros de query
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    if (!['ADMIN', 'GESTOR'].includes(session.user.userType)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores e gestores podem acessar métricas.' },
        { status: 403 }
      );
    }

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '10');
    const periodoId = searchParams.get('periodoId');
    const setor = searchParams.get('setor');
    const departamento = searchParams.get('departamento');

    // Construir filtros
    const filtros: FiltrosMetricas = {};
    
    if (periodoId) {
      filtros.periodoIds = [periodoId];
    }
    
    if (setor) {
      filtros.setores = [setor];
    }
    
    if (departamento) {
      filtros.departamentos = [departamento];
    }

    // Validar limite
    if (limite < 1 || limite > 100) {
      return NextResponse.json(
        { error: 'Limite deve estar entre 1 e 100' },
        { status: 400 }
      );
    }

    // Buscar ranking de atendentes
    const ranking = await buscarRankingAtendentes(filtros, limite);

    return NextResponse.json({
      success: true,
      data: ranking,
      message: `Ranking de ${ranking.length} atendentes obtido com sucesso`,
      meta: {
        total: ranking.length,
        limite,
        filtros: {
          periodoId,
          setor,
          departamento
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar ranking de atendentes:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar o ranking de atendentes'
      },
      { status: 500 }
    );
  }
}