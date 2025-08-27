import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  buscarAvaliacoesPendentesUsuario,
  buscarTodasAvaliacoesPendentes,
  gerarEstatisticasNotificacoes,
  buscarAvaliacoesParaNotificacao
} from '@/lib/utils/notificacoes-avaliacoes';

// Schema para validação dos filtros
const filtrosSchema = z.object({
  usuarioId: z.string().optional(),
  diasAntecedencia: z.number().min(0).max(30).optional(),
  incluirEstatisticas: z.boolean().optional().default(true)
});

/**
 * GET /api/notificacoes/avaliacoes
 * Busca notificações de avaliações pendentes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId') || session.user.id;
    const diasAntecedencia = searchParams.get('diasAntecedencia') 
      ? parseInt(searchParams.get('diasAntecedencia')!) 
      : undefined;
    const incluirEstatisticas = searchParams.get('incluirEstatisticas') !== 'false';

    // Validar parâmetros
    const filtros = filtrosSchema.parse({
      usuarioId,
      diasAntecedencia,
      incluirEstatisticas
    });

    // Verificar permissões
    const isAdmin = session.user.tipo === 'ADMIN';
    const isGestor = session.user.tipo === 'GESTOR';
    const isProprioUsuario = filtros.usuarioId === session.user.id;

    if (!isAdmin && !isGestor && !isProprioUsuario) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar essas notificações' },
        { status: 403 }
      );
    }

    // Buscar avaliações pendentes
    let avaliacoesPendentes;
    if (filtros.diasAntecedencia !== undefined) {
      // Buscar apenas avaliações próximas do vencimento
      avaliacoesPendentes = await buscarAvaliacoesParaNotificacao(filtros.diasAntecedencia);
      // Filtrar por usuário se especificado
      if (filtros.usuarioId) {
        avaliacoesPendentes = avaliacoesPendentes.filter(
          avaliacao => avaliacao.avaliadorId === filtros.usuarioId
        );
      }
    } else if (filtros.usuarioId) {
      avaliacoesPendentes = await buscarAvaliacoesPendentesUsuario(filtros.usuarioId);
    } else {
      // Apenas admins e gestores podem ver todas as avaliações
      if (!isAdmin && !isGestor) {
        return NextResponse.json(
          { error: 'Sem permissão para acessar todas as notificações' },
          { status: 403 }
        );
      }
      avaliacoesPendentes = await buscarTodasAvaliacoesPendentes();
    }

    // Gerar estatísticas se solicitado
    let estatisticas = null;
    if (filtros.incluirEstatisticas) {
      estatisticas = await gerarEstatisticasNotificacoes(filtros.usuarioId);
    }

    return NextResponse.json({
      avaliacoesPendentes,
      estatisticas,
      filtros: {
        usuarioId: filtros.usuarioId,
        diasAntecedencia: filtros.diasAntecedencia,
        incluirEstatisticas: filtros.incluirEstatisticas
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar notificações de avaliações:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notificacoes/avaliacoes
 * Busca notificações com filtros mais complexos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const body = await request.json();
    
    // Schema mais complexo para POST
    const filtrosComplexosSchema = z.object({
      usuarioId: z.string().optional(),
      usuariosIds: z.array(z.string()).optional(),
      diasAntecedencia: z.number().min(0).max(30).optional(),
      urgencias: z.array(z.enum(['baixa', 'media', 'alta', 'critica'])).optional(),
      incluirEstatisticas: z.boolean().optional().default(true),
      incluirVencidas: z.boolean().optional().default(true),
      limite: z.number().min(1).max(100).optional(),
      ordenacao: z.enum(['dataLimite', 'urgencia', 'criadaEm']).optional().default('dataLimite')
    });

    const filtros = filtrosComplexosSchema.parse(body);

    // Verificar permissões
    const isAdmin = session.user.tipo === 'ADMIN';
    const isGestor = session.user.tipo === 'GESTOR';
    const isProprioUsuario = filtros.usuarioId === session.user.id;
    const somentePropriosUsuarios = filtros.usuariosIds?.every(id => id === session.user.id);

    if (!isAdmin && !isGestor && !isProprioUsuario && !somentePropriosUsuarios) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar essas notificações' },
        { status: 403 }
      );
    }

    // Buscar avaliações pendentes
    let avaliacoesPendentes;
    
    if (filtros.usuariosIds && filtros.usuariosIds.length > 0) {
      // Buscar para múltiplos usuários
      const promessas = filtros.usuariosIds.map(id => 
        buscarAvaliacoesPendentesUsuario(id)
      );
      const resultados = await Promise.all(promessas);
      avaliacoesPendentes = resultados.flat();
    } else if (filtros.usuarioId) {
      avaliacoesPendentes = await buscarAvaliacoesPendentesUsuario(filtros.usuarioId);
    } else {
      // Apenas admins e gestores podem ver todas as avaliações
      if (!isAdmin && !isGestor) {
        return NextResponse.json(
          { error: 'Sem permissão para acessar todas as notificações' },
          { status: 403 }
        );
      }
      avaliacoesPendentes = await buscarTodasAvaliacoesPendentes();
    }

    // Aplicar filtros adicionais
    if (filtros.diasAntecedencia !== undefined) {
      avaliacoesPendentes = avaliacoesPendentes.filter(
        avaliacao => avaliacao.diasRestantes <= filtros.diasAntecedencia!
      );
    }

    if (filtros.urgencias && filtros.urgencias.length > 0) {
      avaliacoesPendentes = avaliacoesPendentes.filter(
        avaliacao => filtros.urgencias!.includes(avaliacao.urgencia)
      );
    }

    if (!filtros.incluirVencidas) {
      avaliacoesPendentes = avaliacoesPendentes.filter(
        avaliacao => avaliacao.diasRestantes >= 0
      );
    }

    // Ordenar resultados
    switch (filtros.ordenacao) {
      case 'dataLimite':
        avaliacoesPendentes.sort((a, b) => 
          a.dataLimite.getTime() - b.dataLimite.getTime()
        );
        break;
      case 'urgencia':
        const ordemUrgencia = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
        avaliacoesPendentes.sort((a, b) => 
          ordemUrgencia[a.urgencia] - ordemUrgencia[b.urgencia]
        );
        break;
      case 'criadaEm':
        avaliacoesPendentes.sort((a, b) => 
          b.criadaEm.getTime() - a.criadaEm.getTime()
        );
        break;
    }

    // Aplicar limite
    if (filtros.limite) {
      avaliacoesPendentes = avaliacoesPendentes.slice(0, filtros.limite);
    }

    // Gerar estatísticas se solicitado
    let estatisticas = null;
    if (filtros.incluirEstatisticas) {
      if (filtros.usuarioId) {
        estatisticas = await gerarEstatisticasNotificacoes(filtros.usuarioId);
      } else if (filtros.usuariosIds && filtros.usuariosIds.length === 1) {
        estatisticas = await gerarEstatisticasNotificacoes(filtros.usuariosIds[0]);
      } else {
        estatisticas = await gerarEstatisticasNotificacoes();
      }
    }

    return NextResponse.json({
      avaliacoesPendentes,
      estatisticas,
      filtros,
      total: avaliacoesPendentes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar notificações de avaliações (POST):', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}