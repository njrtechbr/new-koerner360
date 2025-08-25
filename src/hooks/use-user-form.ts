'use client';

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import {
  useUsuarios,
  type CriarUsuarioData,
  type AtualizarUsuarioData,
  type Usuario,
} from './use-usuarios';

// Schemas de validação
const criarUsuarioSchema = z
  .object({
    nome: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    email: z.string().email('Email inválido').toLowerCase(),
    senha: z
      .string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'
      ),
    confirmarSenha: z.string(),
    perfil: z.enum(['ADMIN', 'GESTOR', 'ATENDENTE'], {
      errorMap: () => ({ message: 'Selecione um perfil válido' }),
    }),
    ativo: z.boolean().default(true),
  })
  .refine(data => data.senha === data.confirmarSenha, {
    message: 'Senhas não coincidem',
    path: ['confirmarSenha'],
  });

const atualizarUsuarioSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .optional(),
  email: z.string().email('Email inválido').toLowerCase().optional(),
  perfil: z
    .enum(['ADMIN', 'GESTOR', 'ATENDENTE'], {
      errorMap: () => ({ message: 'Selecione um perfil válido' }),
    })
    .optional(),
  ativo: z.boolean().optional(),
});

// Tipos para os formulários
export interface FormularioCriarUsuario {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  perfil: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
  ativo: boolean;
}

export interface FormularioAtualizarUsuario {
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR' | 'ATENDENTE';
  ativo: boolean;
}

export interface ErrosFormulario {
  [key: string]: string | undefined;
}

/**
 * Hook para gerenciamento de formulários de usuário
 * Fornece validação, estado e submissão de formulários
 */
