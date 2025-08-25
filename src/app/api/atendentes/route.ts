import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import {
  listarAtendentesSchema,
  criarAtendenteSchema,
  MENSAGENS_ERRO_ATENDENTES,
  validacaoAtendentes,
} from '@/lib/validations/atendentes';
import { ZodError } from 'zod';

/**
 * GET /api/atendentes
 * Lista atendentes com paginação e filtros
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN e GERENTE podem listar atendentes)
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Extrair parâmetros da query string
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validar parâmetros
    const parametrosValidados = listarAtendentesSchema.parse(queryParams);

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
    } = parametrosValidados;

    // Construir filtros
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
        take: limite,
      }),
      prisma.atendente.count({ where: filtros }),
    ]);

    // Calcular metadados de paginação
    const totalPaginas = Math.ceil(total / limite);
    const temProximaPagina = pagina < totalPaginas;
    const temPaginaAnterior = pagina > 1;

    return NextResponse.json({
      atendentes: atendentes.map(atendente => ({
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
          totalDocumentos: atendente._count.documentos,
          totalAlteracoes: atendente._count.historicoAlteracoes,
        },
      })),
      paginacao: {
        paginaAtual: pagina,
        totalPaginas,
        totalItens: total,
        itensPorPagina: limite,
        temProximaPagina,
        temPaginaAnterior,
      },
    });
  } catch (error) {
    console.error('Erro ao listar atendentes:', error);

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

/**
 * POST /api/atendentes
 * Cria um novo atendente
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN pode criar atendentes)
    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Extrair dados do corpo da requisição
    const dadosRequisicao = await request.json();

    // Validar dados
    const dadosValidados = criarAtendenteSchema.parse(dadosRequisicao);

    const { usuario: dadosUsuario, ...dadosAtendente } = dadosValidados;

    // Verificar se o email já existe
    const emailExiste = await validacaoAtendentes.validarEmailUnico(
      dadosUsuario.email
    );
    if (!emailExiste) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.EMAIL_JA_EXISTE },
        { status: 409 }
      );
    }

    // Verificar se o CPF já existe
    const cpfExiste = await validacaoAtendentes.validarCPFUnico(
      dadosAtendente.cpf
    );
    if (!cpfExiste) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.CPF_JA_EXISTE },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await hash(dadosUsuario.senha, 12);

    // Limpar CPF (remover formatação)
    const cpfLimpo = dadosAtendente.cpf.replace(/\D/g, '');

    // Criar usuário e atendente em uma transação
    const resultado = await prisma.$transaction(async tx => {
      // Criar usuário
      const novoUsuario = await tx.usuario.create({
        data: {
          nome: dadosUsuario.nome,
          email: dadosUsuario.email,
          senha: senhaHash,
          userType: 'ATENDENTE',
          ativo: true,
        },
      });

      // Criar atendente
      const novoAtendente = await tx.atendente.create({
        data: {
          usuarioId: novoUsuario.id,
          cpf: cpfLimpo,
          rg: dadosAtendente.rg,
          dataNascimento: dadosAtendente.dataNascimento
            ? new Date(dadosAtendente.dataNascimento)
            : null,
          telefone: dadosAtendente.telefone,
          celular: dadosAtendente.celular,
          endereco: dadosAtendente.endereco,
          cep: dadosAtendente.cep,
          cidade: dadosAtendente.cidade,
          estado: dadosAtendente.estado,
          dataAdmissao: new Date(dadosAtendente.dataAdmissao),
          cargo: dadosAtendente.cargo,
          setor: dadosAtendente.setor,
          departamento: dadosAtendente.departamento,
          salario: dadosAtendente.salario,
          status: dadosAtendente.status,
          observacoes: dadosAtendente.observacoes,
          foto: dadosAtendente.foto,
        },
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
        },
      });

      // Registrar no histórico de alterações
      await tx.historicoAlteracaoAtendente.create({
        data: {
          atendenteId: novoAtendente.id,
          tipo: 'CRIACAO',
          descricao: `Atendente ${dadosUsuario.nome} foi criado`,
          criadoEm: new Date(),
          criadoPorId: session.user.id,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        },
      });

      return novoAtendente;
    });

    return NextResponse.json(
      {
        mensagem: 'Atendente criado com sucesso',
        atendente: {
          id: resultado.id,
          cpf: resultado.cpf,
          rg: resultado.rg,
          dataNascimento: resultado.dataNascimento,
          telefone: resultado.telefone,
          celular: resultado.celular,
          endereco: resultado.endereco,
          cep: resultado.cep,
          cidade: resultado.cidade,
          estado: resultado.estado,
          dataAdmissao: resultado.dataAdmissao,
          cargo: resultado.cargo,
          setor: resultado.setor,
          departamento: resultado.departamento,
          salario: resultado.salario,
          status: resultado.status,
          observacoes: resultado.observacoes,
          foto: resultado.foto,
          criadoEm: resultado.criadoEm,
          atualizadoEm: resultado.atualizadoEm,
          usuario: resultado.usuario,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar atendente:', error);

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
