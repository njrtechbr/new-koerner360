import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PreferenciasNotificacaoService } from '@/lib/services/preferencias-notificacao';
import { PreferenciasNotificacaoInput } from '@/lib/types/preferencias-notificacao';
import { z } from 'zod';

// Schema de validação para atualização de preferências
const preferenciaSchema = z.object({
  notificacoesAtivas: z.boolean().optional(),
  emailAtivo: z.boolean().optional(),
  diasAntecedenciaLembrete: z.number().min(0).max(30).optional(),
  horarioEnvio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  incluirFinsDeSemanaSemana: z.boolean().optional(),
  incluirFeriados: z.boolean().optional(),
  tiposNotificacao: z.object({
    avaliacaoPendente: z.boolean().optional(),
    avaliacaoVencida: z.boolean().optional(),
    avaliacaoProximaVencimento: z.boolean().optional(),
    novaAvaliacaoRecebida: z.boolean().optional(),
    avaliacaoCompletada: z.boolean().optional(),
    lembretePersonalizado: z.boolean().optional(),
  }).optional(),
  urgenciaMinima: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional(),
  frequenciaLembretes: z.object({
    avaliacaoPendente: z.enum(['DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'NUNCA']).optional(),
    avaliacaoVencida: z.enum(['DIARIO', 'SEMANAL', 'NUNCA']).optional(),
  }).optional(),
  incluirDetalhesAvaliacao: z.boolean().optional(),
  incluirLinkDireto: z.boolean().optional(),
  incluirResumoEstatisticas: z.boolean().optional(),
  formatoEmail: z.enum(['TEXTO', 'HTML']).optional(),
  idiomaNotificacao: z.enum(['PT_BR', 'EN', 'ES']).optional(),
  pausarNotificacoes: z.object({
    ativo: z.boolean().optional(),
    dataInicio: z.string().datetime().optional(),
    dataFim: z.string().datetime().optional(),
    motivo: z.string().optional(),
  }).optional(),
  filtros: z.object({
    apenasMinhasAvaliacoes: z.boolean().optional(),
    apenasAvaliacoesQueEuAvalio: z.boolean().optional(),
    departamentosEspecificos: z.array(z.string()).optional(),
    cargosEspecificos: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * GET /api/preferencias-notificacao
 * Busca as preferências de notificação do usuário autenticado
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

    const preferencias = await PreferenciasNotificacaoService.buscarPorUsuario(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: preferencias,
    });
  } catch (error) {
    console.error('Erro ao buscar preferências de notificação:', error);
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
 * PUT /api/preferencias-notificacao
 * Atualiza as preferências de notificação do usuário autenticado
 */
export async function PUT(request: NextRequest) {
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
    const validationResult = preferenciaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const dados = validationResult.data as PreferenciasNotificacaoInput;
    
    // Converte strings de data para Date objects se necessário
    if (dados.pausarNotificacoes) {
      if (dados.pausarNotificacoes.dataInicio) {
        dados.pausarNotificacoes.dataInicio = new Date(dados.pausarNotificacoes.dataInicio);
      }
      if (dados.pausarNotificacoes.dataFim) {
        dados.pausarNotificacoes.dataFim = new Date(dados.pausarNotificacoes.dataFim);
      }
    }

    const preferenciasAtualizadas = await PreferenciasNotificacaoService.atualizar(
      session.user.id,
      dados
    );

    return NextResponse.json({
      success: true,
      data: preferenciasAtualizadas,
      message: 'Preferências atualizadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências de notificação:', error);
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
 * DELETE /api/preferencias-notificacao
 * Reseta as preferências para os valores padrão
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

    const preferenciasResetadas = await PreferenciasNotificacaoService.resetarParaDefault(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: preferenciasResetadas,
      message: 'Preferências resetadas para os valores padrão',
    });
  } catch (error) {
    console.error('Erro ao resetar preferências de notificação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}