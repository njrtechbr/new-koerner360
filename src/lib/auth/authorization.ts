import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { TipoUsuario } from '@prisma/client';

// Definição de permissões por tipo de usuário (mesmo do hook)
const PERMISSOES_POR_TIPO: Record<TipoUsuario, string[]> = {
  ADMIN: [
    // Usuários
    'gerenciar_usuarios',
    'criar_usuarios',
    'editar_usuarios',
    'excluir_usuarios',
    'ativar_usuarios',
    'desativar_usuarios',
    'redefinir_senha_usuarios',
    'visualizar_usuarios',
    'importar_usuarios',
    'exportar_usuarios',

    // Atendentes
    'gerenciar_atendentes',

    // Sistema
    'visualizar_relatorios',
    'gerenciar_sistema',
    'visualizar_dashboard_admin',
    'gerenciar_feedbacks',
    'gerenciar_avaliacoes',
    'gerenciar_gamificacao',
  ],
  GESTOR: [
    // Usuários (limitado)
    'visualizar_usuarios',
    'criar_usuarios',
    'editar_usuarios',
    'ativar_usuarios',
    'desativar_usuarios',
    'exportar_usuarios',

    // Atendentes
    'gerenciar_atendentes',

    // Sistema
    'visualizar_relatorios',
    'visualizar_dashboard_gestor',
    'gerenciar_feedbacks',
    'gerenciar_avaliacoes',
    'visualizar_gamificacao',
  ],
  ATENDENTE: [
    // Usuários (apenas visualização)
    'visualizar_usuarios',

    // Sistema
    'visualizar_dashboard_atendente',
    'criar_feedbacks',
    'visualizar_avaliacoes_proprias',
    'visualizar_gamificacao_propria',
  ],
};

// Mapeamento de rotas da API para permissões necessárias
const PERMISSOES_API: Record<string, { [method: string]: string[] }> = {
  '/api/usuarios': {
    GET: ['visualizar_usuarios'],
    POST: ['criar_usuarios'],
  },
  '/api/usuarios/[id]': {
    GET: ['visualizar_usuarios'],
    PUT: ['editar_usuarios'],
    PATCH: ['editar_usuarios'],
    DELETE: ['excluir_usuarios'],
  },
  '/api/usuarios/[id]/ativar': {
    PATCH: ['ativar_usuarios'],
  },
  '/api/usuarios/[id]/senha': {
    PUT: ['redefinir_senha_usuarios'],
    PATCH: ['redefinir_senha_usuarios'],
  },
  '/api/usuarios/importar': {
    POST: ['importar_usuarios'],
  },
  '/api/usuarios/exportar': {
    GET: ['exportar_usuarios'],
    POST: ['exportar_usuarios'],
  },
};

interface UsuarioSessao {
  id: string;
  email: string;
  nome: string;
  userType: TipoUsuario;
}

/**
 * Verifica se o usuário tem uma permissão específica
 */
export function temPermissao(
  usuario: UsuarioSessao,
  permissao: string
): boolean {
  const permissoesUsuario = PERMISSOES_POR_TIPO[usuario.userType] || [];
  return permissoesUsuario.includes(permissao);
}

/**
 * Verifica se o usuário tem pelo menos uma das permissões fornecidas
 */
export function temAlgumaPermissao(
  usuario: UsuarioSessao,
  permissoes: string[]
): boolean {
  return permissoes.some(permissao => temPermissao(usuario, permissao));
}

/**
 * Verifica se o usuário tem todas as permissões fornecidas
 */
export function temTodasPermissoes(
  usuario: UsuarioSessao,
  permissoes: string[]
): boolean {
  return permissoes.every(permissao => temPermissao(usuario, permissao));
}

/**
 * Obtém as permissões necessárias para uma rota e método específicos
 */
function obterPermissoesNecessarias(rota: string, metodo: string): string[] {
  // Normalizar a rota para corresponder ao padrão
  const rotaNormalizada = rota.replace(
    /\/api\/usuarios\/[^/]+(?=\/|$)/,
    '/api/usuarios/[id]'
  );

  const permissoesRota = PERMISSOES_API[rotaNormalizada];
  if (!permissoesRota) {
    return []; // Rota não protegida
  }

  return permissoesRota[metodo] || [];
}

