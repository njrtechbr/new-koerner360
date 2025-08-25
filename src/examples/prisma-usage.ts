/**
 * Exemplos de uso do cliente Prisma configurado
 * Este arquivo demonstra como realizar operações CRUD básicas
 */

import prisma, { checkDatabaseConnection } from '../lib/prisma';
import {
  CriarUsuario,
  CriarAtendente,
  CriarAvaliacao,
  CriarFeedback,
  AtualizarUsuario,
  AtualizarAtendente,
  FiltroUsuarios,
  ParametrosPaginacao,
} from '../lib/types';
import {
  aplicarPaginacao,
  criarResultadoPaginado,
  construirFiltroUsuarios,
  validarCPF,
  validarEmail,
  cpfJaExiste,
  emailJaExiste,
} from '../lib/database-utils';

/**
 * Exemplo: Verificar conexão com o banco de dados
 */
export const exemploVerificarConexao = async () => {
  console.log('🔍 Verificando conexão com o banco de dados...');

  const resultado = await checkDatabaseConnection();

  if (resultado.success) {
    console.log('✅', resultado.message);
  } else {
    console.error('❌', resultado.message, resultado.error);
  }

  return resultado;
};

/**
 * Exemplo: Criar um novo usuário
 */
export const exemploCriarUsuario = async (dadosUsuario: CriarUsuario) => {
  console.log('👤 Criando novo usuário...');

  try {
    // Validar email
    if (!validarEmail(dadosUsuario.email)) {
      throw new Error('Email inválido');
    }

    // Verificar se email já existe
    if (await emailJaExiste(dadosUsuario.email)) {
      throw new Error('Email já está em uso');
    }

    const usuario = await prisma.usuario.create({
      data: {
        ...dadosUsuario,
        email: dadosUsuario.email.toLowerCase(),
      },
    });

    console.log('✅ Usuário criado:', usuario.id);
    return usuario;
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  }
};

/**
 * Exemplo: Criar um novo atendente
 */
export const exemploCriarAtendente = async (dadosAtendente: CriarAtendente) => {
  console.log('👨‍💼 Criando novo atendente...');

  try {
    // Validar CPF
    if (!validarCPF(dadosAtendente.cpf)) {
      throw new Error('CPF inválido');
    }

    // Verificar se CPF já existe
    if (await cpfJaExiste(dadosAtendente.cpf)) {
      throw new Error('CPF já está em uso');
    }

    // Verificar se usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: dadosAtendente.usuarioId },
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    const atendente = await prisma.atendente.create({
      data: {
        ...dadosAtendente,
        cpf: dadosAtendente.cpf.replace(/\D/g, ''), // Remove formatação
      },
      include: {
        usuario: true,
      },
    });

    console.log('✅ Atendente criado:', atendente.id);
    return atendente;
  } catch (error) {
    console.error('❌ Erro ao criar atendente:', error);
    throw error;
  }
};

/**
 * Exemplo: Buscar usuários com filtros e paginação
 */
export const exemploBuscarUsuarios = async (
  filtros: FiltroUsuarios = {},
  paginacao: ParametrosPaginacao = {}
) => {
  console.log('🔍 Buscando usuários...');

  try {
    const { skip, take, pagina, limite } = aplicarPaginacao(paginacao);
    const where = construirFiltroUsuarios(filtros);

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        skip,
        take,
        orderBy: {
          [paginacao.ordenarPor || 'criadoEm']: paginacao.ordem || 'desc',
        },
        include: {
          atendente: true,
        },
      }),
      prisma.usuario.count({ where }),
    ]);

    const resultado = criarResultadoPaginado(usuarios, total, pagina, limite);

    console.log(`✅ Encontrados ${total} usuários (página ${pagina})`);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    throw error;
  }
};

/**
 * Exemplo: Atualizar um usuário
 */
export const exemploAtualizarUsuario = async (
  id: string,
  dadosAtualizacao: AtualizarUsuario
) => {
  console.log('📝 Atualizando usuário...');

  try {
    // Verificar se usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      throw new Error('Usuário não encontrado');
    }

    // Validar email se fornecido
    if (dadosAtualizacao.email) {
      if (!validarEmail(dadosAtualizacao.email)) {
        throw new Error('Email inválido');
      }

      if (await emailJaExiste(dadosAtualizacao.email, id)) {
        throw new Error('Email já está em uso');
      }

      dadosAtualizacao.email = dadosAtualizacao.email.toLowerCase();
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
    });

    console.log('✅ Usuário atualizado:', usuario.id);
    return usuario;
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    throw error;
  }
};

