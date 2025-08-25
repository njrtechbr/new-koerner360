'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { z } from 'zod';

// Schema de validação para alteração de senha
const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: z
      .string()
      .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
      ),
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.novaSenha === data.confirmarSenha, {
    message: 'Senhas não coincidem',
    path: ['confirmarSenha'],
  });

// Schema para redefinição de senha (admin)
const redefinirSenhaSchema = z
  .object({
    novaSenha: z
      .string()
      .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
      ),
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.novaSenha === data.confirmarSenha, {
    message: 'Senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type AlterarSenhaData = z.infer<typeof alterarSenhaSchema>;
export type RedefinirSenhaData = z.infer<typeof redefinirSenhaSchema>;

export interface UseUserPasswordReturn {
  // Estados
  carregando: boolean;
  erros: Record<string, string>;

  // Funções para alteração de senha (usuário logado)
  alterarSenha: (
    usuarioId: string,
    dados: AlterarSenhaData
  ) => Promise<boolean>;
  validarAlteracaoSenha: (dados: AlterarSenhaData) => boolean;

  // Funções para redefinição de senha (admin)
  redefinirSenha: (
    usuarioId: string,
    dados: RedefinirSenhaData
  ) => Promise<boolean>;
  gerarSenhaTemporaria: (usuarioId: string) => Promise<string | null>;
  validarRedefinicaoSenha: (dados: RedefinirSenhaData) => boolean;

  // Utilitários
  gerarSenhaSegura: () => string;
  verificarForcaSenha: (senha: string) => {
    pontuacao: number;
    nivel: 'fraca' | 'media' | 'forte' | 'muito-forte';
    sugestoes: string[];
  };
  limparErros: () => void;
}

export function useUserPassword(): UseUserPasswordReturn {
  const { data: session } = useSession();
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const limparErros = () => {
    setErros({});
  };

  const validarAlteracaoSenha = (dados: AlterarSenhaData): boolean => {
    try {
      alterarSenhaSchema.parse(dados);
      limparErros();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const novosErros: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            novosErros[err.path[0]] = err.message;
          }
        });
        setErros(novosErros);
      }
      return false;
    }
  };

  const validarRedefinicaoSenha = (dados: RedefinirSenhaData): boolean => {
    try {
      redefinirSenhaSchema.parse(dados);
      limparErros();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const novosErros: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            novosErros[err.path[0]] = err.message;
          }
        });
        setErros(novosErros);
      }
      return false;
    }
  };

  const alterarSenha = async (
    usuarioId: string,
    dados: AlterarSenhaData
  ): Promise<boolean> => {
    if (!validarAlteracaoSenha(dados)) {
      return false;
    }

    if (!session?.user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Verificar se o usuário pode alterar a senha (próprio usuário ou admin)
    const podeAlterar =
      session.user.id === usuarioId || session.user.tipo === 'ADMIN';
    if (!podeAlterar) {
      toast.error('Você não tem permissão para alterar esta senha');
      return false;
    }

    try {
      setCarregando(true);
      limparErros();

      const response = await fetch(`/api/usuarios/${usuarioId}/senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senhaAtual: dados.senhaAtual,
          novaSenha: dados.novaSenha,
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        if (response.status === 400 && resultado.erro) {
          toast.error(resultado.erro);
          if (resultado.erro.includes('senha atual')) {
            setErros({ senhaAtual: 'Senha atual incorreta' });
          }
        } else {
          toast.error('Erro ao alterar senha');
        }
        return false;
      }

      toast.success('Senha alterada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro interno do servidor');
      return false;
    } finally {
      setCarregando(false);
    }
  };

  const redefinirSenha = async (
    usuarioId: string,
    dados: RedefinirSenhaData
  ): Promise<boolean> => {
    if (!validarRedefinicaoSenha(dados)) {
      return false;
    }

    if (!session?.user || session.user.tipo !== 'ADMIN') {
      toast.error('Apenas administradores podem redefinir senhas');
      return false;
    }

    try {
      setCarregando(true);
      limparErros();

      const response = await fetch(`/api/usuarios/${usuarioId}/senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novaSenha: dados.novaSenha,
          redefinicaoAdmin: true,
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        toast.error(resultado.erro || 'Erro ao redefinir senha');
        return false;
      }

      toast.success('Senha redefinida com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro interno do servidor');
      return false;
    } finally {
      setCarregando(false);
    }
  };

  const gerarSenhaTemporaria = async (
    usuarioId: string
  ): Promise<string | null> => {
    if (!session?.user || session.user.tipo !== 'ADMIN') {
      toast.error('Apenas administradores podem gerar senhas temporárias');
      return null;
    }

    try {
      setCarregando(true);

      const response = await fetch(`/api/usuarios/${usuarioId}/senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const resultado = await response.json();

      if (!response.ok) {
        toast.error(resultado.erro || 'Erro ao gerar senha temporária');
        return null;
      }

      toast.success('Senha temporária gerada com sucesso');
      return resultado.senhaTemporaria;
    } catch (error) {
      console.error('Erro ao gerar senha temporária:', error);
      toast.error('Erro interno do servidor');
      return null;
    } finally {
      setCarregando(false);
    }
  };

  const gerarSenhaSegura = (): string => {
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    const especiais = '@$!%*?&';

    const todosCaracteres = minusculas + maiusculas + numeros + especiais;

    let senha = '';

    // Garantir pelo menos um caractere de cada tipo
    senha += minusculas[Math.floor(Math.random() * minusculas.length)];
    senha += maiusculas[Math.floor(Math.random() * maiusculas.length)];
    senha += numeros[Math.floor(Math.random() * numeros.length)];
    senha += especiais[Math.floor(Math.random() * especiais.length)];

    // Completar com caracteres aleatórios até 12 caracteres
    for (let i = 4; i < 12; i++) {
      senha +=
        todosCaracteres[Math.floor(Math.random() * todosCaracteres.length)];
    }

    // Embaralhar a senha
    return senha
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const verificarForcaSenha = (senha: string) => {
    let pontuacao = 0;
    const sugestoes: string[] = [];

    // Comprimento
    if (senha.length >= 8) {
      pontuacao += 1;
    } else {
      sugestoes.push('Use pelo menos 8 caracteres');
    }

    if (senha.length >= 12) {
      pontuacao += 1;
    } else if (senha.length >= 8) {
      sugestoes.push('Use 12 ou mais caracteres para maior segurança');
    }

    // Letras minúsculas
    if (/[a-z]/.test(senha)) {
      pontuacao += 1;
    } else {
      sugestoes.push('Inclua letras minúsculas');
    }

    // Letras maiúsculas
    if (/[A-Z]/.test(senha)) {
      pontuacao += 1;
    } else {
      sugestoes.push('Inclua letras maiúsculas');
    }

    // Números
    if (/\d/.test(senha)) {
      pontuacao += 1;
    } else {
      sugestoes.push('Inclua números');
    }

    // Caracteres especiais
    if (/[@$!%*?&]/.test(senha)) {
      pontuacao += 1;
    } else {
      sugestoes.push('Inclua caracteres especiais (@$!%*?&)');
    }

    // Variedade de caracteres
    const caracteresUnicos = new Set(senha).size;
    if (caracteresUnicos >= senha.length * 0.7) {
      pontuacao += 1;
    } else {
      sugestoes.push('Evite repetir muitos caracteres');
    }

    // Padrões comuns
    const padroesComuns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /(.)\1{2,}/, // 3 ou mais caracteres repetidos
    ];

    const temPadraoComum = padroesComuns.some(padrao =>
      padrao.test(senha.toLowerCase())
    );
    if (!temPadraoComum) {
      pontuacao += 1;
    } else {
      sugestoes.push('Evite sequências e padrões comuns');
    }

    // Determinar nível
    let nivel: 'fraca' | 'media' | 'forte' | 'muito-forte';
    if (pontuacao <= 2) {
      nivel = 'fraca';
    } else if (pontuacao <= 4) {
      nivel = 'media';
    } else if (pontuacao <= 6) {
      nivel = 'forte';
    } else {
      nivel = 'muito-forte';
    }

    return {
      pontuacao,
      nivel,
      sugestoes,
    };
  };

  return {
    carregando,
    erros,
    alterarSenha,
    validarAlteracaoSenha,
    redefinirSenha,
    gerarSenhaTemporaria,
    validarRedefinicaoSenha,
    gerarSenhaSegura,
    verificarForcaSenha,
    limparErros,
  };
}

export default useUserPassword;
