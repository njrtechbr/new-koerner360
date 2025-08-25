/**
 * Demonstração das funcionalidades de Connection Pooling e Monitoramento
 *
 * Este arquivo mostra como usar as novas funcionalidades de:
 * - Connection pooling
 * - Monitoramento de performance
 * - Health checks
 * - Estatísticas de conexão
 */

import {
  prisma,
  checkDatabaseConnection,
  getConnectionPoolStats,
  performHealthCheck,
  executeWithMonitoring,
  disconnect,
} from '../lib/prisma';

// Exemplo 1: Verificar conexão básica
export async function exemploVerificarConexao() {
  console.log('🔍 Verificando conexão com o banco...');

  const resultado = await checkDatabaseConnection();

  if (resultado.success) {
    console.log('✅', resultado.message);
    console.log('⏱️ Tempo de resposta:', resultado.duration);
  } else {
    console.log('❌', resultado.message);
    console.log('🔍 Erro:', resultado.error);
  }

  return resultado;
}

// Exemplo 2: Executar health check completo
export async function exemploHealthCheck() {
  console.log('🏥 Executando health check completo...');

  const healthCheck = await performHealthCheck();

  console.log('📊 Resultado do Health Check:');
  console.log(JSON.stringify(healthCheck, null, 2));

  return healthCheck;
}

// Exemplo 3: Monitorar estatísticas do pool de conexões
export function exemploEstatisticasPool() {
  console.log('📈 Obtendo estatísticas do pool de conexões...');

  const stats = getConnectionPoolStats();

  console.log('📊 Estatísticas do Pool:');
  console.log(JSON.stringify(stats, null, 2));

  return stats;
}

// Exemplo 4: Executar query com monitoramento de performance
export async function exemploQueryComMonitoramento() {
  console.log('⚡ Executando query com monitoramento...');

  const resultado = await executeWithMonitoring(async () => {
    // Simular uma query que pode ser lenta
    const usuarios = await prisma.usuario.findMany({
      take: 10,
      include: {
        atendente: {
          include: {
            avaliacoes: true,
          },
        },
      },
    });
    return usuarios;
  }, 'buscar_usuarios_com_avaliacoes');

  console.log(`✅ Query executada em ${resultado.duration}ms`);
  console.log(`📝 Query: ${resultado.queryName}`);
  console.log(`📊 Resultados encontrados: ${resultado.result.length}`);

  return resultado;
}

// Exemplo 5: Simular múltiplas conexões simultâneas
export async function exemploConexoesSimultaneas() {
  console.log('🔄 Testando múltiplas conexões simultâneas...');

  const promises = Array.from({ length: 5 }, (_, index) =>
    executeWithMonitoring(
      async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        return await prisma.usuario.count();
      },
      `conexao_simultanea_${index + 1}`
    )
  );

  const resultados = await Promise.all(promises);

  console.log('📊 Resultados das conexões simultâneas:');
  resultados.forEach((resultado, index) => {
    console.log(
      `  Conexão ${index + 1}: ${resultado.duration}ms - ${resultado.result} usuários`
    );
  });

  return resultados;
}

// Exemplo 6: Teste de stress do pool de conexões
export async function exemploTesteStress() {
  console.log('💪 Iniciando teste de stress do pool...');

  const numeroConexoes = 20;
  const startTime = Date.now();

  try {
    const promises = Array.from({ length: numeroConexoes }, (_, index) =>
      executeWithMonitoring(
        async () => {
          // Simular operações variadas
          const operacao = index % 3;

          switch (operacao) {
            case 0:
              return await prisma.usuario.count();
            case 1:
              return await prisma.atendente.count();
            case 2:
              return await prisma.feedback.count();
            default:
              return 0;
          }
        },
        `stress_test_${index + 1}`
      )
    );

    const resultados = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    console.log(`✅ Teste de stress concluído em ${totalTime}ms`);
    console.log(`📊 ${numeroConexoes} operações executadas`);
    console.log(
      `⚡ Média: ${(totalTime / numeroConexoes).toFixed(2)}ms por operação`
    );

    // Mostrar estatísticas do pool após o teste
    const statsAposTeste = getConnectionPoolStats();
    console.log('📈 Estatísticas do pool após teste:');
    console.log(JSON.stringify(statsAposTeste, null, 2));

    return {
      totalTime,
      numeroConexoes,
      mediaOperacao: totalTime / numeroConexoes,
      resultados,
      statsAposTeste,
    };
  } catch (error) {
    console.error('❌ Erro durante teste de stress:', error);
    throw error;
  }
}

// Função principal para executar todos os exemplos
export async function executarTodosExemplos() {
  console.log('🚀 Iniciando demonstração de Connection Pooling...');
  console.log('='.repeat(60));

  try {
    // 1. Verificar conexão
    await exemploVerificarConexao();
    console.log('\n' + '-'.repeat(40) + '\n');

    // 2. Health check
    await exemploHealthCheck();
    console.log('\n' + '-'.repeat(40) + '\n');

    // 3. Estatísticas do pool
    exemploEstatisticasPool();
    console.log('\n' + '-'.repeat(40) + '\n');

    // 4. Query com monitoramento
    await exemploQueryComMonitoramento();
    console.log('\n' + '-'.repeat(40) + '\n');

    // 5. Conexões simultâneas
    await exemploConexoesSimultaneas();
    console.log('\n' + '-'.repeat(40) + '\n');

    // 6. Teste de stress
    await exemploTesteStress();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Demonstração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a demonstração:', error);
  } finally {
    // Sempre desconectar ao final
    await disconnect();
    console.log('🔌 Conexão com banco encerrada');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTodosExemplos()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}