export function useUserForm() {
  const { criarUsuario, atualizarUsuario, carregando } = useUsuarios();

  // Estado do formulário de criação
  const [formularioCriacao, setFormularioCriacao] =
    useState<FormularioCriarUsuario>({
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      perfil: 'ATENDENTE',
      ativo: true,
    });

  // Estado do formulário de atualização
  const [formularioAtualizacao, setFormularioAtualizacao] =
    useState<FormularioAtualizarUsuario>({
      nome: '',
      email: '',
      perfil: 'ATENDENTE',
      ativo: true,
    });

  // Erros de validação
  const [errosCriacao, setErrosCriacao] = useState<ErrosFormulario>({});
  const [errosAtualizacao, setErrosAtualizacao] = useState<ErrosFormulario>({});

  // Estado de validação
  const [validandoCriacao, setValidandoCriacao] = useState(false);
  const [validandoAtualizacao, setValidandoAtualizacao] = useState(false);

  /**
   * Atualizar campo do formulário de criação
   */
  const atualizarCampoCriacao = useCallback(
    (campo: keyof FormularioCriarUsuario, valor: any) => {
      setFormularioCriacao(prev => ({ ...prev, [campo]: valor }));

      // Limpar erro do campo quando o usuário começar a digitar
      if (errosCriacao[campo]) {
        setErrosCriacao(prev => ({ ...prev, [campo]: undefined }));
      }
    },
    [errosCriacao]
  );

  /**
   * Atualizar campo do formulário de atualização
   */
  const atualizarCampoAtualizacao = useCallback(
    (campo: keyof FormularioAtualizarUsuario, valor: any) => {
      setFormularioAtualizacao(prev => ({ ...prev, [campo]: valor }));

      // Limpar erro do campo quando o usuário começar a digitar
      if (errosAtualizacao[campo]) {
        setErrosAtualizacao(prev => ({ ...prev, [campo]: undefined }));
      }
    },
    [errosAtualizacao]
  );

  /**
   * Validar formulário de criação
   */
  const validarFormularioCriacao = useCallback(async () => {
    try {
      setValidandoCriacao(true);
      setErrosCriacao({});

      const dadosValidados = criarUsuarioSchema.parse(formularioCriacao);
      return { sucesso: true, dados: dadosValidados };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const novosErros: ErrosFormulario = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            novosErros[err.path[0] as string] = err.message;
          }
        });
        setErrosCriacao(novosErros);
      }
      return { sucesso: false, dados: null };
    } finally {
      setValidandoCriacao(false);
    }
  }, [formularioCriacao]);

  /**
   * Validar formulário de atualização
   */
  const validarFormularioAtualizacao = useCallback(async () => {
    try {
      setValidandoAtualizacao(true);
      setErrosAtualizacao({});

      const dadosValidados = atualizarUsuarioSchema.parse(
        formularioAtualizacao
      );
      return { sucesso: true, dados: dadosValidados };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const novosErros: ErrosFormulario = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            novosErros[err.path[0] as string] = err.message;
          }
        });
        setErrosAtualizacao(novosErros);
      }
      return { sucesso: false, dados: null };
    } finally {
      setValidandoAtualizacao(false);
    }
  }, [formularioAtualizacao]);

  /**
   * Submeter formulário de criação
   */
  const submeterCriacao = useCallback(async () => {
    const validacao = await validarFormularioCriacao();

    if (!validacao.sucesso || !validacao.dados) {
      return { sucesso: false, usuario: null };
    }

    try {
      // Remover confirmarSenha dos dados enviados
      const { confirmarSenha, ...dadosUsuario } = validacao.dados;
      const novoUsuario = await criarUsuario(dadosUsuario as CriarUsuarioData);

      // Limpar formulário após sucesso
      limparFormularioCriacao();

      return { sucesso: true, usuario: novoUsuario };
    } catch (error) {
      return { sucesso: false, usuario: null };
    }
  }, [validarFormularioCriacao, criarUsuario]);

  /**
   * Submeter formulário de atualização
   */
  const submeterAtualizacao = useCallback(
    async (id: string) => {
      const validacao = await validarFormularioAtualizacao();

      if (!validacao.sucesso || !validacao.dados) {
        return { sucesso: false, usuario: null };
      }

      try {
        const usuarioAtualizado = await atualizarUsuario(
          id,
          validacao.dados as AtualizarUsuarioData
        );
        return { sucesso: true, usuario: usuarioAtualizado };
      } catch (error) {
        return { sucesso: false, usuario: null };
      }
    },
    [validarFormularioAtualizacao, atualizarUsuario]
  );

  /**
   * Carregar dados do usuário no formulário de atualização
   */
  const carregarUsuarioParaEdicao = useCallback((usuario: Usuario) => {
    setFormularioAtualizacao({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    });
    setErrosAtualizacao({});
  }, []);

  /**
   * Limpar formulário de criação
   */
  const limparFormularioCriacao = useCallback(() => {
    setFormularioCriacao({
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      perfil: 'ATENDENTE',
      ativo: true,
    });
    setErrosCriacao({});
  }, []);

  /**
   * Limpar formulário de atualização
   */
  const limparFormularioAtualizacao = useCallback(() => {
    setFormularioAtualizacao({
      nome: '',
      email: '',
      perfil: 'ATENDENTE',
      ativo: true,
    });
    setErrosAtualizacao({});
  }, []);

  /**
   * Verificar se formulário de criação é válido
   */
  const formularioCriacaoValido = useCallback(() => {
    return (
      Object.keys(errosCriacao).length === 0 &&
      formularioCriacao.nome.trim() !== '' &&
      formularioCriacao.email.trim() !== '' &&
      formularioCriacao.senha.trim() !== '' &&
      formularioCriacao.confirmarSenha.trim() !== ''
    );
  }, [errosCriacao, formularioCriacao]);

  /**
   * Verificar se formulário de atualização é válido
   */
  const formularioAtualizacaoValido = useCallback(() => {
    return (
      Object.keys(errosAtualizacao).length === 0 &&
      formularioAtualizacao.nome.trim() !== '' &&
      formularioAtualizacao.email.trim() !== ''
    );
  }, [errosAtualizacao, formularioAtualizacao]);

  /**
   * Verificar se há mudanças no formulário de atualização
   */
  const temMudancasAtualizacao = useCallback(
    (usuarioOriginal: Usuario) => {
      return (
        usuarioOriginal.nome !== formularioAtualizacao.nome ||
        usuarioOriginal.email !== formularioAtualizacao.email ||
        usuarioOriginal.perfil !== formularioAtualizacao.perfil ||
        usuarioOriginal.ativo !== formularioAtualizacao.ativo
      );
    },
    [formularioAtualizacao]
  );

  return {
    // Estado dos formulários
    formularioCriacao,
    formularioAtualizacao,
    errosCriacao,
    errosAtualizacao,

    // Estado de validação
    validandoCriacao,
    validandoAtualizacao,
    carregando,

    // Ações dos formulários
    atualizarCampoCriacao,
    atualizarCampoAtualizacao,
    submeterCriacao,
    submeterAtualizacao,
    carregarUsuarioParaEdicao,

    // Validação
    validarFormularioCriacao,
    validarFormularioAtualizacao,
    formularioCriacaoValido,
    formularioAtualizacaoValido,
    temMudancasAtualizacao,

    // Limpeza
    limparFormularioCriacao,
    limparFormularioAtualizacao,
  };
}

export default useUserForm;
