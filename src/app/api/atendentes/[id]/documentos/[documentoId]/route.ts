import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  idAtendenteSchema,
  MENSAGENS_ERRO_ATENDENTES,
} from '@/lib/validations/atendentes';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
    documentoId: string;
  };
}

/**
 * Schema para validação de ID de documento
 */
const idDocumentoSchema = z
  .string()
  .uuid('ID do documento deve ser um UUID válido');

/**
 * Schema para atualização de documento
 */
const atualizarDocumentoSchema = z.object({
  tipo: z
    .enum([
      'RG',
      'CPF',
      'CNH',
      'CTPS',
      'TITULO_ELEITOR',
      'CERTIFICADO',
      'DIPLOMA',
      'OUTRO',
    ])
    .optional(),
  numero: z
    .string()
    .min(1, 'Número do documento é obrigatório')
    .max(50, 'Número deve ter no máximo 50 caracteres')
    .optional(),
  dataEmissao: z
    .string()
    .datetime('Data de emissão deve ser uma data válida')
    .optional(),
  orgaoEmissor: z
    .string()
    .max(100, 'Órgão emissor deve ter no máximo 100 caracteres')
    .optional(),
  arquivo: z.string().url('URL do arquivo deve ser válida').optional(),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});

/**
 * GET /api/atendentes/[id]/documentos/[documentoId]
 * Busca um documento específico do atendente
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

    // Validar IDs
    const atendenteId = idAtendenteSchema.parse(params.id);
    const documentoId = idDocumentoSchema.parse(params.documentoId);

    // Verificar se o atendente existe
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      select: { id: true, usuarioId: true },
    });

    if (!atendente) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Verificar se o atendente pode ver apenas seus próprios documentos
    if (
      session.user.userType === 'ATENDENTE' &&
      atendente.usuarioId !== session.user.id
    ) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Buscar documento
    const documento = await prisma.documentoAtendente.findFirst({
      where: {
        id: documentoId,
        atendenteId,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { erro: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documento: {
        id: documento.id,
        tipo: documento.tipo,
        numero: documento.numero,
        dataEmissao: documento.dataEmissao,
        orgaoEmissor: documento.orgaoEmissor,
        arquivo: documento.arquivo,
        observacoes: documento.observacoes,
        criadoEm: documento.criadoEm,
        atualizadoEm: documento.atualizadoEm,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar documento do atendente:', error);

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
 * PUT /api/atendentes/[id]/documentos/[documentoId]
 * Atualiza um documento específico do atendente
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN e GERENTE podem atualizar documentos)
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar IDs
    const atendenteId = idAtendenteSchema.parse(params.id);
    const documentoId = idDocumentoSchema.parse(params.documentoId);

    // Verificar se o atendente existe
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      select: { id: true },
    });

    if (!atendente) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Buscar documento atual
    const documentoAtual = await prisma.documentoAtendente.findFirst({
      where: {
        id: documentoId,
        atendenteId,
      },
    });

    if (!documentoAtual) {
      return NextResponse.json(
        { erro: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Extrair dados do corpo da requisição
    const dadosRequisicao = await request.json();

    // Validar dados
    const dadosValidados = atualizarDocumentoSchema.parse(dadosRequisicao);

    // Verificar se há dados para atualizar
    if (Object.keys(dadosValidados).length === 0) {
      return NextResponse.json(
        { erro: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }

    // Verificar se já existe outro documento com o mesmo tipo e número (se estiver sendo alterado)
    if (dadosValidados.tipo || dadosValidados.numero) {
      const tipoVerificar = dadosValidados.tipo || documentoAtual.tipo;
      const numeroVerificar = dadosValidados.numero || documentoAtual.numero;

      const documentoExistente = await prisma.documentoAtendente.findFirst({
        where: {
          atendenteId,
          tipo: tipoVerificar,
          numero: numeroVerificar,
          id: { not: documentoId },
        },
      });

      if (documentoExistente) {
        return NextResponse.json(
          {
            erro: `Documento ${tipoVerificar} com número ${numeroVerificar} já existe para este atendente`,
          },
          { status: 409 }
        );
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {};

    if (dadosValidados.tipo) dadosAtualizacao.tipo = dadosValidados.tipo;
    if (dadosValidados.numero) dadosAtualizacao.numero = dadosValidados.numero;
    if (dadosValidados.dataEmissao !== undefined) {
      dadosAtualizacao.dataEmissao = dadosValidados.dataEmissao
        ? new Date(dadosValidados.dataEmissao)
        : null;
    }
    if (dadosValidados.orgaoEmissor !== undefined)
      dadosAtualizacao.orgaoEmissor = dadosValidados.orgaoEmissor;
    if (dadosValidados.arquivo !== undefined)
      dadosAtualizacao.arquivo = dadosValidados.arquivo;
    if (dadosValidados.observacoes !== undefined)
      dadosAtualizacao.observacoes = dadosValidados.observacoes;

    // Atualizar documento
    const documentoAtualizado = await prisma.documentoAtendente.update({
      where: { id: documentoId },
      data: dadosAtualizacao,
    });

    // Registrar no histórico de alterações
    await prisma.historicoAlteracaoAtendente.create({
      data: {
        atendenteId,
        tipo: 'ATUALIZACAO',
        campo: 'documento',
        descricao: `Documento ${documentoAtual.tipo} atualizado`,
        valorAnterior: JSON.stringify({
          documentoId: documentoAtual.id,
          tipo: documentoAtual.tipo,
          numero: documentoAtual.numero,
          dataEmissao: documentoAtual.dataEmissao,
          orgaoEmissor: documentoAtual.orgaoEmissor,
          arquivo: documentoAtual.arquivo,
          observacoes: documentoAtual.observacoes,
        }),
        valorNovo: JSON.stringify({
          documentoId: documentoAtualizado.id,
          tipo: documentoAtualizado.tipo,
          numero: documentoAtualizado.numero,
          dataEmissao: documentoAtualizado.dataEmissao,
          orgaoEmissor: documentoAtualizado.orgaoEmissor,
          arquivo: documentoAtualizado.arquivo,
          observacoes: documentoAtualizado.observacoes,
        }),
        criadoPorId: session.user.id,
      },
    });

    return NextResponse.json({
      mensagem: 'Documento atualizado com sucesso',
      documento: {
        id: documentoAtualizado.id,
        tipo: documentoAtualizado.tipo,
        numero: documentoAtualizado.numero,
        dataEmissao: documentoAtualizado.dataEmissao,
        orgaoEmissor: documentoAtualizado.orgaoEmissor,
        arquivo: documentoAtualizado.arquivo,
        observacoes: documentoAtualizado.observacoes,
        criadoEm: documentoAtualizado.criadoEm,
        atualizadoEm: documentoAtualizado.atualizadoEm,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar documento do atendente:', error);

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
 * DELETE /api/atendentes/[id]/documentos/[documentoId]
 * Remove um documento específico do atendente
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN pode remover documentos)
    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar IDs
    const atendenteId = idAtendenteSchema.parse(params.id);
    const documentoId = idDocumentoSchema.parse(params.documentoId);

    // Verificar se o atendente existe
    const atendente = await prisma.atendente.findUnique({
      where: { id: atendenteId },
      select: { id: true },
    });

    if (!atendente) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.ATENDENTE_NAO_ENCONTRADO },
        { status: 404 }
      );
    }

    // Buscar documento
    const documento = await prisma.documentoAtendente.findFirst({
      where: {
        id: documentoId,
        atendenteId,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { erro: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Remover documento
    await prisma.documentoAtendente.delete({
      where: { id: documentoId },
    });

    // Registrar no histórico de alterações
    await prisma.historicoAlteracaoAtendente.create({
      data: {
        atendenteId,
        tipo: 'REMOCAO_DOCUMENTO',
        descricao: `Documento ${documento.tipo} removido`,
        valorAnterior: JSON.stringify({
          documentoId: documento.id,
          tipo: documento.tipo,
          numero: documento.numero,
        }),
        criadoPorId: session.user.id,
      },
    });

    return NextResponse.json({
      mensagem: 'Documento removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover documento do atendente:', error);

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
