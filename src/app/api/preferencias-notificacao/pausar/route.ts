import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PreferenciasNotificacaoService } from '@/lib/services/preferencias-notificacao';
import { z } from 'zod';

// Schema de validação para pausar notificações
const pausarSchema = z.object({
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime(),
  motivo: z.string().optional(),
});

/**
 * POST /api/preferencias-notificacao/pausar
 * Pausa as notificações por um período específico
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validação dos dados
    const validationResult = pausarSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { dataInicio, dataFim, motivo } = validationResult.data;
    
    // Converte strings para Date
    const inicio = dataInicio ? new Date(dataInicio) : new Date();
    const fim = new Date(dataFim);
    
    // Validação de datas
    if (fim <= inicio) {
      return NextResponse.json(
        { error: 'Data de fim deve ser posterior à data de início' },
        { status: 400 }
      );
    }

    const preferenciasAtualizadas = await PreferenciasNotificacaoService.pausarNotificacoes(
      session.user.id,
      inicio,
      fim,
      motivo
    );

    return NextResponse.json({
      success: true,
      data: preferenciasAtualizadas,
      message: `Notificações pausadas até ${fim.toLocaleDateString('pt-BR')}`,
    });
  } catch (error) {
    console.error('Erro ao pausar notificações:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/preferencias-notificacao/pausar
 * Retoma as notificações (remove pausa)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const preferenciasAtualizadas = await PreferenciasNotificacaoService.retomarNotificacoes(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: preferenciasAtualizadas,
      message: 'Notificações retomadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao retomar notificações:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/preferencias-notificacao/pausar
 * Verifica se as notificações estão pausadas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const pausadas = await PreferenciasNotificacaoService.verificarNotificacoesPausadas(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: { pausadas },
    });
  } catch (error) {
    console.error('Erro ao verificar status de pausa:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}