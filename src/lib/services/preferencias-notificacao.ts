import { 
  PreferenciasNotificacao, 
  PreferenciasNotificacaoInput, 
  PREFERENCIAS_DEFAULTS 
} from '../types/preferencias-notificacao';
import { prisma } from '../prisma';

export class PreferenciasNotificacaoService {
  /**
   * Busca as preferências de notificação de um usuário
   * Se não existir, cria com valores padrão
   */
  static async buscarPorUsuario(usuarioId: string): Promise<PreferenciasNotificacao> {
    try {
      let preferencias = await prisma.preferenciaNotificacao.findUnique({
        where: { usuarioId },
      });

      if (!preferencias) {
        preferencias = await this.criarPreferenciasDefault(usuarioId);
      }

      return this.formatarPreferencias(preferencias);
    } catch (error) {
      console.error('Erro ao buscar preferências de notificação:', error);
      throw new Error('Falha ao buscar preferências de notificação');
    }
  }

  /**
   * Atualiza as preferências de notificação de um usuário
   */
  static async atualizar(
    usuarioId: string, 
    dados: PreferenciasNotificacaoInput
  ): Promise<PreferenciasNotificacao> {
    try {
      // Busca preferências existentes ou cria com defaults
      let preferenciasExistentes = await prisma.preferenciaNotificacao.findUnique({
        where: { usuarioId },
      });

      if (!preferenciasExistentes) {
        preferenciasExistentes = await this.criarPreferenciasDefault(usuarioId);
      }

      // Mescla dados existentes com novos dados
      const dadosAtualizados = this.mesclarDados(preferenciasExistentes, dados);

      const preferenciasAtualizadas = await prisma.preferenciaNotificacao.update({
        where: { usuarioId },
        data: {
          ...dadosAtualizados,
          atualizadoEm: new Date(),
          versao: { increment: 1 },
        },
      });

      return this.formatarPreferencias(preferenciasAtualizadas);
    } catch (error) {
      console.error('Erro ao atualizar preferências de notificação:', error);
      throw new Error('Falha ao atualizar preferências de notificação');
    }
  }

  /**
   * Reseta as preferências para os valores padrão
   */
  static async resetarParaDefault(usuarioId: string): Promise<PreferenciasNotificacao> {
    try {
      const preferenciasResetadas = await prisma.preferenciaNotificacao.upsert({
        where: { usuarioId },
        update: {
          ...this.criarDadosDefault(),
          atualizadoEm: new Date(),
          versao: { increment: 1 },
        },
        create: {
          usuarioId,
          ...this.criarDadosDefault(),
        },
      });

      return this.formatarPreferencias(preferenciasResetadas);
    } catch (error) {
      console.error('Erro ao resetar preferências de notificação:', error);
      throw new Error('Falha ao resetar preferências de notificação');
    }
  }

  /**
   * Pausa as notificações por um período
   */
  static async pausarNotificacoes(
    usuarioId: string,
    dataInicio: Date,
    dataFim: Date,
    motivo?: string
  ): Promise<PreferenciasNotificacao> {
    return this.atualizar(usuarioId, {
      pausarNotificacoes: {
        ativo: true,
        dataInicio,
        dataFim,
        motivo,
      },
    });
  }

  /**
   * Retoma as notificações (remove pausa)
   */
  static async retomarNotificacoes(usuarioId: string): Promise<PreferenciasNotificacao> {
    return this.atualizar(usuarioId, {
      pausarNotificacoes: {
        ativo: false,
        dataInicio: undefined,
        dataFim: undefined,
        motivo: undefined,
      },
    });
  }

