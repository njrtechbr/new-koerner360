'use client';

import { useState, useCallback } from 'react';
import {
  GerenciadorEmailNotificacoes,
  obterGerenciadorEmail,
  emailUtils,
  ResultadoEnvioEmail,
  EstatisticasEnvio,
  DestinatarioEmail,
  TipoNotificacaoEmail
} from '@/lib/utils/email-notificacoes';
import { AvaliacaoPendente } from '@/lib/utils/notificacoes-avaliacoes';
import { toast } from 'sonner';

/**
 * Interface para configurações de envio
 */
export interface ConfiguracaoEnvio {
  tentativasMaximas: number;
  intervaloTentativas: number;
  notificarSucesso: boolean;
  notificarErro: boolean;
}

/**
 * Interface para resultado de envio em lote
 */
export interface ResultadoLote {
  total: number;
  sucessos: number;
  falhas: number;
  resultados: ResultadoEnvioEmail[];
  tempoTotal: number;
}

/**
 * Hook para gerenciar envio de e-mails de notificações
 */
export function useEmailNotificacoes(configuracao?: Partial<ConfiguracaoEnvio>) {
  const [enviando, setEnviando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoEnvioEmail | null>(null);
  const [estatisticas, setEstatisticas] = useState<Map<string, EstatisticasEnvio>>(new Map());
  
  const config: ConfiguracaoEnvio = {
    tentativasMaximas: 3,
    intervaloTentativas: 1000,
    notificarSucesso: true,
    notificarErro: true,
    ...configuracao
  };

  const gerenciador = obterGerenciadorEmail();

  /**
   * Envia e-mail com retry automático
   */
  const enviarComRetry = useCallback(async (
    funcaoEnvio: () => Promise<ResultadoEnvioEmail>,
    tentativa = 1
  ): Promise<ResultadoEnvioEmail> => {
    try {
      const resultado = await funcaoEnvio();
      
      if (resultado.sucesso) {
        return resultado;
      }
      
      if (tentativa < config.tentativasMaximas) {
        await new Promise(resolve => setTimeout(resolve, config.intervaloTentativas * tentativa));
        return enviarComRetry(funcaoEnvio, tentativa + 1);
      }
      
      return resultado;
    } catch (error) {
      if (tentativa < config.tentativasMaximas) {
        await new Promise(resolve => setTimeout(resolve, config.intervaloTentativas * tentativa));
        return enviarComRetry(funcaoEnvio, tentativa + 1);
      }
      
      throw error;
    }
  }, [config]);

  /**
   * Envia notificação de avaliação pendente
   */
  const enviarNotificacaoAvaliacaoPendente = useCallback(async (
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> => {
    setEnviando(true);
    
    try {
      const resultado = await enviarComRetry(() => 
        emailUtils.notificarAvaliacaoPendente(avaliacao, destinatario)
      );
      
      setUltimoResultado(resultado);
      
      if (resultado.sucesso && config.notificarSucesso) {
        toast.success(`E-mail enviado para ${destinatario.nome}`);
      } else if (!resultado.sucesso && config.notificarErro) {
        toast.error(`Falha ao enviar e-mail: ${resultado.erro}`);
      }
      
      return resultado;
    } catch (error) {
      const resultado: ResultadoEnvioEmail = {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        destinatario: destinatario.email,
        timestamp: new Date()
      };
      
      setUltimoResultado(resultado);
      
      if (config.notificarErro) {
        toast.error(`Erro ao enviar e-mail: ${resultado.erro}`);
      }
      
      return resultado;
    } finally {
      setEnviando(false);
    }
  }, [enviarComRetry, config]);

  /**
   * Envia lembrete de prazo
   */
  const enviarLembretePrazo = useCallback(async (
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail,
    diasRestantes: number
  ): Promise<ResultadoEnvioEmail> => {
    setEnviando(true);
    
    try {
      const resultado = await enviarComRetry(() => 
        emailUtils.enviarLembrete(avaliacao, destinatario, diasRestantes)
      );
      
      setUltimoResultado(resultado);
      
      if (resultado.sucesso && config.notificarSucesso) {
        toast.success(`Lembrete enviado para ${destinatario.nome}`);
      } else if (!resultado.sucesso && config.notificarErro) {
        toast.error(`Falha ao enviar lembrete: ${resultado.erro}`);
      }
      
      return resultado;
    } catch (error) {
      const resultado: ResultadoEnvioEmail = {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        destinatario: destinatario.email,
        timestamp: new Date()
      };
      
      setUltimoResultado(resultado);
      
      if (config.notificarErro) {
        toast.error(`Erro ao enviar lembrete: ${resultado.erro}`);
      }
      
      return resultado;
    } finally {
      setEnviando(false);
    }
  }, [enviarComRetry, config]);

  /**
   * Envia notificação de vencimento
   */
  const enviarNotificacaoVencida = useCallback(async (
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> => {
    setEnviando(true);
    
    try {
      const resultado = await enviarComRetry(() => 
        emailUtils.notificarVencimento(avaliacao, destinatario)
      );
      
      setUltimoResultado(resultado);
      
      if (resultado.sucesso && config.notificarSucesso) {
        toast.success(`Notificação de vencimento enviada para ${destinatario.nome}`);
      } else if (!resultado.sucesso && config.notificarErro) {
        toast.error(`Falha ao enviar notificação: ${resultado.erro}`);
      }
      
      return resultado;
    } catch (error) {
      const resultado: ResultadoEnvioEmail = {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        destinatario: destinatario.email,
        timestamp: new Date()
      };
      
      setUltimoResultado(resultado);
      
      if (config.notificarErro) {
        toast.error(`Erro ao enviar notificação: ${resultado.erro}`);
      }
      
      return resultado;
    } finally {
      setEnviando(false);
    }
  }, [enviarComRetry, config]);

  /**
   * Envia resumo semanal
   */
  const enviarResumoSemanal = useCallback(async (
    avaliacoes: AvaliacaoPendente[],
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> => {
    setEnviando(true);
    
    try {
      const resultado = await enviarComRetry(() => 
        emailUtils.enviarResumo(avaliacoes, destinatario)
      );
      
      setUltimoResultado(resultado);
      
      if (resultado.sucesso && config.notificarSucesso) {
        toast.success(`Resumo semanal enviado para ${destinatario.nome}`);
      } else if (!resultado.sucesso && config.notificarErro) {
        toast.error(`Falha ao enviar resumo: ${resultado.erro}`);
      }
      
      return resultado;
    } catch (error) {
      const resultado: ResultadoEnvioEmail = {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        destinatario: destinatario.email,
        timestamp: new Date()
      };
      
      setUltimoResultado(resultado);
      
      if (config.notificarErro) {
        toast.error(`Erro ao enviar resumo: ${resultado.erro}`);
      }
      
      return resultado;
    } finally {
      setEnviando(false);
    }
  }, [enviarComRetry, config]);

  /**
   * Envia múltiplas notificações em lote
   */
  const enviarLoteNotificacoes = useCallback(async (
    notificacoes: Array<{
      avaliacao: AvaliacaoPendente;
      destinatario: DestinatarioEmail;
      tipo: TipoNotificacaoEmail;
      diasRestantes?: number;
    }>
  ): Promise<ResultadoLote> => {
    setEnviando(true);
    const inicioLote = Date.now();
    
    try {
      const resultados: ResultadoEnvioEmail[] = [];
      let sucessos = 0;
      let falhas = 0;
      
      for (const notificacao of notificacoes) {
        try {
          let resultado: ResultadoEnvioEmail;
          
          switch (notificacao.tipo) {
            case 'avaliacao_pendente':
              resultado = await enviarNotificacaoAvaliacaoPendente(
                notificacao.avaliacao,
                notificacao.destinatario
              );
              break;
            case 'lembrete_prazo':
              resultado = await enviarLembretePrazo(
                notificacao.avaliacao,
                notificacao.destinatario,
                notificacao.diasRestantes || 3
              );
              break;
            case 'avaliacao_vencida':
              resultado = await enviarNotificacaoVencida(
                notificacao.avaliacao,
                notificacao.destinatario
              );
              break;
            default:
              resultado = {
                sucesso: false,
                erro: `Tipo de notificação não suportado: ${notificacao.tipo}`,
                destinatario: notificacao.destinatario.email,
                timestamp: new Date()
              };
          }
          
          resultados.push(resultado);
          
          if (resultado.sucesso) {
            sucessos++;
          } else {
            falhas++;
          }
          
          // Pequeno delay entre envios
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          const resultado: ResultadoEnvioEmail = {
            sucesso: false,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
            destinatario: notificacao.destinatario.email,
            timestamp: new Date()
          };
          
          resultados.push(resultado);
          falhas++;
        }
      }
      
      const tempoTotal = Date.now() - inicioLote;
      
      const resultadoLote: ResultadoLote = {
        total: notificacoes.length,
        sucessos,
        falhas,
        resultados,
        tempoTotal
      };
      
      if (config.notificarSucesso && sucessos > 0) {
        toast.success(`${sucessos} e-mail${sucessos !== 1 ? 's' : ''} enviado${sucessos !== 1 ? 's' : ''} com sucesso`);
      }
      
      if (config.notificarErro && falhas > 0) {
        toast.error(`${falhas} e-mail${falhas !== 1 ? 's' : ''} falharam no envio`);
      }
      
      return resultadoLote;
    } finally {
      setEnviando(false);
    }
  }, [enviarNotificacaoAvaliacaoPendente, enviarLembretePrazo, enviarNotificacaoVencida, config]);

  /**
   * Atualiza estatísticas
   */
  const atualizarEstatisticas = useCallback(() => {
    const novasEstatisticas = gerenciador.obterEstatisticas() as Map<string, EstatisticasEnvio>;
    setEstatisticas(new Map(novasEstatisticas));
  }, [gerenciador]);

  /**
   * Limpa estatísticas
   */
  const limparEstatisticas = useCallback((tipo?: TipoNotificacaoEmail) => {
    gerenciador.limparEstatisticas(tipo);
    atualizarEstatisticas();
  }, [gerenciador, atualizarEstatisticas]);

  return {
    // Estado
    enviando,
    ultimoResultado,
    estatisticas,
    
    // Funções de envio
    enviarNotificacaoAvaliacaoPendente,
    enviarLembretePrazo,
    enviarNotificacaoVencida,
    enviarResumoSemanal,
    enviarLoteNotificacoes,
    
    // Funções de controle
    atualizarEstatisticas,
    limparEstatisticas
  };
}

/**
 * Hook simplificado para envio rápido de notificações
 */
export function useEnvioRapido() {
  const {
    enviarNotificacaoAvaliacaoPendente,
    enviarLembretePrazo,
    enviarNotificacaoVencida,
    enviando
  } = useEmailNotificacoes({
    notificarSucesso: false,
    notificarErro: true
  });

  return {
    enviando,
    notificarAvaliacaoPendente: enviarNotificacaoAvaliacaoPendente,
    enviarLembrete: enviarLembretePrazo,
    notificarVencimento: enviarNotificacaoVencida
  };
}

/**
 * Hook para monitoramento de estatísticas de e-mail
 */
export function useEstatisticasEmail() {
  const [estatisticas, setEstatisticas] = useState<Map<string, EstatisticasEnvio>>(new Map());
  const [carregando, setCarregando] = useState(false);
  
  const gerenciador = obterGerenciadorEmail();

  const carregarEstatisticas = useCallback(async () => {
    setCarregando(true);
    try {
      const novasEstatisticas = gerenciador.obterEstatisticas() as Map<string, EstatisticasEnvio>;
      setEstatisticas(new Map(novasEstatisticas));
    } catch (error) {
      console.error('Erro ao carregar estatísticas de e-mail:', error);
    } finally {
      setCarregando(false);
    }
  }, [gerenciador]);

  const obterEstatisticasPorTipo = useCallback((tipo: TipoNotificacaoEmail): EstatisticasEnvio => {
    return estatisticas.get(tipo) || {
      totalEnviados: 0,
      sucessos: 0,
      falhas: 0,
      taxaSucesso: 0,
      tempoMedio: 0
    };
  }, [estatisticas]);

  const obterEstatisticasGerais = useCallback((): EstatisticasEnvio => {
    let totalEnviados = 0;
    let sucessos = 0;
    let falhas = 0;
    let tempoMedioTotal = 0;
    let ultimoEnvio: Date | undefined;

    for (const [, stats] of estatisticas) {
      totalEnviados += stats.totalEnviados;
      sucessos += stats.sucessos;
      falhas += stats.falhas;
      tempoMedioTotal += stats.tempoMedio * stats.totalEnviados;
      
      if (stats.ultimoEnvio && (!ultimoEnvio || stats.ultimoEnvio > ultimoEnvio)) {
        ultimoEnvio = stats.ultimoEnvio;
      }
    }

    return {
      totalEnviados,
      sucessos,
      falhas,
      taxaSucesso: totalEnviados > 0 ? (sucessos / totalEnviados) * 100 : 0,
      tempoMedio: totalEnviados > 0 ? tempoMedioTotal / totalEnviados : 0,
      ultimoEnvio
    };
  }, [estatisticas]);

  return {
    estatisticas,
    carregando,
    carregarEstatisticas,
    obterEstatisticasPorTipo,
    obterEstatisticasGerais
  };
}