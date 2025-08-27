import { AvaliacaoPendente, formatarMensagemNotificacao } from './notificacoes-avaliacoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Interface para configuração de e-mail
 */
export interface ConfiguracaoEmail {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  remetente: {
    nome: string;
    email: string;
  };
  templates: {
    avaliacaoPendente: string;
    lembretePrazo: string;
    avaliacaoVencida: string;
  };
}

/**
 * Interface para dados do destinatário
 */
export interface DestinatarioEmail {
  nome: string;
  email: string;
  cargo?: string;
  setor?: string;
}

/**
 * Interface para resultado do envio de e-mail
 */
export interface ResultadoEnvioEmail {
  sucesso: boolean;
  messageId?: string;
  erro?: string;
  destinatario: string;
  timestamp: Date;
}

/**
 * Interface para estatísticas de envio
 */
export interface EstatisticasEnvio {
  totalEnviados: number;
  sucessos: number;
  falhas: number;
  taxaSucesso: number;
  tempoMedio: number;
  ultimoEnvio?: Date;
}

/**
 * Tipos de notificação por e-mail
 */
export type TipoNotificacaoEmail = 
  | 'avaliacao_pendente'
  | 'lembrete_prazo'
  | 'avaliacao_vencida'
  | 'resumo_semanal'
  | 'resumo_mensal';

/**
 * Interface para template de e-mail
 */
export interface TemplateEmail {
  assunto: string;
  corpo: string;
  tipoConteudo: 'text' | 'html';
}

/**
 * Classe para gerenciar envio de e-mails de notificações
 */
export class GerenciadorEmailNotificacoes {
  private configuracao: ConfiguracaoEmail;
  private estatisticas: Map<string, EstatisticasEnvio> = new Map();

  constructor(configuracao: ConfiguracaoEmail) {
    this.configuracao = configuracao;
  }