/**
 * Middleware de autorização para rotas da API
 */
export async function verificarAutorizacao(
  request: NextRequest,
  permissoesNecessarias?: string[]
): Promise<{ autorizado: boolean; usuario?: UsuarioSessao; erro?: string }> {
  try {
    // Obter sessão do usuário
    const session = await getServerSession();

    if (!session?.user) {
      return {
        autorizado: false,
        erro: 'Usuário não autenticado',
      };
    }

    const usuario = session.user as UsuarioSessao;

    // Se não há permissões específicas, verificar pela rota
    if (!permissoesNecessarias) {
      const rota = request.nextUrl.pathname;
      const metodo = request.method;
      permissoesNecessarias = obterPermissoesNecessarias(rota, metodo);
    }

    // Se não há permissões necessárias, permitir acesso
    if (!permissoesNecessarias || permissoesNecessarias.length === 0) {
      return {
        autorizado: true,
        usuario,
      };
    }

    // Verificar se o usuário tem as permissões necessárias
    const temPermissoes = temAlgumaPermissao(usuario, permissoesNecessarias);

    if (!temPermissoes) {
      return {
        autorizado: false,
        usuario,
        erro: `Permissões insuficientes. Necessárias: ${permissoesNecessarias.join(', ')}`,
      };
    }

    return {
      autorizado: true,
      usuario,
    };
  } catch (error) {
    console.error('Erro na verificação de autorização:', error);
    return {
      autorizado: false,
      erro: 'Erro interno na verificação de autorização',
    };
  }
}

/**
 * Decorator para proteger rotas da API
 */
export function comAutorizacao(permissoes?: string[]) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const { autorizado, usuario, erro } = await verificarAutorizacao(
        request,
        permissoes
      );

      if (!autorizado) {
        return new Response(
          JSON.stringify({
            erro: erro || 'Acesso negado',
            codigo: 'ACESSO_NEGADO',
          }),
          {
            status: usuario ? 403 : 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Adicionar usuário ao contexto
      context.usuario = usuario;

      return handler(request, context);
    };
  };
}

/**
 * Utilitário para verificar permissões em handlers de API
 */
export async function verificarPermissaoAPI(
  request: NextRequest,
  permissoes: string[]
): Promise<{ sucesso: boolean; usuario?: UsuarioSessao; resposta?: Response }> {
  const { autorizado, usuario, erro } = await verificarAutorizacao(
    request,
    permissoes
  );

  if (!autorizado) {
    return {
      sucesso: false,
      resposta: new Response(
        JSON.stringify({
          erro: erro || 'Acesso negado',
          codigo: 'ACESSO_NEGADO',
        }),
        {
          status: usuario ? 403 : 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return {
    sucesso: true,
    usuario,
  };
}

/**
 * Registrar tentativa de acesso não autorizado para auditoria
 */
export async function registrarTentativaAcesso({
  usuario,
  rota,
  metodo,
  ip,
  userAgent,
  autorizado,
  motivo,
}: {
  usuario?: UsuarioSessao;
  rota: string;
  metodo: string;
  ip?: string;
  userAgent?: string;
  autorizado: boolean;
  motivo?: string;
}) {
  try {
    // Aqui você pode implementar o log de auditoria
    // Por exemplo, salvar em banco de dados, arquivo de log, etc.
    const logEntry = {
      timestamp: new Date().toISOString(),
      usuario: usuario
        ? {
            id: usuario.id,
            email: usuario.email,
            tipo: usuario.userType,
          }
        : null,
      rota,
      metodo,
      ip,
      userAgent,
      autorizado,
      motivo,
    };

    console.log('Tentativa de acesso:', JSON.stringify(logEntry, null, 2));

    // TODO: Implementar persistência do log de auditoria
    // await salvarLogAuditoria(logEntry);
  } catch (error) {
    console.error('Erro ao registrar tentativa de acesso:', error);
  }
}
