import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { obterAgendadorLembretes } from '@/lib/services/agendador-lembretes';
import { z } from 'zod';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Schema de validação para filtros de lembretes
const filtrosLembretesSchema = z.object({
  usuarioId: z.string().optional(),
  avaliacaoId: z.string().optional(),
  tipo: z.enum(['lembrete', 'vencimento']).optional(),
  enviado: z.boolean().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  limite: z.number().min(1).max(100).default(50),
  pagina: z.number().min(1).default(1),
});

// Schema para criação de lembrete manual
const criarLembreteSchema = z.object({
  avaliacaoId: z.string(),
  usuarioId: z.string(),
  tipo: z.enum(['lembrete', 'vencimento']),
  dataEnvio: z.string(),
  observacoes: z.string().optional(),
});

/**
 * GET /api/lembretes
 * Busca lembretes com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const filtros = {
      usuarioId: searchParams.get('usuarioId') || undefined,
      avaliacaoId: searchParams.get('avaliacaoId') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      enviado: searchParams.get('enviado') ? searchParams.get('enviado') === 'true' : undefined,
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
      limite: parseInt(searchParams.get('limite') || '50'),
      pagina: parseInt(searchParams.get('pagina') || '1'),
    };

    // Validar filtros
    const filtrosValidados = filtrosLembretesSchema.parse(filtros);

    // Verificar permissões
    const podeVerTodos = ['ADMIN', 'GESTOR'].includes(session.user.papel);
    if (!podeVerTodos && filtrosValidados.usuarioId !== session.user.id) {
      // Usuários comuns só podem ver seus próprios lembretes
      filtrosValidados.usuarioId = session.user.id;
    }

    // Construir filtros do Prisma
    const where: any = {};
    
    if (filtrosValidados.usuarioId) {
      where.usuarioId = filtrosValidados.usuarioId;
    }
    
    if (filtrosValidados.avaliacaoId) {
      where.avaliacaoId = filtrosValidados.avaliacaoId;
    }
    
    if (filtrosValidados.tipo) {
      where.tipo = filtrosValidados.tipo;
    }
    
    if (filtrosValidados.enviado !== undefined) {
      where.enviado = filtrosValidados.enviado;
    }
    
    if (filtrosValidados.dataInicio || filtrosValidados.dataFim) {
      where.dataEnvio = {};
      if (filtrosValidados.dataInicio) {
        where.dataEnvio.gte = startOfDay(new Date(filtrosValidados.dataInicio));
      }
      if (filtrosValidados.dataFim) {
        where.dataEnvio.lte = endOfDay(new Date(filtrosValidados.dataFim));
      }
    }

    // Calcular offset para paginação
    const offset = (filtrosValidados.pagina - 1) * filtrosValidados.limite;

    // Buscar lembretes
    const [lembretes, total] = await Promise.all([
      prisma.lembreteAgendado.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          avaliacao: {
            select: {
              id: true,
              prazo: true,
              status: true,
              avaliado: {
                select: {
                  nome: true,
                  cargo: true,
                },
              },
              periodo: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
        orderBy: {
          dataEnvio: 'desc',
        },
        skip: offset,
        take: filtrosValidados.limite,
      }),
      prisma.lembreteAgendado.count({ where }),
    ]);

    // Calcular informações de paginação
    const totalPaginas = Math.ceil(total / filtrosValidados.limite);
    const temProximaPagina = filtrosValidados.pagina < totalPaginas;
    const temPaginaAnterior = filtrosValidados.pagina > 1;

    return NextResponse.json({
      sucesso: true,
      dados: lembretes,
      paginacao: {
        paginaAtual: filtrosValidados.pagina,
        totalPaginas,
        totalItens: total,
        itensPorPagina: filtrosValidados.limite,
        temProximaPagina,
        temPaginaAnterior,
      },
    });

  } catch (error) {
    console.error('Erro ao buscar lembretes:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros inválidos',
          detalhes: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lembretes
 * Cria um lembrete manual
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem criar lembretes.' },
        { status: 403 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();
    const dadosValidados = criarLembreteSchema.parse(body);

    // Verificar se a avaliação existe
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: dadosValidados.avaliacaoId },
      include: {
        avaliador: true,
        avaliado: true,
      },
    });

    if (!avaliacao) {
      return NextResponse.json(
        { erro: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: dadosValidados.usuarioId },
    });

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe um lembrete similar
    const dataEnvio = new Date(dadosValidados.dataEnvio);
    const lembreteExistente = await prisma.lembreteAgendado.findFirst({
      where: {
        avaliacaoId: dadosValidados.avaliacaoId,
        usuarioId: dadosValidados.usuarioId,
        tipo: dadosValidados.tipo,
        dataEnvio: {
          gte: startOfDay(dataEnvio),
          lte: endOfDay(dataEnvio),
        },
      },
    });

    if (lembreteExistente) {
      return NextResponse.json(
        { erro: 'Já existe um lembrete similar agendado para esta data' },
        { status: 409 }
      );
    }

    // Criar o lembrete
    const novoLembrete = await prisma.lembreteAgendado.create({
      data: {
        avaliacaoId: dadosValidados.avaliacaoId,
        usuarioId: dadosValidados.usuarioId,
        tipo: dadosValidados.tipo,
        dataEnvio,
        enviado: false,
        tentativas: 0,
        observacoes: dadosValidados.observacoes,
        criadoPor: session.user.id,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        avaliacao: {
          select: {
            id: true,
            prazo: true,
            status: true,
            avaliado: {
              select: {
                nome: true,
                cargo: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Lembrete criado com sucesso',
      dados: novoLembrete,
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erro: 'Dados inválidos',
          detalhes: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lembretes
 * Remove lembretes em lote
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR)
    if (!['ADMIN', 'GESTOR'].includes(session.user.papel)) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem remover lembretes.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const acao = searchParams.get('acao');
    const ids = searchParams.get('ids')?.split(',') || [];
    const usuarioId = searchParams.get('usuarioId');
    const avaliacaoId = searchParams.get('avaliacaoId');

    let resultado: any = {};
    let where: any = {};

    switch (acao) {
      case 'ids':
        if (ids.length === 0) {
          return NextResponse.json(
            { erro: 'IDs dos lembretes são obrigatórios' },
            { status: 400 }
          );
        }
        where.id = { in: ids };
        break;

      case 'usuario':
        if (!usuarioId) {
          return NextResponse.json(
            { erro: 'ID do usuário é obrigatório' },
            { status: 400 }
          );
        }
        where.usuarioId = usuarioId;
        where.enviado = false; // Só remove lembretes não enviados
        break;

      case 'avaliacao':
        if (!avaliacaoId) {
          return NextResponse.json(
            { erro: 'ID da avaliação é obrigatório' },
            { status: 400 }
          );
        }
        where.avaliacaoId = avaliacaoId;
        where.enviado = false; // Só remove lembretes não enviados
        break;

      case 'nao_enviados':
        where.enviado = false;
        where.dataEnvio = {
          lt: new Date(), // Lembretes não enviados que já passaram da data
        };
        break;

      default:
        return NextResponse.json(
          { erro: 'Ação de remoção não especificada ou inválida' },
          { status: 400 }
        );
    }

    // Contar lembretes que serão removidos
    const totalParaRemover = await prisma.lembreteAgendado.count({ where });

    if (totalParaRemover === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Nenhum lembrete encontrado para remoção',
        removidos: 0,
      });
    }

    // Remover lembretes
    const resultadoRemocao = await prisma.lembreteAgendado.deleteMany({ where });

    return NextResponse.json({
      sucesso: true,
      mensagem: `${resultadoRemocao.count} lembrete(s) removido(s) com sucesso`,
      removidos: resultadoRemocao.count,
    });

  } catch (error) {
    console.error('Erro ao remover lembretes:', error);
    return NextResponse.json(
      { 
        erro: 'Erro interno do servidor',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}