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
import { saveFile, deleteFile, validateFile } from '@/lib/upload';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Schema para validação de documento
 */
const criarDocumentoSchema = z.object({
  tipo: z.enum([
    'RG',
    'CPF',
    'CNH',
    'CTPS',
    'TITULO_ELEITOR',
    'CERTIFICADO',
    'DIPLOMA',
    'OUTRO',
  ]),
  numero: z
    .string()
    .min(1, 'Número do documento é obrigatório')
    .max(50, 'Número deve ter no máximo 50 caracteres'),
  dataEmissao: z
    .string()
    .datetime('Data de emissão deve ser uma data válida')
    .optional(),
  orgaoEmissor: z
    .string()
    .max(100, 'Órgão emissor deve ter no máximo 100 caracteres')
    .optional(),
  arquivo: z.string().url('URL do arquivo deve ser válida').optional(),
  nomeArquivo: z.string().optional(),
  tamanhoArquivo: z.number().optional(),
  tipoMime: z.string().optional(),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});

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
  nomeArquivo: z.string().optional(),
  tamanhoArquivo: z.number().optional(),
  tipoMime: z.string().optional(),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});

/**
 * GET /api/atendentes/[id]/documentos
 * Lista documentos de um atendente
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

    // Buscar documentos
    const documentos = await prisma.documentoAtendente.findMany({
      where: { atendenteId },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return NextResponse.json({
      documentos: documentos.map(doc => ({
        id: doc.id,
        tipo: doc.tipo,
        numero: doc.numero,
        dataEmissao: doc.dataEmissao,
        orgaoEmissor: doc.orgaoEmissor,
        arquivo: doc.arquivo,
        observacoes: doc.observacoes,
        criadoEm: doc.criadoEm,
        atualizadoEm: doc.atualizadoEm,
      })),
    });
  } catch (error) {
    console.error('Erro ao listar documentos do atendente:', error);

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
 * POST /api/atendentes/[id]/documentos
 * Adiciona um novo documento ao atendente
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN e GERENTE podem adicionar documentos)
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Validar ID
    const atendenteId = idAtendenteSchema.parse(params.id);

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

    // Extrair dados do corpo da requisição
    const dadosRequisicao = await request.json();

    // Validar dados
    const dadosValidados = criarDocumentoSchema.parse(dadosRequisicao);

    // Verificar se já existe um documento do mesmo tipo e número
    const documentoExistente = await prisma.documentoAtendente.findFirst({
      where: {
        atendenteId,
        tipo: dadosValidados.tipo,
        numero: dadosValidados.numero,
      },
    });

    if (documentoExistente) {
      return NextResponse.json(
        {
          erro: `Documento ${dadosValidados.tipo} com número ${dadosValidados.numero} já existe para este atendente`,
        },
        { status: 409 }
      );
    }

    // Criar documento
    const novoDocumento = await prisma.documentoAtendente.create({
      data: {
        atendenteId,
        tipo: dadosValidados.tipo,
        numero: dadosValidados.numero,
        dataEmissao: dadosValidados.dataEmissao
          ? new Date(dadosValidados.dataEmissao)
          : null,
        orgaoEmissor: dadosValidados.orgaoEmissor,
        arquivo: dadosValidados.arquivo,
        nomeArquivo: dadosValidados.nomeArquivo,
        tamanhoArquivo: dadosValidados.tamanhoArquivo,
        tipoMime: dadosValidados.tipoMime,
        observacoes: dadosValidados.observacoes,
      },
    });

    // Registrar no histórico de alterações
    await prisma.historicoAlteracaoAtendente.create({
      data: {
        atendenteId,
        tipo: 'UPLOAD_DOCUMENTO',
        descricao: `Documento ${novoDocumento.tipo} foi adicionado`,
        valorNovo: JSON.stringify({
          documentoId: novoDocumento.id,
          tipo: novoDocumento.tipo,
          numero: novoDocumento.numero,
        }),
        criadoPorId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        mensagem: 'Documento adicionado com sucesso',
        documento: {
          id: novoDocumento.id,
          tipo: novoDocumento.tipo,
          numero: novoDocumento.numero,
          dataEmissao: novoDocumento.dataEmissao,
          orgaoEmissor: novoDocumento.orgaoEmissor,
          arquivo: novoDocumento.arquivo,
          observacoes: novoDocumento.observacoes,
          criadoEm: novoDocumento.criadoEm,
          atualizadoEm: novoDocumento.atualizadoEm,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao adicionar documento do atendente:', error);

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
