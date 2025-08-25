import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  MENSAGENS_ERRO_ATENDENTES,
  validacaoAtendentes,
} from '@/lib/validations/atendentes';

/**
 * GET /api/atendentes/estatisticas
 * Retorna estatísticas gerais dos atendentes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissões
    if (!['ADMIN', 'GERENTE'].includes(session.user.userType)) {
      return NextResponse.json(
        { erro: MENSAGENS_ERRO_ATENDENTES.SEM_PERMISSAO },
        { status: 403 }
      );
    }

    // Buscar dados para estatísticas
    const [atendentes, totalAtendentes] = await Promise.all([
      prisma.atendente.findMany({
        include: {
          usuario: {
            select: {
              ativo: true,
            },
          },
          _count: {
            select: {
              documentos: true,
              historicoAlteracoes: true,
            },
          },
        },
      }),
      prisma.atendente.count(),
    ]);

    // Calcular estatísticas básicas
    const estatisticasBasicas = {
      total: totalAtendentes,
      ativos: atendentes.filter(a => a.status === 'ATIVO' && a.usuario.ativo)
        .length,
      inativos: atendentes.filter(
        a => a.status === 'INATIVO' || !a.usuario.ativo
      ).length,
      suspensos: atendentes.filter(a => a.status === 'SUSPENSO').length,
      treinamento: atendentes.filter(a => a.status === 'TREINAMENTO').length,
      ferias: atendentes.filter(a => a.status === 'FERIAS').length,
      afastados: atendentes.filter(a => a.status === 'AFASTADO').length,
      licencaMedica: atendentes.filter(a => a.status === 'LICENCA_MEDICA')
        .length,
      licencaMaternidade: atendentes.filter(
        a => a.status === 'LICENCA_MATERNIDADE'
      ).length,
    };

    // Estatísticas por setor
    const estatisticasPorSetor = atendentes.reduce(
      (acc, atendente) => {
        const setor = atendente.setor || 'Não informado';
        if (!acc[setor]) {
          acc[setor] = {
            total: 0,
            ativos: 0,
            inativos: 0,
          };
        }
        acc[setor].total++;
        if (atendente.status === 'ATIVO' && atendente.usuario.ativo) {
          acc[setor].ativos++;
        } else {
          acc[setor].inativos++;
        }
        return acc;
      },
      {} as Record<string, { total: number; ativos: number; inativos: number }>
    );

    // Estatísticas por cargo
    const estatisticasPorCargo = atendentes.reduce(
      (acc, atendente) => {
        const cargo = atendente.cargo || 'Não informado';
        if (!acc[cargo]) {
          acc[cargo] = {
            total: 0,
            ativos: 0,
            inativos: 0,
          };
        }
        acc[cargo].total++;
        if (atendente.status === 'ATIVO' && atendente.usuario.ativo) {
          acc[cargo].ativos++;
        } else {
          acc[cargo].inativos++;
        }
        return acc;
      },
      {} as Record<string, { total: number; ativos: number; inativos: number }>
    );

    // Estatísticas por departamento
    const estatisticasPorDepartamento = atendentes.reduce(
      (acc, atendente) => {
        const departamento = atendente.departamento || 'Não informado';
        if (!acc[departamento]) {
          acc[departamento] = {
            total: 0,
            ativos: 0,
            inativos: 0,
          };
        }
        acc[departamento].total++;
        if (atendente.status === 'ATIVO' && atendente.usuario.ativo) {
          acc[departamento].ativos++;
        } else {
          acc[departamento].inativos++;
        }
        return acc;
      },
      {} as Record<string, { total: number; ativos: number; inativos: number }>
    );

    // Estatísticas de idade
    const idades = atendentes
      .filter(a => a.dataNascimento)
      .map(a => validacaoAtendentes.calcularIdade(a.dataNascimento!));

    const estatisticasIdade = {
      media:
        idades.length > 0
          ? Math.round(
              idades.reduce((sum, idade) => sum + idade, 0) / idades.length
            )
          : 0,
      minima: idades.length > 0 ? Math.min(...idades) : 0,
      maxima: idades.length > 0 ? Math.max(...idades) : 0,
      faixasEtarias: {
        ate25: idades.filter(i => i <= 25).length,
        de26a35: idades.filter(i => i >= 26 && i <= 35).length,
        de36a45: idades.filter(i => i >= 36 && i <= 45).length,
        de46a55: idades.filter(i => i >= 46 && i <= 55).length,
        acimaDe55: idades.filter(i => i > 55).length,
      },
    };

    // Estatísticas de tempo de empresa
    const temposEmpresa = atendentes.map(a =>
      validacaoAtendentes.calcularTempoEmpresa(a.dataAdmissao)
    );

    const estatisticasTempoEmpresa = {
      mediaMeses:
        temposEmpresa.length > 0
          ? Math.round(
              temposEmpresa.reduce((sum, tempo) => sum + tempo, 0) /
                temposEmpresa.length
            )
          : 0,
      minimoMeses: temposEmpresa.length > 0 ? Math.min(...temposEmpresa) : 0,
      maximoMeses: temposEmpresa.length > 0 ? Math.max(...temposEmpresa) : 0,
      faixasTempo: {
        ate6Meses: temposEmpresa.filter(t => t <= 6).length,
        de7a12Meses: temposEmpresa.filter(t => t >= 7 && t <= 12).length,
        de1a2Anos: temposEmpresa.filter(t => t >= 13 && t <= 24).length,
        de3a5Anos: temposEmpresa.filter(t => t >= 25 && t <= 60).length,
        acimaDe5Anos: temposEmpresa.filter(t => t > 60).length,
      },
    };

    // Estatísticas de salário (apenas para atendentes com salário informado)
    const salarios = atendentes
      .filter(a => a.salario && a.salario > 0)
      .map(a => a.salario!);

    const estatisticasSalario = {
      media:
        salarios.length > 0
          ? Math.round(
              salarios.reduce((sum, salario) => sum + salario, 0) /
                salarios.length
            )
          : 0,
      minimo: salarios.length > 0 ? Math.min(...salarios) : 0,
      maximo: salarios.length > 0 ? Math.max(...salarios) : 0,
      mediana:
        salarios.length > 0
          ? (() => {
              const sorted = [...salarios].sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              return sorted.length % 2 !== 0
                ? sorted[mid]
                : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
            })()
          : 0,
      faixasSalariais: {
        ate2000: salarios.filter(s => s <= 2000).length,
        de2001a4000: salarios.filter(s => s >= 2001 && s <= 4000).length,
        de4001a6000: salarios.filter(s => s >= 4001 && s <= 6000).length,
        de6001a10000: salarios.filter(s => s >= 6001 && s <= 10000).length,
        acimaDe10000: salarios.filter(s => s > 10000).length,
      },
    };

    // Estatísticas de documentos
    const totalDocumentos = atendentes.reduce(
      (sum, a) => sum + a._count.documentos,
      0
    );
    const atendentesSemDocumentos = atendentes.filter(
      a => a._count.documentos === 0
    ).length;
    const atendentesComFoto = atendentes.filter(a => a.foto).length;

    // Estatísticas de admissões por mês (últimos 12 meses)
    const agora = new Date();
    const admissoesPorMes = Array.from({ length: 12 }, (_, i) => {
      const mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const proximoMes = new Date(
        agora.getFullYear(),
        agora.getMonth() - i + 1,
        1
      );

      const admissoes = atendentes.filter(
        a => a.dataAdmissao >= mes && a.dataAdmissao < proximoMes
      ).length;

      return {
        mes: mes.toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        }),
        admissoes,
      };
    }).reverse();

    return NextResponse.json({
      estatisticasBasicas,
      distribuicao: {
        porSetor: estatisticasPorSetor,
        porCargo: estatisticasPorCargo,
        porDepartamento: estatisticasPorDepartamento,
      },
      demograficas: {
        idade: estatisticasIdade,
        tempoEmpresa: estatisticasTempoEmpresa,
      },
      financeiras: {
        salario: estatisticasSalario,
      },
      documentacao: {
        totalDocumentos,
        atendentesSemDocumentos,
        atendentesComFoto,
        percentualComFoto:
          totalAtendentes > 0
            ? Math.round((atendentesComFoto / totalAtendentes) * 100)
            : 0,
      },
      tendencias: {
        admissoesPorMes,
      },
      resumo: {
        percentualAtivos:
          totalAtendentes > 0
            ? Math.round((estatisticasBasicas.ativos / totalAtendentes) * 100)
            : 0,
        percentualInativos:
          totalAtendentes > 0
            ? Math.round((estatisticasBasicas.inativos / totalAtendentes) * 100)
            : 0,
        idadeMediaAnos: Math.round(estatisticasIdade.media),
        tempoMedioEmpresaAnos: Math.round(
          estatisticasTempoEmpresa.mediaMeses / 12
        ),
        salarioMedio: estatisticasSalario.media,
      },
      geradoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar estatísticas de atendentes:', error);

    return NextResponse.json(
      { erro: MENSAGENS_ERRO_ATENDENTES.ERRO_INTERNO },
      { status: 500 }
    );
  }
}
