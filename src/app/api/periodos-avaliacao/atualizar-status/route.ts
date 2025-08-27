import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TipoUsuario } from '@prisma/client';
import { atualizarStatusPeriodos, atualizarStatusPeriodo } from '@/lib/utils/periodo-status-updater';
import { z } from 'zod';

// Schema para validação dos parâmetros de query
const querySchema = z.object({
  periodoId: z.string().optional(),
  forcar: z.string().transform(val => val === 'true').optional()
});

/**
 * POST /api/periodos-avaliacao/atualizar-status
 * 
 * Atualiza automaticamente o status dos períodos de avaliação baseado nas datas atuais
 * 
 * Query Parameters:
 * - periodoId (opcional): ID específico do período para atualizar
 * - forcar (opcional): Se true, força a atualização mesmo que não seja necessária
 * 
 * Permissões: ADMIN, GESTOR
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    const userType = session.user.userType as TipoUsuario;
    if (!['ADMIN', 'GESTOR'].includes(userType)) {
      return NextResponse.json(
        { erro: 'Sem permissão para atualizar status de períodos' },
        { status: 403 }
      );
    }

    // Validar query parameters
    const url = new URL(request.url);
    const queryParams = {
      periodoId: url.searchParams.get('periodoId') || undefined,
      forcar: url.searchParams.get('forcar') || undefined
    };

    const { periodoId, forcar } = querySchema.parse(queryParams);

    let resultado;

    if (periodoId) {
      // Atualizar período específico
      resultado = await atualizarStatusPeriodo(periodoId);
      
      if (!resultado.sucesso) {
        return NextResponse.json(
          { 
            erro: 'Erro ao atualizar status do período',
            detalhes: resultado.erro
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: resultado.atualizado 
          ? `Status do período atualizado de ${resultado.statusAnterior} para ${resultado.statusNovo}`
          : 'Período já está com o status correto',
        periodo: {
          id: periodoId,
          atualizado: resultado.atualizado,
          statusAnterior: resultado.statusAnterior,
          statusNovo: resultado.statusNovo || resultado.statusAtual
        }
      });
    } else {
      // Atualizar todos os períodos
      resultado = await atualizarStatusPeriodos();
      
      if (!resultado.sucesso) {
        return NextResponse.json(
          { 
            erro: 'Erro ao atualizar status dos períodos',
            detalhes: resultado.erro
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: `Atualização concluída: ${resultado.periodosAtualizados} período(s) atualizado(s)`,
        estatisticas: {
          periodosAtualizados: resultado.periodosAtualizados,
          periodosAtivados: resultado.periodosAtivados,
          periodosFinalizados: resultado.periodosFinalizados
        },
        detalhes: resultado.detalhes
      });
    }

  } catch (error) {
    console.error('Erro na atualização de status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros inválidos',
          detalhes: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/periodos-avaliacao/atualizar-status
 * 
 * Verifica quais períodos precisam de atualização de status (sem fazer alterações)
 * 
 * Permissões: ADMIN, GESTOR
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    const userType = session.user.userType as TipoUsuario;
    if (!['ADMIN', 'GESTOR'].includes(userType)) {
      return NextResponse.json(
        { erro: 'Sem permissão para verificar status de períodos' },
        { status: 403 }
      );
    }

    // Importar prisma e StatusPeriodo aqui para evitar problemas de importação
    const { prisma } = await import('@/lib/database-config');
    const { StatusPeriodo } = await import('@prisma/client');
    const { calcularStatusPeriodo } = await import('@/lib/utils/periodo-status-updater');

    const agora = new Date();

    // Buscar todos os períodos que não estão cancelados
    const periodos = await prisma.periodoAvaliacao.findMany({
      where: {
        status: {
          not: StatusPeriodo.CANCELADO
        }
      },
      select: {
        id: true,
        nome: true,
        status: true,
        dataInicio: true,
        dataFim: true
      },
      orderBy: {
        dataInicio: 'asc'
      }
    });

    // Verificar quais períodos precisam de atualização
    const periodosParaAtualizar = [];
    const periodosCorretos = [];

    for (const periodo of periodos) {
      const statusCorreto = calcularStatusPeriodo(
        periodo.dataInicio,
        periodo.dataFim,
        periodo.status
      );

      if (statusCorreto !== periodo.status) {
        periodosParaAtualizar.push({
          id: periodo.id,
          nome: periodo.nome,
          statusAtual: periodo.status,
          statusCorreto: statusCorreto,
          dataInicio: periodo.dataInicio,
          dataFim: periodo.dataFim
        });
      } else {
        periodosCorretos.push({
          id: periodo.id,
          nome: periodo.nome,
          status: periodo.status,
          dataInicio: periodo.dataInicio,
          dataFim: periodo.dataFim
        });
      }
    }

    return NextResponse.json({
      sucesso: true,
      dataVerificacao: agora,
      resumo: {
        totalPeriodos: periodos.length,
        periodosCorretos: periodosCorretos.length,
        periodosParaAtualizar: periodosParaAtualizar.length
      },
      periodosParaAtualizar,
      periodosCorretos
    });

  } catch (error) {
    console.error('Erro na verificação de status:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}