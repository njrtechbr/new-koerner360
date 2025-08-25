import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  saveFile,
  deleteFile,
  validateFile,
  type TipoArquivo,
} from '@/lib/upload-server';

/**
 * POST /api/upload
 * Faz upload de um arquivo
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as TipoArquivo;
    const subdiretorio = formData.get('subdiretorio') as string | null;

    if (!file) {
      return NextResponse.json(
        { erro: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        { erro: 'Tipo de arquivo não especificado' },
        { status: 400 }
      );
    }

    // Fazer upload do arquivo
    const resultado = await saveFile(file, tipo, subdiretorio || undefined);

    if (!resultado.sucesso) {
      return NextResponse.json({ erro: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({
      sucesso: true,
      arquivo: resultado.arquivo,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Remove um arquivo
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const { caminho } = await request.json();

    if (!caminho) {
      return NextResponse.json(
        { erro: 'Caminho do arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Remover arquivo
    const resultado = await deleteFile(caminho);

    if (!resultado.sucesso) {
      return NextResponse.json({ erro: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({
      sucesso: true,
    });
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Lista arquivos ou obtém informações de um arquivo
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const diretorio = searchParams.get('diretorio');
    const caminho = searchParams.get('caminho');

    if (diretorio) {
      // Listar arquivos em um diretório
      const { listFiles } = await import('@/lib/upload-server');
      const resultado = await listFiles(diretorio);

      return NextResponse.json(resultado);
    }

    if (caminho) {
      // Obter informações de um arquivo específico
      const { getFileInfo } = await import('@/lib/upload-server');
      const info = await getFileInfo(caminho);

      return NextResponse.json(info);
    }

    return NextResponse.json(
      { erro: 'Parâmetros insuficientes' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao obter informações:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
