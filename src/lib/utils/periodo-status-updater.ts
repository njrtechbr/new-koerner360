import { prisma } from '@/lib/database-config';
import { StatusPeriodo } from '@prisma/client';

/**
 * Atualiza automaticamente o status dos períodos de avaliação baseado nas datas atuais
 * 
 * Regras de negócio:
 * - PLANEJADO -> ATIVO: quando a data atual >= dataInicio e <= dataFim
 * - ATIVO -> FINALIZADO: quando a data atual > dataFim
 * - Períodos CANCELADOS não são alterados
 * 
 * @returns Objeto com informações sobre as atualizações realizadas
 */
export async function atualizarStatusPeriodos() {
  const agora = new Date();
  
  try {
    // Buscar períodos que precisam de atualização de status
    const periodosParaAtualizar = await prisma.periodoAvaliacao.findMany({
      where: {
        OR: [
          {
            // PLANEJADO -> ATIVO: data atual está dentro do período
            status: StatusPeriodo.PLANEJADO,
            dataInicio: {
              lte: agora
            },
            dataFim: {
              gte: agora
            }
          },
          {
            // ATIVO -> FINALIZADO: data atual passou do fim do período
            status: StatusPeriodo.ATIVO,
            dataFim: {
              lt: agora
            }
          }
        ]
      },
      select: {
        id: true,
        nome: true,
        status: true,
        dataInicio: true,
        dataFim: true
      }
    });

    const resultados = {
      periodosAtualizados: 0,
      periodosAtivados: 0,
      periodosFinalizados: 0,
      detalhes: [] as Array<{
        id: string;
        nome: string;
        statusAnterior: StatusPeriodo;
        statusNovo: StatusPeriodo;
      }>
    };

    // Processar cada período que precisa de atualização
    for (const periodo of periodosParaAtualizar) {
      let novoStatus: StatusPeriodo;
      
      if (periodo.status === StatusPeriodo.PLANEJADO && 
          agora >= periodo.dataInicio && 
          agora <= periodo.dataFim) {
        novoStatus = StatusPeriodo.ATIVO;
        resultados.periodosAtivados++;
      } else if (periodo.status === StatusPeriodo.ATIVO && 
                 agora > periodo.dataFim) {
        novoStatus = StatusPeriodo.FINALIZADO;
        resultados.periodosFinalizados++;
      } else {
        continue; // Não precisa atualizar
      }

      // Atualizar o status no banco de dados
      await prisma.periodoAvaliacao.update({
        where: { id: periodo.id },
        data: { 
          status: novoStatus,
          atualizadoEm: agora
        }
      });

      resultados.periodosAtualizados++;
      resultados.detalhes.push({
        id: periodo.id,
        nome: periodo.nome,
        statusAnterior: periodo.status,
        statusNovo: novoStatus
      });
    }

    return {
      sucesso: true,
      ...resultados
    };

  } catch (error) {
    console.error('Erro ao atualizar status dos períodos:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      periodosAtualizados: 0,
      periodosAtivados: 0,
      periodosFinalizados: 0,
      detalhes: []
    };
  }
}

/**
 * Verifica se um período específico precisa de atualização de status
 * e o atualiza se necessário
 * 
 * @param periodoId ID do período a ser verificado
 * @returns Informações sobre a atualização realizada
 */
export async function atualizarStatusPeriodo(periodoId: string) {
  const agora = new Date();
  
  try {
    const periodo = await prisma.periodoAvaliacao.findUnique({
      where: { id: periodoId },
      select: {
        id: true,
        nome: true,
        status: true,
        dataInicio: true,
        dataFim: true
      }
    });

    if (!periodo) {
      return {
        sucesso: false,
        erro: 'Período não encontrado'
      };
    }

    // Verificar se precisa atualizar
    let novoStatus: StatusPeriodo | null = null;
    
    if (periodo.status === StatusPeriodo.PLANEJADO && 
        agora >= periodo.dataInicio && 
        agora <= periodo.dataFim) {
      novoStatus = StatusPeriodo.ATIVO;
    } else if (periodo.status === StatusPeriodo.ATIVO && 
               agora > periodo.dataFim) {
      novoStatus = StatusPeriodo.FINALIZADO;
    }

    if (!novoStatus) {
      return {
        sucesso: true,
        atualizado: false,
        statusAtual: periodo.status
      };
    }

    // Atualizar o status
    await prisma.periodoAvaliacao.update({
      where: { id: periodoId },
      data: { 
        status: novoStatus,
        atualizadoEm: agora
      }
    });

    return {
      sucesso: true,
      atualizado: true,
      statusAnterior: periodo.status,
      statusNovo: novoStatus
    };

  } catch (error) {
    console.error('Erro ao atualizar status do período:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Obtém o status atual que um período deveria ter baseado nas datas
 * (sem fazer alterações no banco de dados)
 * 
 * @param dataInicio Data de início do período
 * @param dataFim Data de fim do período
 * @param statusAtual Status atual do período
 * @returns Status que o período deveria ter
 */
export function calcularStatusPeriodo(
  dataInicio: Date,
  dataFim: Date,
  statusAtual: StatusPeriodo
): StatusPeriodo {
  const agora = new Date();
  
  // Períodos cancelados não mudam de status automaticamente
  if (statusAtual === StatusPeriodo.CANCELADO) {
    return StatusPeriodo.CANCELADO;
  }
  
  // Verificar se o período já deveria ter terminado
  if (agora > dataFim) {
    return StatusPeriodo.FINALIZADO;
  }
  
  // Verificar se o período já deveria estar ativo
  if (agora >= dataInicio && agora <= dataFim) {
    return StatusPeriodo.ATIVO;
  }
  
  // Período ainda não começou
  return StatusPeriodo.PLANEJADO;
}

/**
 * Middleware para atualização automática de status antes de operações críticas
 * Deve ser chamado antes de:
 * - Listar períodos
 * - Buscar período específico
 * - Criar/editar avaliações
 * 
 * @param periodoIds IDs específicos para atualizar (opcional)
 */
export async function middlewareAtualizacaoStatus(periodoIds?: string[]) {
  try {
    if (periodoIds && periodoIds.length > 0) {
      // Atualizar apenas períodos específicos
      const resultados = [];
      for (const id of periodoIds) {
        const resultado = await atualizarStatusPeriodo(id);
        resultados.push(resultado);
      }
      return resultados;
    } else {
      // Atualizar todos os períodos que precisam
      return await atualizarStatusPeriodos();
    }
  } catch (error) {
    console.error('Erro no middleware de atualização de status:', error);
    // Não falhar a operação principal por causa do middleware
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro no middleware'
    };
  }
}