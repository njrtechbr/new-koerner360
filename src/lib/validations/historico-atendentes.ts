import { z } from 'zod';
import { validacaoUtils } from './index';

/**
 * Schema para validação de ID de histórico
 */
export const idHistoricoSchema = z
  .string()
  .cuid('ID do histórico deve ser um CUID válido');

/**
 * Schema para tipos de alteração no histórico
 */
export const tipoAlteracaoSchema = z.enum([
  'CRIACAO',
  'ATUALIZACAO',
  'EXCLUSAO',
  'ATIVACAO',
  'DESATIVACAO',
  'MUDANCA_STATUS',
  'UPLOAD_DOCUMENTO',
  'REMOCAO_DOCUMENTO',
]);

/**
 * Schema para criar entrada no histórico
 */
export const criarHistoricoSchema = z.object({
  atendenteId: z.string().cuid('ID do atendente deve ser um CUID válido'),
  tipo: tipoAlteracaoSchema,
  campo: z
    .string()
    .max(100, 'Campo deve ter no máximo 100 caracteres')
    .optional(),
  valorAnterior: z
    .string()
    .max(2000, 'Valor anterior deve ter no máximo 2000 caracteres')
    .optional(),
  valorNovo: z
    .string()
    .max(2000, 'Valor novo deve ter no máximo 2000 caracteres')
    .optional(),
  descricao: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  ip: z.string().ip('IP deve ser válido').optional(),
  userAgent: z
    .string()
    .max(500, 'User Agent deve ter no máximo 500 caracteres')
    .optional(),
});

/**
 * Schema para listar histórico com filtros
 */
