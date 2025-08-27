const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para corrigir um arquivo de teste
function fixTestFile(filePath) {
  console.log(`Corrigindo: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Substituir importação do vitest
  const vitestImportRegex = /import\s*{([^}]+)}\s*from\s*['"]vitest['"]/g;
  if (vitestImportRegex.test(content)) {
    content = content.replace(vitestImportRegex, (match, imports) => {
      // Remover 'vi' da lista de importações e adicionar jest/globals
      const cleanImports = imports
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp !== 'vi')
        .join(', ');
      
      return `import { ${cleanImports} } from '@jest/globals'`;
    });
    modified = true;
  }
  
  // Substituir todas as ocorrências de vi.fn() por jest.fn()
  if (content.includes('vi.fn()')) {
    content = content.replace(/vi\.fn\(\)/g, 'jest.fn()');
    modified = true;
  }
  
  // Substituir outras funções do vi
  const viMethods = [
    'clearAllMocks',
    'resetAllMocks',
    'restoreAllMocks',
    'spyOn',
    'mock',
    'unmock',
    'doMock',
    'dontMock'
  ];
  
  viMethods.forEach(method => {
    const regex = new RegExp(`vi\.${method}`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `jest.${method}`);
      modified = true;
    }
  });
  
  // Substituir vi.mocked por jest.mocked
  if (content.includes('vi.mocked')) {
    content = content.replace(/vi\.mocked/g, 'jest.mocked');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Arquivo corrigido: ${filePath}`);
  } else {
    console.log(`ℹ️  Nenhuma alteração necessária: ${filePath}`);
  }
}

// Encontrar todos os arquivos de teste
const testFiles = glob.sync('src/**/*.test.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true
});

console.log(`Encontrados ${testFiles.length} arquivos de teste`);
console.log('Iniciando correção...');

testFiles.forEach(fixTestFile);

console.log('\n✅ Correção concluída!');
console.log('\nPróximos passos:');
console.log('1. Execute: npm test');
console.log('2. Verifique se todos os testes estão funcionando');