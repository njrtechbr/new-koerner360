import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verificarAutenticacao } from '@/lib/auth';
import {
  filtrosRelatorioSchema,
  validarQueryParams
} from '@/lib/validations/avaliacoes';
import { TipoUsuario } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/avaliacoes/relatorios - Gerar relatórios de avaliações 360°
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const usuario = await verificarAutenticacao(request);
    if (!usuario) {
      return NextResponse.json(
        { erro: 'Token de acesso inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas ADMIN e GESTOR podem gerar relatórios)
    if (usuario.tipo !== TipoUsuario.ADMIN && usuario.tipo !== TipoUsuario.GESTOR) {
      return NextResponse.json(
        { erro: 'Acesso negado. Apenas administradores e gestores podem gerar relatórios' },
        { status: 403 }
      );
    }

    // Extrair e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const resultadoValidacao = validarQueryParams(filtrosRelatorioSchema, queryParams);
    if (!resultadoValidacao.sucesso) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros inválidos', 
          detalhes: resultadoValidacao.erro?.details 
        },
        { status: 400 }
      );
    }
    
    const filtros = resultadoValidacao.dados;

    // Construir filtros para a consulta
    const where: any = {};

    if (filtros.periodoId) {
      where.periodoId = filtros.periodoId;
    }

    if (filtros.avaliadoId) {
      where.avaliadoId = filtros.avaliadoId;
    }

    if (filtros.avaliadorId) {
      where.avaliadorId = filtros.avaliadorId;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      where.dataAvaliacao = {};
      if (filtros.dataInicio) {
        where.dataAvaliacao.gte = new Date(filtros.dataInicio);
      }
      if (filtros.dataFim) {
        where.dataAvaliacao.lte = new Date(filtros.dataFim);
      }
    }

    // Filtros por características do atendente
    if (filtros.setor || filtros.departamento || filtros.cargo) {
      where.avaliado = {};
      if (filtros.setor) {
        where.avaliado.setor = filtros.setor;
      }
      if (filtros.departamento) {
        where.avaliado.departamento = filtros.departamento;
      }
      if (filtros.cargo) {
        where.avaliado.cargo = filtros.cargo;
      }
    }

    // Gerar relatório baseado no formato solicitado
    switch (filtros.formato) {
      case 'estatisticas':
        return await gerarEstatisticas(where);
      case 'detalhado':
        return await gerarRelatorioDetalhado(where, filtros.incluirDetalhes);
      default:
        return await gerarRelatorioResumo(where);
    }

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para gerar estatísticas gerais
async function gerarEstatisticas(where: any) {
  const [totalAvaliacoes, avaliacoesPorStatus, mediaNota, avaliacoesPorPeriodo] = await Promise.all([
    // Total de avaliações
    prisma.avaliacao.count({ where }),
    
    // Avaliações por status
    prisma.avaliacao.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    }),
    
    // Média geral das notas
    prisma.avaliacao.aggregate({
      where: {
        ...where,
        nota: { not: null }
      },
      _avg: {
        nota: true
      }
    }),
    
    // Avaliações por período
    prisma.avaliacao.groupBy({
      by: ['periodoId'],
      where,
      _count: {
        id: true
      },
      _avg: {
        nota: true
      }
    })
  ]);

  // Buscar informações dos períodos
  const periodosInfo = await prisma.periodoAvaliacao.findMany({
    where: {
      id: {
        in: avaliacoesPorPeriodo.map(p => p.periodoId)
      }
    },
    select: {
      id: true,
      nome: true,
      dataInicio: true,
      dataFim: true
    }
  });

  const estatisticas = {
    totalAvaliacoes,
    mediaNota: mediaNota._avg.nota || 0,
    distribuicaoStatus: avaliacoesPorStatus.map(item => ({
      status: item.status,
      quantidade: item._count.id
    })),
    avaliacoesPorPeriodo: avaliacoesPorPeriodo.map(item => {
      const periodo = periodosInfo.find(p => p.id === item.periodoId);
      return {
        periodoId: item.periodoId,
        nomePeriodo: periodo?.nome || 'Período não encontrado',
        dataInicio: periodo?.dataInicio,
        dataFim: periodo?.dataFim,
        quantidade: item._count.id,
        mediaNota: item._avg.nota || 0
      };
    })
  };

  return NextResponse.json({ estatisticas });
}