  /**
   * Envia e-mail de notificação para avaliação pendente
   */
  async enviarNotificacaoAvaliacaoPendente(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> {
    const template = this.gerarTemplateAvaliacaoPendente(avaliacao, destinatario);
    return this.enviarEmail(destinatario, template, 'avaliacao_pendente');
  }

  /**
   * Envia lembrete de prazo
   */
  async enviarLembretePrazo(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail,
    diasRestantes: number
  ): Promise<ResultadoEnvioEmail> {
    const template = this.gerarTemplateLembretePrazo(avaliacao, destinatario, diasRestantes);
    return this.enviarEmail(destinatario, template, 'lembrete_prazo');
  }

  /**
   * Envia notificação de avaliação vencida
   */
  async enviarNotificacaoVencida(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> {
    const template = this.gerarTemplateAvaliacaoVencida(avaliacao, destinatario);
    return this.enviarEmail(destinatario, template, 'avaliacao_vencida');
  }

  /**
   * Envia resumo semanal de avaliações
   */
  async enviarResumoSemanal(
    avaliacoes: AvaliacaoPendente[],
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> {
    const template = this.gerarTemplateResumoSemanal(avaliacoes, destinatario);
    return this.enviarEmail(destinatario, template, 'resumo_semanal');
  }

  /**
   * Envia múltiplas notificações em lote
   */
  async enviarLoteNotificacoes(
    notificacoes: Array<{
      avaliacao: AvaliacaoPendente;
      destinatario: DestinatarioEmail;
      tipo: TipoNotificacaoEmail;
    }>
  ): Promise<ResultadoEnvioEmail[]> {
    const resultados: ResultadoEnvioEmail[] = [];
    
    for (const notificacao of notificacoes) {
      try {
        let resultado: ResultadoEnvioEmail;
        
        switch (notificacao.tipo) {
          case 'avaliacao_pendente':
            resultado = await this.enviarNotificacaoAvaliacaoPendente(
              notificacao.avaliacao,
              notificacao.destinatario
            );
            break;
          case 'avaliacao_vencida':
            resultado = await this.enviarNotificacaoVencida(
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
        
        // Pequeno delay entre envios para evitar spam
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        resultados.push({
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          destinatario: notificacao.destinatario.email,
          timestamp: new Date()
        });
      }
    }
    
    return resultados;
  }

  /**
   * Método principal para envio de e-mail
   */
  private async enviarEmail(
    destinatario: DestinatarioEmail,
    template: TemplateEmail,
    tipo: TipoNotificacaoEmail
  ): Promise<ResultadoEnvioEmail> {
    const inicioEnvio = Date.now();
    
    try {
      // Simular envio de e-mail (em produção, usar biblioteca como nodemailer)
      const sucesso = Math.random() > 0.1; // 90% de taxa de sucesso simulada
      
      if (!sucesso) {
        throw new Error('Falha na entrega do e-mail');
      }
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempoEnvio = Date.now() - inicioEnvio;
      
      // Atualizar estatísticas
      this.atualizarEstatisticas(tipo, true, tempoEnvio);
      
      return {
        sucesso: true,
        messageId,
        destinatario: destinatario.email,
        timestamp: new Date()
      };
    } catch (error) {
      const tempoEnvio = Date.now() - inicioEnvio;
      
      // Atualizar estatísticas
      this.atualizarEstatisticas(tipo, false, tempoEnvio);
      
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        destinatario: destinatario.email,
        timestamp: new Date()
      };
    }
  }

  /**
   * Gera template para notificação de avaliação pendente
   */
  private gerarTemplateAvaliacaoPendente(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): TemplateEmail {
    const prazoFormatado = format(avaliacao.prazo, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const mensagem = formatarMensagemNotificacao(avaliacao);
    
    return {
      assunto: `Avaliação 360° Pendente - ${avaliacao.avaliado.nome}`,
      corpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Avaliação 360° Pendente</h2>
              
              <p>Olá, <strong>${destinatario.nome}</strong>!</p>
              
              <p>Você tem uma avaliação 360° pendente que requer sua atenção:</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Detalhes da Avaliação</h3>
                <p><strong>Avaliado:</strong> ${avaliacao.avaliado.nome}</p>
                <p><strong>Cargo:</strong> ${avaliacao.avaliado.cargo}</p>
                <p><strong>Setor:</strong> ${avaliacao.avaliado.setor}</p>
                <p><strong>Prazo:</strong> ${prazoFormatado}</p>
                <p><strong>Status:</strong> ${mensagem}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/avaliacoes/${avaliacao.id}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Realizar Avaliação
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Este e-mail foi enviado automaticamente pelo sistema de avaliações 360°.
                Se você não deve receber este e-mail, entre em contato com o administrador.
              </p>
            </div>
          </body>
        </html>
      `,
      tipoConteudo: 'html'
    };
  }

  /**
   * Gera template para lembrete de prazo
   */
  private gerarTemplateLembretePrazo(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail,
    diasRestantes: number
  ): TemplateEmail {
    const prazoFormatado = format(avaliacao.prazo, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const urgencia = diasRestantes <= 1 ? 'URGENTE' : diasRestantes <= 3 ? 'IMPORTANTE' : 'LEMBRETE';
    
    return {
      assunto: `${urgencia}: Avaliação 360° vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`,
      corpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: ${diasRestantes <= 1 ? '#fef2f2' : diasRestantes <= 3 ? '#fefbeb' : '#f0f9ff'}; 
                          border: 2px solid ${diasRestantes <= 1 ? '#ef4444' : diasRestantes <= 3 ? '#f59e0b' : '#3b82f6'}; 
                          border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: ${diasRestantes <= 1 ? '#dc2626' : diasRestantes <= 3 ? '#d97706' : '#2563eb'}; margin: 0;">
                  ${urgencia}: Prazo da Avaliação se Aproxima
                </h2>
              </div>
              
              <p>Olá, <strong>${destinatario.nome}</strong>!</p>
              
              <p>Este é um lembrete de que você tem uma avaliação 360° que vence em <strong>${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}</strong>:</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Detalhes da Avaliação</h3>
                <p><strong>Avaliado:</strong> ${avaliacao.avaliado.nome}</p>
                <p><strong>Prazo:</strong> ${prazoFormatado}</p>
                <p><strong>Dias Restantes:</strong> ${diasRestantes}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/avaliacoes/${avaliacao.id}" 
                   style="background-color: ${diasRestantes <= 1 ? '#ef4444' : diasRestantes <= 3 ? '#f59e0b' : '#2563eb'}; 
                          color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Realizar Avaliação Agora
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Este e-mail foi enviado automaticamente pelo sistema de avaliações 360°.
              </p>
            </div>
          </body>
        </html>
      `,
      tipoConteudo: 'html'
    };
  }

  /**
   * Gera template para avaliação vencida
   */
  private gerarTemplateAvaliacaoVencida(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): TemplateEmail {
    const prazoFormatado = format(avaliacao.prazo, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    return {
      assunto: `VENCIDA: Avaliação 360° - ${avaliacao.avaliado.nome}`,
      corpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #dc2626; margin: 0;">⚠️ Avaliação 360° Vencida</h2>
              </div>
              
              <p>Olá, <strong>${destinatario.nome}</strong>!</p>
              
              <p>A avaliação 360° abaixo <strong>venceu</strong> e ainda não foi concluída:</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626;">Detalhes da Avaliação</h3>
                <p><strong>Avaliado:</strong> ${avaliacao.avaliado.nome}</p>
                <p><strong>Prazo (vencido):</strong> ${prazoFormatado}</p>
                <p><strong>Status:</strong> Vencida</p>
              </div>
              
              <p style="color: #dc2626; font-weight: bold;">
                Por favor, complete esta avaliação o mais breve possível ou entre em contato com seu gestor.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/avaliacoes/${avaliacao.id}" 
                   style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Realizar Avaliação
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Este e-mail foi enviado automaticamente pelo sistema de avaliações 360°.
              </p>
            </div>
          </body>
        </html>
      `,
      tipoConteudo: 'html'
    };
  }

  /**
   * Gera template para resumo semanal
   */
  private gerarTemplateResumoSemanal(
    avaliacoes: AvaliacaoPendente[],
    destinatario: DestinatarioEmail
  ): TemplateEmail {
    const totalAvaliacoes = avaliacoes.length;
    const avaliacoesVencidas = avaliacoes.filter(a => a.urgencia === 'vencida').length;
    const avaliacoesUrgentes = avaliacoes.filter(a => a.urgencia === 'alta').length;
    
    const listaAvaliacoes = avaliacoes.map(avaliacao => {
      const prazoFormatado = format(avaliacao.prazo, "dd/MM/yyyy", { locale: ptBR });
      const corUrgencia = avaliacao.urgencia === 'vencida' ? '#ef4444' : 
                         avaliacao.urgencia === 'alta' ? '#f59e0b' : '#6b7280';
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${avaliacao.avaliado.nome}</td>
          <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${avaliacao.avaliado.cargo}</td>
          <td style="padding: 10px; border-right: 1px solid #e5e7eb;">${prazoFormatado}</td>
          <td style="padding: 10px; color: ${corUrgencia}; font-weight: bold;">
            ${avaliacao.urgencia === 'vencida' ? 'Vencida' : 
              avaliacao.urgencia === 'alta' ? 'Urgente' : 'Normal'}
          </td>
        </tr>
      `;
    }).join('');
    
    return {
      assunto: `Resumo Semanal - ${totalAvaliacoes} Avaliação${totalAvaliacoes !== 1 ? 'ões' : ''} Pendente${totalAvaliacoes !== 1 ? 's' : ''}`,
      corpo: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">📊 Resumo Semanal de Avaliações</h2>
              
              <p>Olá, <strong>${destinatario.nome}</strong>!</p>
              
              <p>Aqui está o resumo das suas avaliações 360° pendentes:</p>
              
              <div style="display: flex; gap: 15px; margin: 20px 0;">
                <div style="background-color: #f0f9ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; flex: 1; text-align: center;">
                  <h3 style="margin: 0; color: #2563eb;">${totalAvaliacoes}</h3>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">Total Pendentes</p>
                </div>
                <div style="background-color: #fefbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; flex: 1; text-align: center;">
                  <h3 style="margin: 0; color: #d97706;">${avaliacoesUrgentes}</h3>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">Urgentes</p>
                </div>
                <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; flex: 1; text-align: center;">
                  <h3 style="margin: 0; color: #dc2626;">${avaliacoesVencidas}</h3>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">Vencidas</p>
                </div>
              </div>
              
              ${totalAvaliacoes > 0 ? `
                <h3 style="color: #1f2937; margin-top: 30px;">Detalhes das Avaliações</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; border-right: 1px solid #e5e7eb;">Avaliado</th>
                      <th style="padding: 12px; text-align: left; border-right: 1px solid #e5e7eb;">Cargo</th>
                      <th style="padding: 12px; text-align: left; border-right: 1px solid #e5e7eb;">Prazo</th>
                      <th style="padding: 12px; text-align: left;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${listaAvaliacoes}
                  </tbody>
                </table>
              ` : '<p style="color: #6b7280; font-style: italic;">Parabéns! Você não tem avaliações pendentes.</p>'}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/avaliacoes" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Todas as Avaliações
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Este resumo é enviado automaticamente todas as segundas-feiras.
                Para alterar suas preferências de notificação, acesse as configurações do sistema.
              </p>
            </div>
          </body>
        </html>
      `,
      tipoConteudo: 'html'
    };
  }

  /**
   * Atualiza estatísticas de envio
   */
  private atualizarEstatisticas(
    tipo: TipoNotificacaoEmail,
    sucesso: boolean,
    tempoEnvio: number
  ): void {
    const estatisticasAtuais = this.estatisticas.get(tipo) || {
      totalEnviados: 0,
      sucessos: 0,
      falhas: 0,
      taxaSucesso: 0,
      tempoMedio: 0
    };
    
    estatisticasAtuais.totalEnviados++;
    
    if (sucesso) {
      estatisticasAtuais.sucessos++;
    } else {
      estatisticasAtuais.falhas++;
    }
    
    estatisticasAtuais.taxaSucesso = (estatisticasAtuais.sucessos / estatisticasAtuais.totalEnviados) * 100;
    estatisticasAtuais.tempoMedio = ((estatisticasAtuais.tempoMedio * (estatisticasAtuais.totalEnviados - 1)) + tempoEnvio) / estatisticasAtuais.totalEnviados;
    estatisticasAtuais.ultimoEnvio = new Date();
    
    this.estatisticas.set(tipo, estatisticasAtuais);
  }

  /**
   * Obtém estatísticas de envio
   */
  obterEstatisticas(tipo?: TipoNotificacaoEmail): EstatisticasEnvio | Map<string, EstatisticasEnvio> {
    if (tipo) {
      return this.estatisticas.get(tipo) || {
        totalEnviados: 0,
        sucessos: 0,
        falhas: 0,
        taxaSucesso: 0,
        tempoMedio: 0
      };
    }
    
    return new Map(this.estatisticas);
  }

  /**
   * Limpa estatísticas
   */
  limparEstatisticas(tipo?: TipoNotificacaoEmail): void {
    if (tipo) {
      this.estatisticas.delete(tipo);
    } else {
      this.estatisticas.clear();
    }
  }
}

/**
 * Instância singleton do gerenciador de e-mail
 */
let gerenciadorEmail: GerenciadorEmailNotificacoes | null = null;

/**
 * Obtém ou cria instância do gerenciador de e-mail
 */
export function obterGerenciadorEmail(): GerenciadorEmailNotificacoes {
  if (!gerenciadorEmail) {
    const configuracao: ConfiguracaoEmail = {
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      },
      remetente: {
        nome: process.env.EMAIL_FROM_NAME || 'Sistema de Avaliações 360°',
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@avaliacoes360.com'
      },
      templates: {
        avaliacaoPendente: 'avaliacao_pendente',
        lembretePrazo: 'lembrete_prazo',
        avaliacaoVencida: 'avaliacao_vencida'
      }
    };
    
    gerenciadorEmail = new GerenciadorEmailNotificacoes(configuracao);
  }
  
  return gerenciadorEmail;
}

/**
 * Funções utilitárias para envio rápido
 */
export const emailUtils = {
  /**
   * Envia notificação simples de avaliação pendente
   */
  async notificarAvaliacaoPendente(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> {
    const gerenciador = obterGerenciadorEmail();
    return gerenciador.enviarNotificacaoAvaliacaoPendente(avaliacao, destinatario);
  },

  /**
   * Envia lembrete de prazo
   */
  async enviarLembrete(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail,
    diasRestantes: number
  ): Promise<ResultadoEnvioEmail> {
    const gerenciador = obterGerenciadorEmail();
    return gerenciador.enviarLembretePrazo(avaliacao, destinatario, diasRestantes);
  },

  /**
   * Envia notificação de vencimento
   */
  async notificarVencimento(
    avaliacao: AvaliacaoPendente,
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> {
    const gerenciador = obterGerenciadorEmail();
    return gerenciador.enviarNotificacaoVencida(avaliacao, destinatario);
  },

  /**
   * Envia resumo semanal
   */
  async enviarResumo(
    avaliacoes: AvaliacaoPendente[],
    destinatario: DestinatarioEmail
  ): Promise<ResultadoEnvioEmail> {
    const gerenciador = obterGerenciadorEmail();
    return gerenciador.enviarResumoSemanal(avaliacoes, destinatario);
  }
};