  /**
   * Verifica se as notificações estão pausadas para um usuário
   */
  static async verificarNotificacoesPausadas(usuarioId: string): Promise<boolean> {
    try {
      const preferencias = await this.buscarPorUsuario(usuarioId);
      
      if (!preferencias.pausarNotificacoes.ativo) {
        return false;
      }

      const agora = new Date();
      const dataInicio = preferencias.pausarNotificacoes.dataInicio;
      const dataFim = preferencias.pausarNotificacoes.dataFim;

      if (dataInicio && agora < dataInicio) {
        return false;
      }

      if (dataFim && agora > dataFim) {
        // Auto-retomar se passou do período
        await this.retomarNotificacoes(usuarioId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar notificações pausadas:', error);
      return false;
    }
  }

  /**
   * Busca usuários que devem receber notificações de um tipo específico
   */
  static async buscarUsuariosParaNotificacao(
    tipoNotificacao: keyof PreferenciasNotificacao['tiposNotificacao'],
    urgencia?: PreferenciasNotificacao['urgenciaMinima']
  ): Promise<string[]> {
    try {
      const whereClause: any = {
        notificacoesAtivas: true,
        [`tiposNotificacao.${tipoNotificacao}`]: true,
        pausarNotificacoes: {
          path: ['ativo'],
          equals: false,
        },
      };

      if (urgencia) {
        const urgenciaOrder = { BAIXA: 1, MEDIA: 2, ALTA: 3 };
        const urgenciaMinima = urgenciaOrder[urgencia];
        
        whereClause.OR = [
          { urgenciaMinima: 'BAIXA' },
          ...(urgenciaMinima >= 2 ? [{ urgenciaMinima: 'MEDIA' }] : []),
          ...(urgenciaMinima >= 3 ? [{ urgenciaMinima: 'ALTA' }] : []),
        ];
      }

      const preferencias = await prisma.preferenciaNotificacao.findMany({
        where: whereClause,
        select: { usuarioId: true },
      });

      return preferencias.map(p => p.usuarioId);
    } catch (error) {
      console.error('Erro ao buscar usuários para notificação:', error);
      return [];
    }
  }

  /**
   * Atualiza a data da última notificação enviada
   */
  static async atualizarUltimaNotificacao(usuarioId: string): Promise<void> {
    try {
      await prisma.preferenciaNotificacao.update({
        where: { usuarioId },
        data: { ultimaNotificacaoEnviada: new Date() },
      });
    } catch (error) {
      console.error('Erro ao atualizar última notificação:', error);
    }
  }

  /**
   * Cria preferências com valores padrão para um usuário
   */
  private static async criarPreferenciasDefault(usuarioId: string): Promise<any> {
    return prisma.preferenciaNotificacao.create({
      data: {
        usuarioId,
        ...this.criarDadosDefault(),
      },
    });
  }

  /**
   * Cria objeto com dados padrão
   */
  private static criarDadosDefault(): any {
    return {
      notificacoesAtivas: PREFERENCIAS_DEFAULTS.notificacoesAtivas,
      emailAtivo: PREFERENCIAS_DEFAULTS.emailAtivo,
      diasAntecedenciaLembrete: PREFERENCIAS_DEFAULTS.diasAntecedenciaLembrete,
      horarioEnvio: PREFERENCIAS_DEFAULTS.horarioEnvio,
      incluirFinsDeSemanaSemana: PREFERENCIAS_DEFAULTS.incluirFinsDeSemanaSemana,
      incluirFeriados: PREFERENCIAS_DEFAULTS.incluirFeriados,
      tiposNotificacao: PREFERENCIAS_DEFAULTS.tiposNotificacao,
      urgenciaMinima: PREFERENCIAS_DEFAULTS.urgenciaMinima,
      frequenciaLembretes: PREFERENCIAS_DEFAULTS.frequenciaLembretes,
      incluirDetalhesAvaliacao: PREFERENCIAS_DEFAULTS.incluirDetalhesAvaliacao,
      incluirLinkDireto: PREFERENCIAS_DEFAULTS.incluirLinkDireto,
      incluirResumoEstatisticas: PREFERENCIAS_DEFAULTS.incluirResumoEstatisticas,
      formatoEmail: PREFERENCIAS_DEFAULTS.formatoEmail,
      idiomaNotificacao: PREFERENCIAS_DEFAULTS.idiomaNotificacao,
      pausarNotificacoes: {
        ativo: false,
      },
      filtros: PREFERENCIAS_DEFAULTS.filtros,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      versao: 1,
    };
  }

  /**
   * Mescla dados existentes com novos dados
   */
  private static mesclarDados(existentes: any, novos: PreferenciasNotificacaoInput): any {
    const resultado = { ...existentes };

    // Atualiza campos simples
    Object.keys(novos).forEach(key => {
      if (key === 'tiposNotificacao' || key === 'frequenciaLembretes' || 
          key === 'pausarNotificacoes' || key === 'filtros') {
        // Para objetos aninhados, mescla propriedades
        resultado[key] = {
          ...resultado[key],
          ...novos[key as keyof PreferenciasNotificacaoInput],
        };
      } else {
        resultado[key] = novos[key as keyof PreferenciasNotificacaoInput];
      }
    });

    return resultado;
  }

  /**
   * Formata dados do banco para o tipo TypeScript
   */
  private static formatarPreferencias(dados: any): PreferenciasNotificacao {
    return {
      id: dados.id,
      usuarioId: dados.usuarioId,
      notificacoesAtivas: dados.notificacoesAtivas,
      emailAtivo: dados.emailAtivo,
      diasAntecedenciaLembrete: dados.diasAntecedenciaLembrete,
      horarioEnvio: dados.horarioEnvio,
      incluirFinsDeSemanaSemana: dados.incluirFinsDeSemanaSemana,
      incluirFeriados: dados.incluirFeriados,
      tiposNotificacao: dados.tiposNotificacao,
      urgenciaMinima: dados.urgenciaMinima,
      frequenciaLembretes: dados.frequenciaLembretes,
      incluirDetalhesAvaliacao: dados.incluirDetalhesAvaliacao,
      incluirLinkDireto: dados.incluirLinkDireto,
      incluirResumoEstatisticas: dados.incluirResumoEstatisticas,
      formatoEmail: dados.formatoEmail,
      idiomaNotificacao: dados.idiomaNotificacao,
      pausarNotificacoes: dados.pausarNotificacoes || { ativo: false },
      filtros: dados.filtros,
      criadoEm: dados.criadoEm,
      atualizadoEm: dados.atualizadoEm,
      ultimaNotificacaoEnviada: dados.ultimaNotificacaoEnviada,
      versao: dados.versao,
    };
  }
}