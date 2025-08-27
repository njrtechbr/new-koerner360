#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configurações de teste
const testConfigs = {
  vitest: {
    command: 'npx',
    args: ['vitest'],
    description: 'Executar testes com Vitest'
  },
  jest: {
    command: 'npx',
    args: ['jest'],
    description: 'Executar testes com Jest'
  },
  'vitest:watch': {
    command: 'npx',
    args: ['vitest', '--watch'],
    description: 'Executar testes com Vitest em modo watch'
  },
  'jest:watch': {
    command: 'npx',
    args: ['jest', '--watch'],
    description: 'Executar testes com Jest em modo watch'
  },
  'vitest:coverage': {
    command: 'npx',
    args: ['vitest', '--coverage'],
    description: 'Executar testes com Vitest e gerar relatório de cobertura'
  },
  'jest:coverage': {
    command: 'npx',
    args: ['jest', '--coverage'],
    description: 'Executar testes com Jest e gerar relatório de cobertura'
  },
  'vitest:ui': {
    command: 'npx',
    args: ['vitest', '--ui'],
    description: 'Executar testes com Vitest UI'
  },
  hooks: {
    command: 'npx',
    args: ['vitest', 'src/hooks/**/*.test.ts'],
    description: 'Executar apenas testes de hooks'
  },
  components: {
    command: 'npx',
    args: ['vitest', 'src/components/**/*.test.tsx'],
    description: 'Executar apenas testes de componentes'
  },
  services: {
    command: 'npx',
    args: ['vitest', 'src/lib/services/**/*.test.ts'],
    description: 'Executar apenas testes de serviços'
  },
  notificacoes: {
    command: 'npx',
    args: ['vitest', 'src/**/*notificac*.test.*'],
    description: 'Executar apenas testes relacionados a notificações'
  },
  lembretes: {
    command: 'npx',
    args: ['vitest', 'src/**/*lembrete*.test.*'],
    description: 'Executar apenas testes relacionados a lembretes'
  },
  preferencias: {
    command: 'npx',
    args: ['vitest', 'src/**/*preferencia*.test.*'],
    description: 'Executar apenas testes relacionados a preferências'
  }
};

// Função para exibir ajuda
function showHelp() {
  console.log('\n🧪 Script de Testes - Sistema de Notificações\n');
  console.log('Uso: node scripts/test.js [comando] [opções]\n');
  console.log('Comandos disponíveis:\n');
  
  Object.entries(testConfigs).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(20)} - ${config.description}`);
  });
  
  console.log('\nExemplos:');
  console.log('  node scripts/test.js vitest');
  console.log('  node scripts/test.js jest:coverage');
  console.log('  node scripts/test.js hooks');
  console.log('  node scripts/test.js notificacoes');
  console.log('');
}

// Função para executar comando
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Executando: ${command} ${args.join(' ')}\n`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..'),
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Comando executado com sucesso!\n`);
        resolve(code);
      } else {
        console.log(`\n❌ Comando falhou com código: ${code}\n`);
        reject(new Error(`Processo terminou com código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Erro ao executar comando: ${error.message}\n`);
      reject(error);
    });
  });
}

// Função para verificar se os arquivos de configuração existem
function checkConfigFiles() {
  const projectRoot = path.resolve(__dirname, '..');
  const vitestConfig = path.join(projectRoot, 'vitest.config.ts');
  const jestConfig = path.join(projectRoot, 'jest.config.js');
  const setupFile = path.join(projectRoot, 'src/test/setup.ts');
  
  console.log('\n📋 Verificando arquivos de configuração:\n');
  
  const files = [
    { path: vitestConfig, name: 'vitest.config.ts' },
    { path: jestConfig, name: 'jest.config.js' },
    { path: setupFile, name: 'src/test/setup.ts' }
  ];
  
  files.forEach(file => {
    const exists = fs.existsSync(file.path);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file.name}`);
  });
  
  console.log('');
}

// Função para executar todos os tipos de teste
async function runAllTests() {
  console.log('\n🔄 Executando todos os tipos de teste...\n');
  
  const testSuites = ['hooks', 'components', 'services'];
  
  for (const suite of testSuites) {
    try {
      console.log(`\n📦 Executando testes de ${suite}...`);
      const config = testConfigs[suite];
      await runCommand(config.command, config.args);
    } catch (error) {
      console.error(`❌ Falha nos testes de ${suite}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Todos os testes foram executados com sucesso!');
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Se não há argumentos ou é help, mostrar ajuda
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  // Verificar arquivos de configuração
  if (command === 'check') {
    checkConfigFiles();
    return;
  }
  
  // Executar todos os testes
  if (command === 'all') {
    await runAllTests();
    return;
  }
  
  // Verificar se o comando existe
  if (!testConfigs[command]) {
    console.error(`\n❌ Comando '${command}' não encontrado.\n`);
    showHelp();
    process.exit(1);
  }
  
  // Executar comando específico
  try {
    const config = testConfigs[command];
    await runCommand(config.command, [...config.args, ...args.slice(1)]);
  } catch (error) {
    console.error('❌ Erro ao executar testes:', error.message);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  });
}

module.exports = {
  testConfigs,
  runCommand,
  checkConfigFiles,
  runAllTests
};