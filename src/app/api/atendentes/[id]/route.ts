import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  idAtendenteSchema,
  atualizarAtendenteSchema,
  MENSAGENS_ERRO_ATENDENTES,
  validacaoAtendentes,
} from '@/lib/validations/atendentes';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/atendentes/[id]
 * Busca um atendente específico por ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões
    if (!['ADMIN', 'GERENTE', 'ATENDENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar ID
    const atendenteId = idAtendenteSchema.parse(params.id);

    // Buscar atendente
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
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
        documentos: {
          select: {
            id: true,
            tipo: true,
            numero: true,
            dataEmissao: true,
            orgaoEmissor: true,
            arquivo: true,
            criadoEm: true,
          },
          orderBy: {
            criadoEm: 'desc',
          },
        },
        historicoAlteracoes: {
          select: {
            id: true,
            tipo: true,
            descricao: true,
            dadosAnteriores: true,
            dadosNovos: true,
            criadoEm: true,
            criadoPorId: true,
          },
          orderBy: {
            criadoEm: 'desc',
          },
          take: 10, // Últimas 10 alterações
        },
        _count: {
          select: {
            documentos: true,
            historicoAlteracoes: true,
          },
        },
      },
    });

    if (!atendente) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Verificar se o atendente pode ver apenas seus próprios dados
    if (
      session.user.userType === 'ATENDENTE' &&
      atendente.usuarioId !== session.user.id
    ) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Calcular estatísticas adicionais
    const idade = atendente.dataNascimento
      ? validacaoAtendentes.calcularIdade(atendente.dataNascimento)
      : null;

    const tempoEmpresa = validacaoAtendentes.calcularTempoEmpresa(
      atendente.dataAdmissao
    );

    return NextResponse.json({
      atendente: {
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
        documentos: atendente.documentos,
        historicoAlteracoes: atendente.historicoAlteracoes,
        estatisticas: {
          idade,
          tempoEmpresaMeses: tempoEmpresa,
          totalDocumentos: atendente._count.documentos,
          totalAlteracoes: atendente._count.historicoAlteracoes,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar atendente:', error);

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
 * PUT /api/atendentes/[id]
 * Atualiza um atendente específico
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN e GERENTE podem atualizar)
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar ID
    const atendenteId = idAtendenteSchema.parse(params.id);

    // Extrair dados do corpo da requisição
    const dadosRequisicao = await request.json();

    // Validar dados
    const dadosValidados = atualizarAtendenteSchema.parse(dadosRequisicao);

    // Verificar se o atendente existe
    const atendenteExistente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      include: {
        usuario: true,
      },
    });

    if (!atendenteExistente) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {};
    const dadosAnteriores: any = {};
    const dadosNovos: any = {};

    // Mapear campos que podem ser atualizados
    const camposPermitidos = [
      'rg',
      'dataNascimento',
      'telefone',
      'celular',
      'endereco',
      'cep',
      'cidade',
      'estado',
      'dataAdmissao',
      'cargo',
      'setor',
      'departamento',
      'salario',
      'status',
      'observacoes',
      'foto',
    ];

    for (const campo of camposPermitidos) {
      if (dadosValidados[campo] !== undefined) {
        // Armazenar valor anterior
        dadosAnteriores[campo] = atendenteExistente[campo];

        // Preparar novo valor
        let novoValor = dadosValidados[campo];

        // Converter datas se necessário
        if (['dataNascimento', 'dataAdmissao'].includes(campo) && novoValor) {
          novoValor = new Date(novoValor);
        }

        dadosAtualizacao[campo] = novoValor;
        dadosNovos[campo] = novoValor;
      }
    }

    // Se não há dados para atualizar
    if (Object.keys(dadosAtualizacao).length === 0) {
      return NextResponse.json(
        { erro: 'Nenhum dado válido fornecido para atualização' },
        { status: 400 }
      );
    }

    // Atualizar atendente em uma transação
    const atendenteAtualizado = await prisma.$transaction(async tx => {
      // Atualizar dados do atendente
      const atendente = await tx.atendente.update({
        where: { id: atendenteId },
        data: dadosAtualizacao,
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
          atendenteId: atendenteId,
          tipo: 'ATUALIZACAO',
          descricao: `Dados do atendente atualizados: ${Object.keys(dadosNovos).join(', ')}`,
          dadosAnteriores: JSON.stringify(dadosAnteriores),
          dadosNovos: JSON.stringify(dadosNovos),
          criadoPorId: session.user.id,
        },
      });

      return atendente;
    });

    return NextResponse.json({
      mensagem: 'Atendente atualizado com sucesso',
      atendente: {
        id: atendenteAtualizado.id,
        cpf: atendenteAtualizado.cpf,
        rg: atendenteAtualizado.rg,
        dataNascimento: atendenteAtualizado.dataNascimento,
        telefone: atendenteAtualizado.telefone,
        celular: atendenteAtualizado.celular,
        endereco: atendenteAtualizado.endereco,
        cep: atendenteAtualizado.cep,
        cidade: atendenteAtualizado.cidade,
        estado: atendenteAtualizado.estado,
        dataAdmissao: atendenteAtualizado.dataAdmissao,
        cargo: atendenteAtualizado.cargo,
        setor: atendenteAtualizado.setor,
        departamento: atendenteAtualizado.departamento,
        salario: atendenteAtualizado.salario,
        status: atendenteAtualizado.status,
        observacoes: atendenteAtualizado.observacoes,
        foto: atendenteAtualizado.foto,
        criadoEm: atendenteAtualizado.criadoEm,
        atualizadoEm: atendenteAtualizado.atualizadoEm,
        usuario: atendenteAtualizado.usuario,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar atendente:', error);

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
 * DELETE /api/atendentes/[id]
 * Remove um atendente (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN pode deletar)
    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar ID
    const atendenteId = idAtendenteSchema.parse(params.id);

    // Verificar se o atendente existe
    const atendenteExistente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      include: {
        usuario: true,
      },
    });

    if (!atendenteExistente) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Realizar soft delete em uma transação
    await prisma.$transaction(async tx => {
      // Desativar usuário relacionado
      await tx.usuario.update({
        where: { id: atendenteExistente.usuarioId },
        data: { ativo: false },
      });

      // Atualizar status do atendente para INATIVO
      await tx.atendente.update({
        where: { id: atendenteId },
        data: { status: 'INATIVO' },
      });

      // Registrar no histórico de alterações
      await tx.historicoAlteracaoAtendente.create({
        data: {
          atendenteId: atendenteId,
          tipo: 'EXCLUSAO',
          descricao: 'Atendente removido do sistema (soft delete)',
          dadosAnteriores: JSON.stringify({
            status: atendenteExistente.status,
            usuarioAtivo: atendenteExistente.usuario.ativo,
          }),
          dadosNovos: JSON.stringify({
            status: 'INATIVO',
            usuarioAtivo: false,
          }),
          criadoPorId: session.user.id,
        },
      });
    });

    return NextResponse.json({
      mensagem: 'Atendente removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover atendente:', error);

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