/**
 * Exemplo: Criar uma avaliação
 */
export const exemploCriarAvaliacao = async (dadosAvaliacao: CriarAvaliacao) => {
  console.log('⭐ Criando avaliação...');

  try {
    // Verificar se atendente existe
    const atendente = await prisma.atendente.findUnique({
      where: { id: dadosAvaliacao.atendenteId },
    });

    if (!atendente) {
      throw new Error('Atendente não encontrado');
    }

    // Verificar se já existe avaliação no período
    const avaliacaoExistente = await prisma.avaliacao.findFirst({
      where: {
        atendenteId: dadosAvaliacao.atendenteId,
        periodo: dadosAvaliacao.periodo,
      },
    });

    if (avaliacaoExistente) {
      throw new Error(
        'Já existe uma avaliação para este atendente no período informado'
      );
    }

    const avaliacao = await prisma.avaliacao.create({
      data: dadosAvaliacao,
      include: {
        atendente: {
          include: {
            usuario: true,
          },
        },
      },
    });

    console.log('✅ Avaliação criada:', avaliacao.id);
    return avaliacao;
  } catch (error) {
    console.error('❌ Erro ao criar avaliação:', error);
    throw error;
  }
};

/**
 * Exemplo: Criar um feedback
 */
export const exemploCriarFeedback = async (dadosFeedback: CriarFeedback) => {
  console.log('💬 Criando feedback...');

  try {
    const feedback = await prisma.feedback.create({
      data: {
        ...dadosFeedback,
        status: 'PENDENTE', // Status padrão
        prioridade: dadosFeedback.prioridade || 'MEDIA', // Prioridade padrão
      },
    });

    console.log('✅ Feedback criado:', feedback.id);
    return feedback;
  } catch (error) {
    console.error('❌ Erro ao criar feedback:', error);
    throw error;
  }
};

/**
 * Exemplo: Buscar estatísticas gerais
 */
export const exemploEstatisticasGerais = async () => {
  console.log('📊 Buscando estatísticas gerais...');

  try {
    const [totalUsuarios, totalAtendentes, totalAvaliacoes, totalFeedbacks] =
      await Promise.all([
        prisma.usuario.count(),
        prisma.atendente.count(),
        prisma.avaliacao.count(),
        prisma.feedback.count(),
      ]);

    const estatisticas = {
      totalUsuarios,
      totalAtendentes,
      totalAvaliacoes,
      totalFeedbacks,
      atendentesPorStatus: await prisma.atendente.groupBy({
        by: ['status'],
        _count: true,
      }),
      feedbacksPorTipo: await prisma.feedback.groupBy({
        by: ['tipo'],
        _count: true,
      }),
      feedbacksPorStatus: await prisma.feedback.groupBy({
        by: ['status'],
        _count: true,
      }),
    };

    console.log('✅ Estatísticas obtidas');
    return estatisticas;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
};

/**
 * Exemplo: Função principal para demonstrar o uso
 */
export const exemploUsoCompleto = async () => {
  console.log('🚀 Iniciando exemplo de uso completo do Prisma...');

  try {
    // 1. Verificar conexão
    await exemploVerificarConexao();

    // 2. Buscar estatísticas
    const estatisticas = await exemploEstatisticasGerais();
    console.log('📊 Estatísticas:', estatisticas);

    // 3. Buscar usuários
    const usuarios = await exemploBuscarUsuarios(
      { ativo: true },
      { pagina: 1, limite: 5 }
    );
    console.log('👥 Usuários encontrados:', usuarios.dados.length);

    console.log('✅ Exemplo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no exemplo:', error);
  }
};

// Exportar todas as funções de exemplo
export default {
  exemploVerificarConexao,
  exemploCriarUsuario,
  exemploCriarAtendente,
  exemploBuscarUsuarios,
  exemploAtualizarUsuario,
  exemploCriarAvaliacao,
  exemploCriarFeedback,
  exemploEstatisticasGerais,
  exemploUsoCompleto,
};
