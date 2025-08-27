import { prisma } from '@/lib/prisma';
import { addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

// Tipos para notificações
export interface AvaliacaoPendente {
  id: string;
  periodoId: string;
  periodo: {
    id: string;
    nome: string;
    dataInicio: Date;
    dataFim: Date;
    status: string;
  };
  avaliadorId: string;
  avaliador: {
    id: string;
    nome: string;
    email: string;
  };
  avaliadoId: string;
  avaliado: {
    id: string;
    nome: string;
    setor?: string;
    departamento?: string;
  };
  status: string;
  dataLimite: Date;
  diasRestantes: number;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  criadaEm: Date;
}

export interface NotificacaoConfig {
  id: string;
  usuarioId: string;
  notificacoesEmail: boolean;
  notificacoesInterface: boolean;
  diasAntecedencia: number;
  horarioEnvio: string; // HH:mm
  frequenciaLembretes: 'diario' | 'semanal' | 'personalizado';
  ativo: boolean;
}

export interface EstatisticasNotificacoes {
  totalPendentes: number;
  criticas: number;
  altas: number;
  medias: number;
  baixas: number;
  vencidas: number;
  proximasVencer: number; // próximas 3 dias
}

/**
 * Calcula a urgência baseada nos dias restantes
 */
export function calcularUrgencia(diasRestantes: number): 'baixa' | 'media' | 'alta' | 'critica' {
  if (diasRestantes < 0) return 'critica'; // Vencida
  if (diasRestantes <= 1) return 'critica';
  if (diasRestantes <= 3) return 'alta';
  if (diasRestantes <= 7) return 'media';
  return 'baixa';
}

/**
 * Busca todas as avaliações pendentes de um usuário específico
 */
export async function buscarAvaliacoesPendentesUsuario(
  usuarioId: string
): Promise<AvaliacaoPendente[]> {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        avaliadorId: usuarioId,
        status: 'PENDENTE'
      },
      include: {
        periodo: true,
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nome: true,
            setor: true,
            departamento: true
          }
        }
      },
      orderBy: {
        periodo: {
          dataFim: 'asc'
        }
      }
    });

    return avaliacoes.map(avaliacao => {
      const dataLimite = avaliacao.periodo.dataFim;
      const diasRestantes = differenceInDays(dataLimite, new Date());
      const urgencia = calcularUrgencia(diasRestantes);

      return {
        id: avaliacao.id,
        periodoId: avaliacao.periodoId,
        periodo: {
          id: avaliacao.periodo.id,
          nome: avaliacao.periodo.nome,
          dataInicio: avaliacao.periodo.dataInicio,
          dataFim: avaliacao.periodo.dataFim,
          status: avaliacao.periodo.status
        },
        avaliadorId: avaliacao.avaliadorId,
        avaliador: avaliacao.avaliador,
        avaliadoId: avaliacao.avaliadoId,
        avaliado: avaliacao.avaliado,
        status: avaliacao.status,
        dataLimite,
        diasRestantes,
        urgencia,
        criadaEm: avaliacao.criadaEm
      };
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações pendentes do usuário:', error);
    throw new Error('Não foi possível buscar as avaliações pendentes');
  }
}

/**
 * Busca todas as avaliações pendentes do sistema
 */
export async function buscarTodasAvaliacoesPendentes(): Promise<AvaliacaoPendente[]> {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        status: 'PENDENTE'
      },
      include: {
        periodo: true,
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nome: true,
            setor: true,
            departamento: true
          }
        }
      },
      orderBy: [
        {
          periodo: {
            dataFim: 'asc'
          }
        },
        {
          avaliador: {
            nome: 'asc'
          }
        }
      ]
    });

    return avaliacoes.map(avaliacao => {
      const dataLimite = avaliacao.periodo.dataFim;
      const diasRestantes = differenceInDays(dataLimite, new Date());
      const urgencia = calcularUrgencia(diasRestantes);

      return {
        id: avaliacao.id,
        periodoId: avaliacao.periodoId,
        periodo: {
          id: avaliacao.periodo.id,
          nome: avaliacao.periodo.nome,
          dataInicio: avaliacao.periodo.dataInicio,
          dataFim: avaliacao.periodo.dataFim,
          status: avaliacao.periodo.status
        },
        avaliadorId: avaliacao.avaliadorId,
        avaliador: avaliacao.avaliador,
        avaliadoId: avaliacao.avaliadoId,
        avaliado: avaliacao.avaliado,
        status: avaliacao.status,
        dataLimite,
        diasRestantes,
        urgencia,
        criadaEm: avaliacao.criadaEm
      };
    });
  } catch (error) {
    console.error('Erro ao buscar todas as avaliações pendentes:', error);
    throw new Error('Não foi possível buscar as avaliações pendentes');
  }
}

/**
 * Busca avaliações que precisam de notificação (próximas do vencimento)
 */