// Função para gerar relatório resumido
async function gerarRelatorioResumo(where: any) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where,
    select: {
      id: true,
      nota: true,
      status: true,
      dataAvaliacao: true,
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
          usuario: {
            select: {
              nome: true,
              email: true
            }
          },
          cargo: true,
          setor: true,
          departamento: true
        }
      },
      periodo: {
        select: {
          id: true,
          nome: true
        }
      }
    },
    orderBy: {
      dataAvaliacao: 'desc'
    }
  });

  const resumo = {
    totalAvaliacoes: avaliacoes.length,
    avaliacoes: avaliacoes.map(avaliacao => ({
      id: avaliacao.id,
      nota: avaliacao.nota,
      status: avaliacao.status,
      dataAvaliacao: avaliacao.dataAvaliacao,
      avaliador: avaliacao.avaliador.nome,
      avaliado: avaliacao.avaliado.usuario.nome,
      cargo: avaliacao.avaliado.cargo,
      setor: avaliacao.avaliado.setor,
      periodo: avaliacao.periodo.nome
    }))
  };

  return NextResponse.json({ resumo });
}

// Função para gerar relatório detalhado
async function gerarRelatorioDetalhado(where: any, incluirDetalhes: boolean) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where,
    include: {
      avaliador: {
        select: {
          id: true,
          nome: true,
          email: true,
          userType: true
        }
      },
      avaliado: {
        select: {
          id: true,
          usuario: {
            select: {
              nome: true,
              email: true
            }
          },
          cargo: true,
          setor: true,
          departamento: true,
          dataAdmissao: true,
          status: true
        }
      },
      periodo: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          dataInicio: true,
          dataFim: true,
          status: true
        }
      }
    },
    orderBy: [
      { periodo: { dataInicio: 'desc' } },
      { avaliado: { usuario: { nome: 'asc' } } }
    ]
  });

  // Agrupar por avaliado para análise
  const avaliadosMap = new Map();
  
  avaliacoes.forEach(avaliacao => {
    const avaliadoId = avaliacao.avaliadoId;
    if (!avaliadosMap.has(avaliadoId)) {
      avaliadosMap.set(avaliadoId, {
        avaliado: avaliacao.avaliado,
        avaliacoes: [],
        estatisticas: {
          totalAvaliacoes: 0,
          mediaNota: 0,
          notaMinima: null,
          notaMaxima: null,
          distribuicaoNotas: {}
        }
      });
    }
    
    const dados = avaliadosMap.get(avaliadoId);
    dados.avaliacoes.push({
      id: avaliacao.id,
      nota: avaliacao.nota,
      comentario: incluirDetalhes ? avaliacao.comentario : null,
      status: avaliacao.status,
      dataAvaliacao: avaliacao.dataAvaliacao,
      avaliador: avaliacao.avaliador,
      periodo: avaliacao.periodo
    });
  });

  // Calcular estatísticas para cada avaliado
  const relatorioDetalhado = Array.from(avaliadosMap.values()).map(dados => {
    const notas = dados.avaliacoes
      .filter(a => a.nota !== null)
      .map(a => a.nota);
    
    if (notas.length > 0) {
      dados.estatisticas.totalAvaliacoes = dados.avaliacoes.length;
      dados.estatisticas.mediaNota = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
      dados.estatisticas.notaMinima = Math.min(...notas);
      dados.estatisticas.notaMaxima = Math.max(...notas);
      
      // Distribuição de notas
      const distribuicao = {};
      notas.forEach(nota => {
        distribuicao[nota] = (distribuicao[nota] || 0) + 1;
      });
      dados.estatisticas.distribuicaoNotas = distribuicao;
    }
    
    return dados;
  });

  return NextResponse.json({ relatorioDetalhado });
}