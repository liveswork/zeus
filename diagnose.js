// Crie um arquivo: diagnose.js na raiz do projeto
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico do projeto React...\n');

// 1. Verifica index.html
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  const hasRootDiv = htmlContent.includes('id="root"');
  console.log('✅ index.html:', hasRootDiv ? 'Tem div#root' : '❌ Sem div#root');
  
  // Verifica se há múltiplas divs root
  const rootCount = (htmlContent.match(/id="root"/g) || []).length;
  if (rootCount > 1) {
    console.log(`⚠️  ENCONTRADO: ${rootCount} elementos com id="root"`);
  }
} else {
  console.log('❌ index.html não encontrado');
}

// 2. Verifica main.tsx/index.tsx
const possibleEntries = ['src/main.tsx', 'src/index.tsx', 'src/main.jsx', 'src/index.jsx'];
let foundEntry = null;

for (const entry of possibleEntries) {
  const entryPath = path.join(__dirname, entry);
  if (fs.existsSync(entryPath)) {
    foundEntry = entryPath;
    console.log(`✅ Entry point encontrado: ${entry}`);
    
    const content = fs.readFileSync(entryPath, 'utf8');
    
    // Verifica ReactDOM.createRoot
    if (content.includes('ReactDOM.createRoot')) {
      console.log('✅ Usando React 18+ (createRoot)');
    } else if (content.includes('ReactDOM.render')) {
      console.log('⚠️  Usando React 17 (render) - considere atualizar');
    }
    
    // Verifica StrictMode
    const strictModeCount = (content.match(/React.StrictMode/g) || []).length;
    console.log(`ℹ️  StrictMode encontrado ${strictModeCount} vez(es)`);
    
    break;
  }
}

if (!foundEntry) {
  console.log('❌ Nenhum entry point encontrado');
}

// 3. Verifica se há múltiplos renders
console.log('\n📁 Estrutura do projeto:');
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  const files = fs.readdirSync(srcPath);
  console.log(`Arquivos em src/: ${files.length}`);
  
  // Verifica por múltiplos providers
  const providerFiles = files.filter(f => f.includes('Provider'));
  if (providerFiles.length > 0) {
    console.log(`Provider files: ${providerFiles.join(', ')}`);
  }
}

console.log('\n🎯 Recomendações:');
console.log('1. Execute: rm -rf node_modules/.vite dist');
console.log('2. Execute: npm install');
console.log('3. Execute: npm run dev');