export async function buscarAvaliacoesParaNotificacao(
  diasAntecedencia = 3
): Promise<AvaliacaoPendente[]> {
  try {
    const dataLimite = addDays(new Date(), diasAntecedencia);
    
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        status: 'PENDENTE',
        periodo: {
          dataFim: {
            lte: dataLimite
          }
        }
      },
      include: {
        periodo: true,
        avaliador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        avaliado: {
          select: {
            id: true,
            nome: true,
            setor: true,
            departamento: true
          }
        }
      },
      orderBy: {
        periodo: {
          dataFim: 'asc'
        }
      }
    });

    return avaliacoes.map(avaliacao => {
      const dataLimite = avaliacao.periodo.dataFim;
      const diasRestantes = differenceInDays(dataLimite, new Date());
      const urgencia = calcularUrgencia(diasRestantes);

      return {
        id: avaliacao.id,
        periodoId: avaliacao.periodoId,
        periodo: {
          id: avaliacao.periodo.id,
          nome: avaliacao.periodo.nome,
          dataInicio: avaliacao.periodo.dataInicio,
          dataFim: avaliacao.periodo.dataFim,
          status: avaliacao.periodo.status
        },
        avaliadorId: avaliacao.avaliadorId,
        avaliador: avaliacao.avaliador,
        avaliadoId: avaliacao.avaliadoId,
        avaliado: avaliacao.avaliado,
        status: avaliacao.status,
        dataLimite,
        diasRestantes,
        urgencia,
        criadaEm: avaliacao.criadaEm
      };
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações para notificação:', error);
    throw new Error('Não foi possível buscar as avaliações para notificação');
  }
}

/**
 * Gera estatísticas de notificações para um usuário
 */
export async function gerarEstatisticasNotificacoes(
  usuarioId?: string
): Promise<EstatisticasNotificacoes> {
  try {
    const avaliacoes = usuarioId 
      ? await buscarAvaliacoesPendentesUsuario(usuarioId)
      : await buscarTodasAvaliacoesPendentes();

    const stats: EstatisticasNotificacoes = {
      totalPendentes: avaliacoes.length,
      criticas: 0,
      altas: 0,
      medias: 0,
      baixas: 0,
      vencidas: 0,
      proximasVencer: 0
    };

    avaliacoes.forEach(avaliacao => {
      // Contar por urgência
      switch (avaliacao.urgencia) {
        case 'critica':
          stats.criticas++;
          break;
        case 'alta':
          stats.altas++;
          break;
        case 'media':
          stats.medias++;
          break;
        case 'baixa':
          stats.baixas++;
          break;
      }

      // Contar vencidas
      if (avaliacao.diasRestantes < 0) {
        stats.vencidas++;
      }

      // Contar próximas a vencer (3 dias)
      if (avaliacao.diasRestantes >= 0 && avaliacao.diasRestantes <= 3) {
        stats.proximasVencer++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Erro ao gerar estatísticas de notificações:', error);
    throw new Error('Não foi possível gerar as estatísticas');
  }
}

/**
 * Busca configurações de notificação de um usuário
 */
export async function buscarConfiguracaoNotificacao(
  usuarioId: string
): Promise<NotificacaoConfig | null> {
  try {
    // Por enquanto, retornamos uma configuração padrão
    // Em uma implementação real, isso viria do banco de dados
    return {
      id: `config-${usuarioId}`,
      usuarioId,
      notificacoesEmail: true,
      notificacoesInterface: true,
      diasAntecedencia: 3,
      horarioEnvio: '09:00',
      frequenciaLembretes: 'diario',
      ativo: true
    };
  } catch (error) {
    console.error('Erro ao buscar configuração de notificação:', error);
    return null;
  }
}

/**
 * Verifica se um usuário deve receber notificação baseado em suas configurações
 */
export async function deveReceberNotificacao(
  usuarioId: string,
  tipoNotificacao: 'email' | 'interface'
): Promise<boolean> {
  try {
    const config = await buscarConfiguracaoNotificacao(usuarioId);
    
    if (!config || !config.ativo) {
      return false;
    }

    if (tipoNotificacao === 'email') {
      return config.notificacoesEmail;
    }

    if (tipoNotificacao === 'interface') {
      return config.notificacoesInterface;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar se deve receber notificação:', error);
    return false;
  }
}

/**
 * Formata uma mensagem de notificação
 */
export function formatarMensagemNotificacao(
  avaliacao: AvaliacaoPendente,
  tipo: 'lembrete' | 'urgente' | 'vencida'
): { titulo: string; mensagem: string; } {
  const nomeAvaliado = avaliacao.avaliado.nome;
  const nomePeriodo = avaliacao.periodo.nome;
  const diasRestantes = avaliacao.diasRestantes;

  switch (tipo) {
    case 'lembrete':
      return {
        titulo: 'Lembrete: Avaliação Pendente',
        mensagem: `Você tem uma avaliação pendente de ${nomeAvaliado} no período "${nomePeriodo}". ${diasRestantes > 0 ? `Restam ${diasRestantes} dias para o prazo.` : 'O prazo vence hoje!'}`
      };
    
    case 'urgente':
      return {
        titulo: 'Urgente: Avaliação Próxima do Vencimento',
        mensagem: `A avaliação de ${nomeAvaliado} no período "${nomePeriodo}" vence em ${diasRestantes} dia(s). Complete a avaliação o quanto antes.`
      };
    
    case 'vencida':
      return {
        titulo: 'Avaliação Vencida',
        mensagem: `A avaliação de ${nomeAvaliado} no período "${nomePeriodo}" está vencida há ${Math.abs(diasRestantes)} dia(s). Complete a avaliação imediatamente.`
      };
    
    default:
      return {
        titulo: 'Avaliação Pendente',
        mensagem: `Você tem uma avaliação pendente de ${nomeAvaliado} no período "${nomePeriodo}".`
      };
  }
}