export const listarHistoricoSchema = z
  .object({
    pagina: z
      .number()
      .int()
      .positive('Página deve ser um número positivo')
      .default(1),
    limite: z
      .number()
      .int()
      .positive('Limite deve ser um número positivo')
      .max(100, 'Limite máximo é 100')
      .default(20),
    tipo: tipoAlteracaoSchema.optional(),
    campo: z
      .string()
      .max(100, 'Campo deve ter no máximo 100 caracteres')
      .optional(),
    dataInicio: z.date('Data de início deve ser uma data válida').optional(),
    dataFim: z.date('Data de fim deve ser uma data válida').optional(),
    criadoPorId: z
      .string()
      .cuid('ID do usuário deve ser um CUID válido')
      .optional(),
    ordenacao: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    data => {
      if (data.dataInicio && data.dataFim) {
        return data.dataInicio <= data.dataFim;
      }
      return true;
    },
    {
      message: 'Data de início deve ser anterior ou igual à data de fim',
    }
  );

/**
 * Schema para buscar no histórico
 */
export const buscarHistoricoSchema = z.object({
  termo: z
    .string()
    .min(1, 'Termo de busca é obrigatório')
    .max(100, 'Termo deve ter no máximo 100 caracteres'),
  campos: z
    .array(z.enum(['descricao', 'campo', 'valorAnterior', 'valorNovo']))
    .default(['descricao']),
  pagina: z
    .number()
    .int()
    .positive('Página deve ser um número positivo')
    .default(1),
  limite: z
    .number()
    .int()
    .positive('Limite deve ser um número positivo')
    .max(50, 'Limite máximo é 50')
    .default(10),
});

/**
 * Schema para estatísticas do histórico
 */
export const estatisticasHistoricoSchema = z
  .object({
    dataInicio: z.date('Data de início deve ser uma data válida').optional(),
    dataFim: z.date('Data de fim deve ser uma data válida').optional(),
    agruparPor: z.enum(['tipo', 'campo', 'usuario', 'data']).default('tipo'),
  })
  .refine(
    data => {
      if (data.dataInicio && data.dataFim) {
        return data.dataInicio <= data.dataFim;
      }
      return true;
    },
    {
      message: 'Data de início deve ser anterior ou igual à data de fim',
    }
  );

/**
 * Schema para consulta do histórico geral de atendentes
 */
export const consultaHistoricoGeralSchema = z
  .object({
    pagina: validacaoUtils.paginaSchema,
    limite: validacaoUtils.limiteSchema,
    busca: z
      .string()
      .max(100, 'Busca deve ter no máximo 100 caracteres')
      .optional(),
    atendenteId: z
      .string()
      .cuid('ID do atendente deve ser um CUID válido')
      .optional(),
    tipo: tipoAlteracaoSchema.optional(),
    dataInicio: z
      .string()
      .datetime('Data de início deve ser uma data válida')
      .optional(),
    dataFim: z
      .string()
      .datetime('Data de fim deve ser uma data válida')
      .optional(),
    criadoPorId: z
      .string()
      .cuid('ID do usuário deve ser um CUID válido')
      .optional(),
  })
  .refine(
    data => {
      if (data.dataInicio && data.dataFim) {
        const inicio = new Date(data.dataInicio);
        const fim = new Date(data.dataFim);
        return inicio <= fim;
      }
      return true;
    },
    {
      message: 'Data de início deve ser anterior ou igual à data de fim',
    }
  );

/**
 * Schema para consulta do histórico individual de atendente
 */
export const consultaHistoricoSchema = z
  .object({
    pagina: validacaoUtils.paginaSchema,
    limite: validacaoUtils.limiteSchema,
    tipo: tipoAlteracaoSchema.optional(),
    dataInicio: z
      .string()
      .datetime('Data de início deve ser uma data válida')
      .optional(),
    dataFim: z
      .string()
      .datetime('Data de fim deve ser uma data válida')
      .optional(),
    criadoPorId: z
      .string()
      .cuid('ID do usuário deve ser um CUID válido')
      .optional(),
  })
  .refine(
    data => {
      if (data.dataInicio && data.dataFim) {
        const inicio = new Date(data.dataInicio);
        const fim = new Date(data.dataFim);
        return inicio <= fim;
      }
      return true;
    },
    {
      message: 'Data de início deve ser anterior ou igual à data de fim',
    }
  );

/**
 * Tipos TypeScript derivados dos schemas
 */
export type TipoAlteracao = z.infer<typeof tipoAlteracaoSchema>;
export type CriarHistoricoInput = z.infer<typeof criarHistoricoSchema>;
export type ListarHistoricoInput = z.infer<typeof listarHistoricoSchema>;
export type BuscarHistoricoInput = z.infer<typeof buscarHistoricoSchema>;
export type EstatisticasHistoricoInput = z.infer<
  typeof estatisticasHistoricoSchema
>;
export type ConsultaHistoricoGeralInput = z.infer<
  typeof consultaHistoricoGeralSchema
>;
export type ConsultaHistoricoInput = z.infer<typeof consultaHistoricoSchema>;

/**
 * Mensagens de erro específicas para histórico
 */
export const MENSAGENS_ERRO_HISTORICO = {
  HISTORICO_NAO_ENCONTRADO: 'Histórico não encontrado',
  ATENDENTE_NAO_ENCONTRADO: 'Atendente não encontrado para o histórico',
  DADOS_INVALIDOS: 'Dados fornecidos são inválidos',
  SEM_PERMISSAO: 'Sem permissão para acessar o histórico',
  PERIODO_INVALIDO: 'Período de consulta inválido',
  LIMITE_EXCEDIDO: 'Limite de registros excedido',
  ERRO_INTERNO: 'Erro interno do servidor',
  CAMPO_OBRIGATORIO: 'Campo obrigatório não informado',
  FORMATO_DATA_INVALIDO: 'Formato de data inválido',
  TERMO_BUSCA_MUITO_CURTO: 'Termo de busca deve ter pelo menos 1 caractere',
  TERMO_BUSCA_MUITO_LONGO: 'Termo de busca deve ter no máximo 100 caracteres',
} as const;

/**
 * Configurações para histórico
 */
export const CONFIGURACOES_HISTORICO = {
  LIMITE_MAXIMO_REGISTROS: 100,
  LIMITE_PADRAO_REGISTROS: 20,
  LIMITE_MAXIMO_BUSCA: 50,
  LIMITE_PADRAO_BUSCA: 10,
  TAMANHO_MAXIMO_DESCRICAO: 500,
  TAMANHO_MAXIMO_CAMPO: 100,
  TAMANHO_MAXIMO_VALOR: 2000,
  TAMANHO_MAXIMO_USER_AGENT: 500,
  DIAS_RETENCAO_HISTORICO: 365 * 2, // 2 anos
  TIPOS_ALTERACAO_CRITICOS: ['EXCLUSAO', 'DESATIVACAO'] as TipoAlteracao[],
} as const;

/**
 * Utilitários de validação específicos para histórico
 */
export const validacaoHistorico = {
  /**
   * Valida se o tipo de alteração é crítico
   */
  ehAlteracaoCritica: (tipo: TipoAlteracao): boolean => {
    return CONFIGURACOES_HISTORICO.TIPOS_ALTERACAO_CRITICOS.includes(tipo);
  },

  /**
   * Formata dados para o histórico
   */
  formatarDadosHistorico: (dados: any): string => {
    try {
      return JSON.stringify(dados, null, 0);
    } catch {
      return String(dados);
    }
  },

  /**
   * Valida se o período de consulta é válido
   */
  validarPeriodoConsulta: (dataInicio?: Date, dataFim?: Date): boolean => {
    if (!dataInicio || !dataFim) return true;

    const agora = new Date();
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(agora.getFullYear() - 1);

    // Não permitir consultas muito antigas (mais de 1 ano)
    if (dataInicio < umAnoAtras) return false;

    // Não permitir datas futuras
    if (dataInicio > agora || dataFim > agora) return false;

    return dataInicio <= dataFim;
  },

  /**
   * Gera descrição automática baseada no tipo de alteração
   */
  gerarDescricaoAutomatica: (
    tipo: TipoAlteracao,
    campo?: string,
    valorAnterior?: string,
    valorNovo?: string
  ): string => {
    const descricoes: Record<TipoAlteracao, string> = {
      CRIACAO: 'Atendente criado no sistema',
      ATUALIZACAO: campo
        ? `Campo '${campo}' atualizado`
        : 'Dados do atendente atualizados',
      EXCLUSAO: 'Atendente removido do sistema',
      ATIVACAO: 'Atendente ativado',
      DESATIVACAO: 'Atendente desativado',
      MUDANCA_STATUS: `Status alterado${valorAnterior && valorNovo ? ` de '${valorAnterior}' para '${valorNovo}'` : ''}`,
      UPLOAD_DOCUMENTO: 'Documento adicionado',
      REMOCAO_DOCUMENTO: 'Documento removido',
    };

    return descricoes[tipo] || 'Alteração realizada';
  },

  /**
   * Valida se o usuário pode acessar o histórico
   */
  podeAcessarHistorico: (
    tipoUsuario: string,
    atendenteId: string,
    usuarioId: string
  ): boolean => {
    // ADMIN e GERENTE podem ver qualquer histórico
    if (['ADMIN', 'GERENTE'].includes(tipoUsuario)) {
      return true;
    }

    // ATENDENTE só pode ver seu próprio histórico
    if (tipoUsuario === 'ATENDENTE') {
      return atendenteId === usuarioId;
    }

    return false;
  },

  /**
   * Calcula estatísticas do histórico
   */
  calcularEstatisticas: (historico: any[]): Record<string, number> => {
    const estatisticas: Record<string, number> = {};

    // Contar por tipo de alteração
    historico.forEach(item => {
      const tipo = item.tipo;
      estatisticas[tipo] = (estatisticas[tipo] || 0) + 1;
    });

    return estatisticas;
  },

  /**
   * Sanitiza dados sensíveis do histórico
   */
  sanitizarDadosHistorico: (dados: any): any => {
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados);
      } catch {
        return dados;
      }
    }

    if (typeof dados === 'object' && dados !== null) {
      const dadosSanitizados = { ...dados };

      // Remover campos sensíveis
      const camposSensiveis = ['senha', 'password', 'token', 'secret'];
      camposSensiveis.forEach(campo => {
        if (dadosSanitizados[campo]) {
          dadosSanitizados[campo] = '[DADOS SENSÍVEIS]';
        }
      });

      return dadosSanitizados;
    }

    return dados;
  },
};

/**
 * Validações customizadas para histórico
 */
export const validacaoHistoricoCustomizada = {
  /**
   * Valida entrada de histórico com regras de negócio
   */
  validarEntradaHistorico: (
    dados: CriarHistoricoInput
  ): { valido: boolean; erros: string[] } => {
    const erros: string[] = [];

    // Validar se alterações críticas têm descrição detalhada
    if (
      validacaoHistorico.ehAlteracaoCritica(dados.tipo) &&
      dados.descricao.length < 20
    ) {
      erros.push(
        'Alterações críticas devem ter descrição detalhada (mínimo 20 caracteres)'
      );
    }

    // Validar se campos obrigatórios estão presentes para certos tipos
    if (
      ['ATUALIZACAO', 'MUDANCA_STATUS'].includes(dados.tipo) &&
      !dados.campo
    ) {
      erros.push('Campo é obrigatório para este tipo de alteração');
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  },
};
