import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gerarComparativoTemporal, FiltrosMetricas } from '@/lib/utils/metricas-avaliacoes';
import { z } from 'zod';

// Schema de validação para os filtros e parâmetros
const comparativoSchema = z.object({
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
  periodos: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    dataInicio: z.string().transform(str => new Date(str)),
    dataFim: z.string().transform(str => new Date(str))
  })).min(2, 'É necessário pelo menos 2 períodos para comparação')
});

/**
 * POST /api/avaliacoes/metricas/comparativo
 * Gera comparativo temporal entre diferentes períodos
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
    const validacao = comparativoSchema.safeParse(body);
    
    if (!validacao.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validacao.error.errors
        },
        { status: 400 }
      );
    }

    const { filtros = {}, periodos } = validacao.data;

    // Validar se os períodos não se sobrepõem
    for (let i = 0; i < periodos.length - 1; i++) {
      for (let j = i + 1; j < periodos.length; j++) {
        const periodo1 = periodos[i];
        const periodo2 = periodos[j];
        
        // Verificar sobreposição
        if (
          (periodo1.dataInicio <= periodo2.dataFim && periodo1.dataFim >= periodo2.dataInicio) ||
          (periodo2.dataInicio <= periodo1.dataFim && periodo2.dataFim >= periodo1.dataInicio)
        ) {
          return NextResponse.json(
            { 
              error: 'Períodos não podem se sobrepor',
              details: `Período '${periodo1.nome}' se sobrepõe com '${periodo2.nome}'`
            },
            { status: 400 }
          );
        }
      }
    }

    // Gerar comparativo temporal
    const comparativo = await gerarComparativoTemporal(periodos, filtros);

    return NextResponse.json({
      success: true,
      data: comparativo,
      message: `Comparativo temporal entre ${periodos.length} períodos gerado com sucesso`,
      meta: {
        totalPeriodos: periodos.length,
        periodos: periodos.map(p => ({
          id: p.id,
          nome: p.nome,
          dataInicio: p.dataInicio.toISOString(),
          dataFim: p.dataFim.toISOString()
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao gerar comparativo temporal:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível gerar o comparativo temporal'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/avaliacoes/metricas/comparativo
 * Busca comparativo temporal com parâmetros de query (versão simplificada)
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
    const periodo1Id = searchParams.get('periodo1');
    const periodo2Id = searchParams.get('periodo2');

    if (!periodo1Id || !periodo2Id) {
      return NextResponse.json(
        { error: 'É necessário informar pelo menos 2 períodos (periodo1 e periodo2)' },
        { status: 400 }
      );
    }

    if (periodo1Id === periodo2Id) {
      return NextResponse.json(
        { error: 'Os períodos devem ser diferentes' },
        { status: 400 }
      );
    }

    // Buscar informações dos períodos no banco de dados
    // Nota: Aqui seria necessário implementar a busca real dos períodos
    // Por enquanto, retornamos um erro informativo
    return NextResponse.json(
      { 
        error: 'Funcionalidade não implementada',
        message: 'Use o método POST com os dados completos dos períodos'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Erro ao buscar comparativo temporal:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar o comparativo temporal'
      },
      { status: 500 }
    );
  }
}