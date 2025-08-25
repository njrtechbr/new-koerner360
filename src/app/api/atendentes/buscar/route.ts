import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buscarAtendentesSchema,
  MENSAGENS_ERRO_ATENDENTES,
  validacaoAtendentes,
} from '@/lib/validations/atendentes';
import { ZodError } from 'zod';

/**
 * POST /api/atendentes/buscar
 * Busca avançada de atendentes com filtros complexos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Extrair dados do corpo da requisição
    const dadosRequisicao = await request.json();

    // Validar parâmetros
    const parametrosValidados = buscarAtendentesSchema.parse(dadosRequisicao);

    const {
      pagina,
      limite,
      busca,
      status,
      setor,
      cargo,
      departamento,
      dataAdmissaoInicio,
      dataAdmissaoFim,
      ordenarPor,
      ordem,
      filtrosAvancados,
    } = parametrosValidados;

    // Construir filtros básicos
    const filtros: any = {};

    // Filtro de busca (nome, CPF, email)
    if (busca) {
      filtros.OR = [
        {
          usuario: {
            nome: {
              contains: busca,
              mode: 'insensitive',
            },
          },
        },
        {
          cpf: {
            contains: busca.replace(/\D/g, ''),
          },
        },
        {
          usuario: {
            email: {
              contains: busca,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Filtros específicos
    if (status) {
      filtros.status = status;
    }

    if (setor) {
      filtros.setor = {
        contains: setor,
        mode: 'insensitive',
      };
    }

    if (cargo) {
      filtros.cargo = {
        contains: cargo,
        mode: 'insensitive',
      };
    }

    if (departamento) {
      filtros.departamento = {
        contains: departamento,
        mode: 'insensitive',
      };
    }

    // Filtro de data de admissão
    if (dataAdmissaoInicio || dataAdmissaoFim) {
      filtros.dataAdmissao = {};
      if (dataAdmissaoInicio) {
        filtros.dataAdmissao.gte = new Date(dataAdmissaoInicio);
      }
      if (dataAdmissaoFim) {
        filtros.dataAdmissao.lte = new Date(dataAdmissaoFim);
      }
    }

    // Aplicar filtros avançados
    if (filtrosAvancados) {
      // Filtro de usuário ativo
      if (filtrosAvancados.ativo !== undefined) {
        filtros.usuario = {
          ...filtros.usuario,
          ativo: filtrosAvancados.ativo,
        };
      }

      // Filtro de foto
      if (filtrosAvancados.temFoto !== undefined) {
        if (filtrosAvancados.temFoto) {
          filtros.foto = { not: null };
        } else {
          filtros.foto = null;
        }
      }

      // Filtro de salário
      if (filtrosAvancados.salarioMinimo || filtrosAvancados.salarioMaximo) {
        filtros.salario = {};
        if (filtrosAvancados.salarioMinimo) {
          filtros.salario.gte = filtrosAvancados.salarioMinimo;
        }
        if (filtrosAvancados.salarioMaximo) {
          filtros.salario.lte = filtrosAvancados.salarioMaximo;
        }
      }

      // Filtros de idade e tempo de empresa serão aplicados após a busca
      // pois requerem cálculos que não podem ser feitos diretamente no Prisma
    }

    // Configurar ordenação
    const ordenacao: any = {};
    if (ordenarPor === 'nome') {
      ordenacao.usuario = { nome: ordem };
    } else {
      ordenacao[ordenarPor] = ordem;
    }

    // Calcular offset
    const offset = (pagina - 1) * limite;

    // Buscar atendentes
    const [atendentes, total] = await Promise.all([
      prisma.atendente.findMany({
        where: filtros,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true,
              criadoEm: true,
              atualizadoEm: true,
            },
          },
          _count: {
            select: {
              documentos: true,
              historicoAlteracoes: true,
            },
          },
        },
        orderBy: ordenacao,
        skip: offset,
        take: limite * 2, // Buscar mais para aplicar filtros de idade/tempo
      }),
      prisma.atendente.count({ where: filtros }),
    ]);

    // Aplicar filtros de idade e tempo de empresa
    let atendentesFiltrados = atendentes;

    if (filtrosAvancados) {
      atendentesFiltrados = atendentes.filter(atendente => {
        // Filtro de idade
        if (filtrosAvancados.idadeMinima || filtrosAvancados.idadeMaxima) {
          if (!atendente.dataNascimento) return false;

          const idade = validacaoAtendentes.calcularIdade(
            atendente.dataNascimento
          );

          if (
            filtrosAvancados.idadeMinima &&
            idade < filtrosAvancados.idadeMinima
          ) {
            return false;
          }

          if (
            filtrosAvancados.idadeMaxima &&
            idade > filtrosAvancados.idadeMaxima
          ) {
            return false;
          }
        }

        // Filtro de tempo de empresa
        if (
          filtrosAvancados.tempoEmpresaMinimo ||
          filtrosAvancados.tempoEmpresaMaximo
        ) {
          const tempoEmpresa = validacaoAtendentes.calcularTempoEmpresa(
            atendente.dataAdmissao
          );

          if (
            filtrosAvancados.tempoEmpresaMinimo &&
            tempoEmpresa < filtrosAvancados.tempoEmpresaMinimo
          ) {
            return false;
          }

          if (
            filtrosAvancados.tempoEmpresaMaximo &&
            tempoEmpresa > filtrosAvancados.tempoEmpresaMaximo
          ) {
            return false;
          }
        }

        return true;
      });
    }

    // Aplicar paginação aos resultados filtrados
    const atendentesPaginados = atendentesFiltrados.slice(0, limite);
    const totalFiltrado = atendentesFiltrados.length;

    // Calcular metadados de paginação
    const totalPaginas = Math.ceil(totalFiltrado / limite);
    const temProximaPagina = pagina < totalPaginas;
    const temPaginaAnterior = pagina > 1;

    // Preparar resposta com estatísticas adicionais
    const atendentesComEstatisticas = atendentesPaginados.map(atendente => {
      const idade = atendente.dataNascimento
        ? validacaoAtendentes.calcularIdade(atendente.dataNascimento)
        : null;

      const tempoEmpresa = validacaoAtendentes.calcularTempoEmpresa(
        atendente.dataAdmissao
      );

      return {
        id: atendente.id,
        cpf: atendente.cpf,
        rg: atendente.rg,
        dataNascimento: atendente.dataNascimento,
        telefone: atendente.telefone,
        celular: atendente.celular,
        endereco: atendente.endereco,
        cep: atendente.cep,
        cidade: atendente.cidade,
        estado: atendente.estado,
        dataAdmissao: atendente.dataAdmissao,
        cargo: atendente.cargo,
        setor: atendente.setor,
        departamento: atendente.departamento,
        salario: atendente.salario,
        status: atendente.status,
        observacoes: atendente.observacoes,
        foto: atendente.foto,
        criadoEm: atendente.criadoEm,
        atualizadoEm: atendente.atualizadoEm,
        usuario: atendente.usuario,
        estatisticas: {
          idade,
          tempoEmpresaMeses: tempoEmpresa,
          totalDocumentos: atendente._count.documentos,
          totalAlteracoes: atendente._count.historicoAlteracoes,
        },
      };
    });

    return NextResponse.json({
      atendentes: atendentesComEstatisticas,
      paginacao: {
        paginaAtual: pagina,
        totalPaginas,
        totalItens: totalFiltrado,
        itensPorPagina: limite,
        temProximaPagina,
        temPaginaAnterior,
      },
      filtrosAplicados: {
        basicos: {
          busca,
          status,
          setor,
          cargo,
          departamento,
          dataAdmissaoInicio,
          dataAdmissaoFim,
        },
        avancados: filtrosAvancados,
      },
      estatisticasBusca: {
        totalEncontrados: totalFiltrado,
        totalGeral: total,
        percentualFiltrado:
          total > 0 ? Math.round((totalFiltrado / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Erro na busca avançada de atendentes:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          erro: MENSAGENS_ERRO_ATENDENTES.DADOS_INVALIDOS,
          detalhes: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: MENSAGENS_ERRO_ATENDENTES.ERRO_INTERNO },
      { status: 500 }
    );
  }
}
