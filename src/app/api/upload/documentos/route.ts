import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveFile, validateFile, UPLOAD_CONFIG } from '@/lib/upload';
import { z } from 'zod';

/**
 * Schema para validação dos parâmetros de upload
 */
const uploadDocumentoSchema = z.object({
  atendenteId: z
    .string()
    .uuid('ID do atendente deve ser um UUID válido')
    .optional(),
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
  categoria: z.enum(['documento', 'foto']).default('documento'),
});

/**
 * POST /api/upload/documentos
 * Faz upload de documentos e fotos para atendentes
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
        { erro: 'Sem permissão para fazer upload de documentos' },
        { status: 403 }
      );
    }

    // Extrair dados do FormData
    const formData = await request.formData();
    const arquivo = formData.get('arquivo') as File;
    const atendenteId = formData.get('atendenteId') as string;
    const tipo = formData.get('tipo') as string;
    const categoria = (formData.get('categoria') as string) || 'documento';

    // Validar se o arquivo foi enviado
    if (!arquivo) {
      return NextResponse.json(
        { erro: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar parâmetros
    const parametrosValidados = uploadDocumentoSchema.parse({
      atendenteId,
      tipo,
      categoria,
    });

    // Determinar tipo de upload baseado na categoria
    const tipoUpload =
      parametrosValidados.categoria === 'foto' ? 'IMAGE' : 'DOCUMENT';

    // Validar arquivo
    const validacao = validateFile(arquivo, tipoUpload);
    if (!validacao.valid) {
      return NextResponse.json({ erro: validacao.error }, { status: 400 });
    }

    // Determinar subdiretório baseado no atendente (se fornecido)
    const subDirectory = parametrosValidados.atendenteId
      ? `atendente_${parametrosValidados.atendenteId}`
      : 'temp';

    // Fazer upload do arquivo
    const resultado = await saveFile(arquivo, {
      type: tipoUpload,
      subDirectory,
      preserveOriginalName: false,
    });

    if (!resultado.success) {
      return NextResponse.json(
        { erro: resultado.error || 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Retornar informações do arquivo
    return NextResponse.json(
      {
        mensagem: 'Upload realizado com sucesso',
        arquivo: {
          url: resultado.filePath,
          nomeArquivo: resultado.fileName,
          nomeOriginal: resultado.originalName,
          tamanho: resultado.size,
          tipoMime: resultado.mimeType,
          categoria: parametrosValidados.categoria,
          tipo: parametrosValidados.tipo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no upload de documento:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          erro: 'Dados inválidos',
          detalhes: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/documentos
 * Retorna informações sobre os tipos de arquivo permitidos
 */
export async function GET() {
  try {
    return NextResponse.json({
      configuracao: {
        tamanhoMaximo: {
          documento: `${UPLOAD_CONFIG.MAX_FILE_SIZE.DOCUMENT / (1024 * 1024)}MB`,
          imagem: `${UPLOAD_CONFIG.MAX_FILE_SIZE.IMAGE / (1024 * 1024)}MB`,
        },
        tiposPermitidos: {
          documento: UPLOAD_CONFIG.ALLOWED_TYPES.DOCUMENT,
          imagem: UPLOAD_CONFIG.ALLOWED_TYPES.IMAGE,
        },
        extensoesPermitidas: {
          documento: UPLOAD_CONFIG.ALLOWED_EXTENSIONS.DOCUMENT,
          imagem: UPLOAD_CONFIG.ALLOWED_EXTENSIONS.IMAGE,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao obter configurações de upload:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
