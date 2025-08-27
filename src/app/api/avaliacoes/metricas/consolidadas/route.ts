import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buscarMetricasConsolidadas, FiltrosMetricas } from '@/lib/utils/metricas-avaliacoes';
import { z } from 'zod';

// Schema de validação para os filtros
const filtrosSchema = z.object({
  filtros: z.object({
    periodoIds: z.array(z.string()).optional(),
    atendenteIds: z.array(z.string()).optional(),
    setores: z.array(z.string()).optional(),
    departamentos: z.array(z.string()).optional(),
    dataInicio: z.string().transform(str => str ? new Date(str) : undefined).optional(),
    dataFim: z.string().transform(str => str ? new Date(str) : undefined).optional(),
    notaMinima: z.number().min(1).max(5).optional(),
    notaMaxima: z.number().min(1).max(5).optional()
  }).optional()
});

/**
 * POST /api/avaliacoes/metricas/consolidadas
 * Busca métricas consolidadas das avaliações com filtros opcionais
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
    const validacao = filtrosSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validacao.error.errors
        },
        { status: 400 }
      );
    }

    const { filtros = {} } = validacao.data;

    // Buscar métricas consolidadas
    const metricas = await buscarMetricasConsolidadas(filtros);

    return NextResponse.json({
      success: true,
      data: metricas,
      message: 'Métricas consolidadas obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar métricas consolidadas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar as métricas consolidadas'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/avaliacoes/metricas/consolidadas
 * Busca métricas consolidadas sem filtros (para compatibilidade)
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

    // Buscar métricas sem filtros
    const metricas = await buscarMetricasConsolidadas();

    return NextResponse.json({
      success: true,
      data: metricas,
      message: 'Métricas consolidadas obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar métricas consolidadas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar as métricas consolidadas'
      },
      { status: 500 }
    );
  }
}