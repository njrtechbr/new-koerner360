import prisma from './prisma';
import {
  FiltroUsuarios,
  FiltroAtendentes,
  FiltroFeedbacks,
  ParametrosPaginacao,
  ResultadoPaginado,
} from './types';

/**
 * Utilitários para operações de banco de dados
 */

// Função para aplicar paginação
export const aplicarPaginacao = (params: ParametrosPaginacao) => {
  const pagina = Math.max(1, params.pagina || 1);
  const limite = Math.min(100, Math.max(1, params.limite || 10));
  const skip = (pagina - 1) * limite;

  return {
    skip,
    take: limite,
    pagina,
    limite,
  };
};

// Função para criar resultado paginado
export const criarResultadoPaginado = <T>(
  dados: T[],
  total: number,
  pagina: number,
  limite: number
): ResultadoPaginado<T> => {
  return {
    dados,
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
};

// Função para construir filtros de usuários
export const construirFiltroUsuarios = (filtros: FiltroUsuarios) => {
  const where: any = {};

  if (filtros.userType) {
    where.userType = filtros.userType;
  }

  if (typeof filtros.ativo === 'boolean') {
    where.ativo = filtros.ativo;
  }

  if (filtros.email) {
    where.email = {
      contains: filtros.email,
      mode: 'insensitive',
    };
  }

  if (filtros.nome) {
    where.nome = {
      contains: filtros.nome,
      mode: 'insensitive',
    };
  }

  return where;
};

// Função para construir filtros de atendentes
export const construirFiltroAtendentes = (filtros: FiltroAtendentes) => {
  const where: any = {};

  if (filtros.status) {
    where.status = filtros.status;
  }

  if (filtros.setor) {
    where.setor = {
      contains: filtros.setor,
      mode: 'insensitive',
    };
  }

  if (filtros.cargo) {
    where.cargo = {
      contains: filtros.cargo,
      mode: 'insensitive',
    };
  }

  if (filtros.dataAdmissaoInicio || filtros.dataAdmissaoFim) {
    where.dataAdmissao = {};

    if (filtros.dataAdmissaoInicio) {
      where.dataAdmissao.gte = filtros.dataAdmissaoInicio;
    }

    if (filtros.dataAdmissaoFim) {
      where.dataAdmissao.lte = filtros.dataAdmissaoFim;
    }
  }

  return where;
};

// Função para construir filtros de feedbacks
export const construirFiltroFeedbacks = (filtros: FiltroFeedbacks) => {
  const where: any = {};

  if (filtros.tipo) {
    where.tipo = filtros.tipo;
  }

  if (filtros.status) {
    where.status = filtros.status;
  }

  if (filtros.prioridade) {
    where.prioridade = filtros.prioridade;
  }

  if (filtros.autorId) {
    where.autorId = filtros.autorId;
  }

  if (filtros.responsavelId) {
    where.responsavelId = filtros.responsavelId;
  }

  if (filtros.dataInicio || filtros.dataFim) {
    where.criadoEm = {};

    if (filtros.dataInicio) {
      where.criadoEm.gte = filtros.dataInicio;
    }

    if (filtros.dataFim) {
      where.criadoEm.lte = filtros.dataFim;
    }
  }

  return where;
};

// Função para validar CPF
export const validarCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }

  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpfLimpo.charAt(9))) {
    return false;
  }

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }

  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  return resto === parseInt(cpfLimpo.charAt(10));
};

// Função para validar email
export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Função para verificar se CPF já existe
export const cpfJaExiste = async (
  cpf: string,
  excluirId?: string
): Promise<boolean> => {
  const cpfLimpo = cpf.replace(/\D/g, '');

  const atendente = await prisma.atendente.findFirst({
    where: {
      cpf: cpfLimpo,
      ...(excluirId && { id: { not: excluirId } }),
    },
  });

  return !!atendente;
};

// Função para verificar se email já existe
export const emailJaExiste = async (
  email: string,
  excluirId?: string
): Promise<boolean> => {
  const usuario = await prisma.usuario.findFirst({
    where: {
      email: email.toLowerCase(),
      ...(excluirId && { id: { not: excluirId } }),
    },
  });

  return !!usuario;
};

// Função para formatar CPF
export const formatarCPF = (cpf: string): string => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Função para formatar telefone
export const formatarTelefone = (telefone: string): string => {
  const telefoneLimpo = telefone.replace(/\D/g, '');

  if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return telefone;
};

// Função para gerar período de avaliação (formato: YYYY-MM)
export const gerarPeriodoAvaliacao = (data: Date = new Date()): string => {
  const ano = data.getFullYear();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  return `${ano}-${mes}`;
};

// Função para verificar se já existe avaliação no período
export const avaliacaoJaExisteNoPeriodo = async (
  atendenteId: string,
  periodo: string,
  excluirId?: string
): Promise<boolean> => {
  const avaliacao = await prisma.avaliacao.findFirst({
    where: {
      atendenteId,
      periodo,
      ...(excluirId && { id: { not: excluirId } }),
    },
  });

  return !!avaliacao;
};
