import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verificarPermissao } from '@/lib/utils/permissoes';
import { obterGerenciadorEmail } from '@/lib/utils/email-notificacoes';

// Schema de validação para envio de e-mail
const envioEmailSchema = z.object({
  tipo: z.enum(['avaliacao_pendente', 'lembrete_prazo', 'avaliacao_vencida', 'resumo_semanal']),
  destinatarios: z.array(z.object({
    usuarioId: z.string(),
    email: z.string().email(),
    nome: z.string(),
  })).min(1),
  dadosPersonalizacao: z.object({
    avaliacaoId: z.string().optional(),
    nomeAvaliacao: z.string().optional(),
    prazoVencimento: z.string().optional(),
    diasRestantes: z.number().optional(),
    urlAvaliacao: z.string().optional(),
    estatisticas: z.object({
      totalPendentes: z.number().optional(),
      totalVencidas: z.number().optional(),
      totalConcluidas: z.number().optional(),
    }).optional(),
  }).optional(),
  agendarPara: z.string().datetime().optional(),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
});

// Schema para envio em lote
const envioLoteSchema = z.object({
  envios: z.array(envioEmailSchema).min(1).max(50),
  processarEmLote: z.boolean().default(true),
  aguardarConclusao: z.boolean().default(false),
});

// POST - Enviar e-mail de notificação
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const isLote = searchParams.get('lote') === 'true';

    // Verificar permissões para envio de e-mails
    const temPermissao = await verificarPermissao(
      session.user.id,
      ['ADMIN', 'GESTOR']
    );
    
    if (!temPermissao) {
      return NextResponse.json(
        { erro: 'Sem permissão para enviar e-mails de notificação' },
        { status: 403 }
      );
    }

    const gerenciadorEmail = obterGerenciadorEmail();

    if (isLote) {
      // Envio em lote
      const dadosValidados = envioLoteSchema.parse(body);
      const { envios, processarEmLote, aguardarConclusao } = dadosValidados;

      const resultados = [];
      const erros = [];

      for (let i = 0; i < envios.length; i++) {
        const envio = envios[i];
        
        try {
          // Verificar configurações de e-mail dos destinatários
          const destinatariosValidos = [];
          
          for (const destinatario of envio.destinatarios) {
            const configuracao = await prisma.configuracaoEmailNotificacao.findUnique({
              where: { usuarioId: destinatario.usuarioId },
            });

            // Se não tem configuração ou e-mails desativados, pular
            if (!configuracao || !configuracao.emailsAtivos || !configuracao.ativo) {
              continue;
            }

            // Verificar se o tipo de notificação está habilitado
            const tipoHabilitado = {
              'avaliacao_pendente': configuracao.tiposNotificacao.avaliacaoPendente,
              'lembrete_prazo': configuracao.tiposNotificacao.lembreteVencimento,
              'avaliacao_vencida': configuracao.tiposNotificacao.avaliacaoVencida,
              'resumo_semanal': configuracao.tiposNotificacao.resumoSemanal,
            }[envio.tipo];

            if (!tipoHabilitado) {
              continue;
            }

            destinatariosValidos.push({
              ...destinatario,
              configuracao,
            });
          }

          if (destinatariosValidos.length === 0) {
            erros.push({
              indice: i,
              erro: 'Nenhum destinatário válido encontrado',
            });
            continue;
          }

          // Enviar e-mail
          let resultado;
          
          switch (envio.tipo) {
            case 'avaliacao_pendente':
              resultado = await gerenciadorEmail.enviarAvaliacaoPendente(
                destinatariosValidos,
                {
                  avaliacaoId: envio.dadosPersonalizacao?.avaliacaoId || '',
                  nomeAvaliacao: envio.dadosPersonalizacao?.nomeAvaliacao || '',
                  prazoVencimento: new Date(envio.dadosPersonalizacao?.prazoVencimento || Date.now()),
                  urlAvaliacao: envio.dadosPersonalizacao?.urlAvaliacao || '',
                }
              );
              break;
              
            case 'lembrete_prazo':
              resultado = await gerenciadorEmail.enviarLembretePrazo(
                destinatariosValidos,
                {
                  avaliacaoId: envio.dadosPersonalizacao?.avaliacaoId || '',
                  nomeAvaliacao: envio.dadosPersonalizacao?.nomeAvaliacao || '',
                  diasRestantes: envio.dadosPersonalizacao?.diasRestantes || 0,
                  prazoVencimento: new Date(envio.dadosPersonalizacao?.prazoVencimento || Date.now()),
                  urlAvaliacao: envio.dadosPersonalizacao?.urlAvaliacao || '',
                }
              );
              break;
              
            case 'avaliacao_vencida':
              resultado = await gerenciadorEmail.enviarAvaliacaoVencida(
                destinatariosValidos,
                {
                  avaliacaoId: envio.dadosPersonalizacao?.avaliacaoId || '',
                  nomeAvaliacao: envio.dadosPersonalizacao?.nomeAvaliacao || '',
                  diasVencimento: Math.abs(envio.dadosPersonalizacao?.diasRestantes || 0),
                  urlAvaliacao: envio.dadosPersonalizacao?.urlAvaliacao || '',
                }
              );
              break;
              
            case 'resumo_semanal':
              resultado = await gerenciadorEmail.enviarResumoSemanal(
                destinatariosValidos,
                envio.dadosPersonalizacao?.estatisticas || {
                  totalPendentes: 0,
                  totalVencidas: 0,
                  totalConcluidas: 0,
                }
              );
              break;
              
            default:
              throw new Error(`Tipo de e-mail não suportado: ${envio.tipo}`);
          }

          resultados.push({
            indice: i,
            sucesso: resultado.sucesso,
            destinatariosEnviados: resultado.sucessos,
            destinatariosFalha: resultado.falhas,
            estatisticas: resultado.estatisticas,
          });

        } catch (error) {
          erros.push({
            indice: i,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }

        // Delay entre envios para evitar spam
        if (i < envios.length - 1 && processarEmLote) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return NextResponse.json({
        resultados,
        erros,
        estatisticas: {
          totalEnvios: envios.length,
          sucessos: resultados.length,
          falhas: erros.length,
          destinatariosTotal: resultados.reduce((acc, r) => acc + r.destinatariosEnviados, 0),
        },
        mensagem: `Processamento em lote concluído: ${resultados.length} sucessos, ${erros.length} falhas`,
      });

    } else {
      // Envio único
      const dadosValidados = envioEmailSchema.parse(body);
      const { tipo, destinatarios, dadosPersonalizacao, prioridade } = dadosValidados;

      // Verificar configurações de e-mail dos destinatários
      const destinatariosValidos = [];
      
      for (const destinatario of destinatarios) {
        const configuracao = await prisma.configuracaoEmailNotificacao.findUnique({
          where: { usuarioId: destinatario.usuarioId },
        });

        // Se não tem configuração ou e-mails desativados, pular
        if (!configuracao || !configuracao.emailsAtivos || !configuracao.ativo) {
          continue;
        }

        // Verificar se o tipo de notificação está habilitado
        const tipoHabilitado = {
          'avaliacao_pendente': configuracao.tiposNotificacao.avaliacaoPendente,
          'lembrete_prazo': configuracao.tiposNotificacao.lembreteVencimento,
          'avaliacao_vencida': configuracao.tiposNotificacao.avaliacaoVencida,
          'resumo_semanal': configuracao.tiposNotificacao.resumoSemanal,
        }[tipo];

        if (!tipoHabilitado) {
          continue;
        }

        destinatariosValidos.push({
          ...destinatario,
          configuracao,
        });
      }

      if (destinatariosValidos.length === 0) {
        return NextResponse.json(
          { erro: 'Nenhum destinatário válido encontrado' },
          { status: 400 }
        );
      }

      // Enviar e-mail
      let resultado;
      
      switch (tipo) {
        case 'avaliacao_pendente':
          resultado = await gerenciadorEmail.enviarAvaliacaoPendente(
            destinatariosValidos,
            {
              avaliacaoId: dadosPersonalizacao?.avaliacaoId || '',
              nomeAvaliacao: dadosPersonalizacao?.nomeAvaliacao || '',
              prazoVencimento: new Date(dadosPersonalizacao?.prazoVencimento || Date.now()),
              urlAvaliacao: dadosPersonalizacao?.urlAvaliacao || '',
            }
          );
          break;
          
        case 'lembrete_prazo':
          resultado = await gerenciadorEmail.enviarLembretePrazo(
            destinatariosValidos,
            {
              avaliacaoId: dadosPersonalizacao?.avaliacaoId || '',
              nomeAvaliacao: dadosPersonalizacao?.nomeAvaliacao || '',
              diasRestantes: dadosPersonalizacao?.diasRestantes || 0,
              prazoVencimento: new Date(dadosPersonalizacao?.prazoVencimento || Date.now()),
              urlAvaliacao: dadosPersonalizacao?.urlAvaliacao || '',
            }
          );
          break;
          
        case 'avaliacao_vencida':
          resultado = await gerenciadorEmail.enviarAvaliacaoVencida(
            destinatariosValidos,
            {
              avaliacaoId: dadosPersonalizacao?.avaliacaoId || '',
              nomeAvaliacao: dadosPersonalizacao?.nomeAvaliacao || '',
              diasVencimento: Math.abs(dadosPersonalizacao?.diasRestantes || 0),
              urlAvaliacao: dadosPersonalizacao?.urlAvaliacao || '',
            }
          );
          break;
          
        case 'resumo_semanal':
          resultado = await gerenciadorEmail.enviarResumoSemanal(
            destinatariosValidos,
            dadosPersonalizacao?.estatisticas || {
              totalPendentes: 0,
              totalVencidas: 0,
              totalConcluidas: 0,
            }
          );
          break;
          
        default:
          return NextResponse.json(
            { erro: `Tipo de e-mail não suportado: ${tipo}` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        resultado,
        mensagem: resultado.sucesso 
          ? `E-mail enviado com sucesso para ${resultado.sucessos} destinatários`
          : `Falha no envio: ${resultado.falhas} destinatários com erro`,
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          erro: 'Dados inválidos',
          detalhes: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Erro ao enviar e-mail de notificação:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Obter estatísticas de envio de e-mails
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { erro: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar permissões
    const temPermissao = await verificarPermissao(
      session.user.id,
      ['ADMIN', 'GESTOR']
    );
    
    if (!temPermissao) {
      return NextResponse.json(
        { erro: 'Sem permissão para visualizar estatísticas de e-mail' },
        { status: 403 }
      );
    }

    const gerenciadorEmail = obterGerenciadorEmail();
    const estatisticas = await gerenciadorEmail.obterEstatisticas();

    return NextResponse.json({
      estatisticas,
      mensagem: 'Estatísticas de e-mail obtidas com sucesso',
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de e-mail:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}