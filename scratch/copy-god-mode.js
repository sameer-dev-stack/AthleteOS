const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'athleteos-god-mode', 'src');
const destDir = path.join(__dirname, '..', 'components', 'admin', 'god-mode');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 1. Copy and modify components
const componentsSrcDir = path.join(srcDir, 'components');
const files = fs.readdirSync(componentsSrcDir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const srcPath = path.join(componentsSrcDir, file);
    const destPath = path.join(destDir, file);
    
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // Perform replacements
    content = content.replace(/['"]\.\.\/supabase['"]/g, "'./supabase'");
    content = content.replace(/['"]\.\.\/types['"]/g, "'./types'");
    content = content.replace(/#BEF264/g, '#C6FF3D');
    content = content.replace(/\[#BEF264\]/g, '[#C6FF3D]');
    content = content.replace(/['"]motion\/react['"]/g, "'framer-motion'");
    
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`Copied and modified component: ${file}`);
  }
});

// 2. Copy and modify types.ts
const typesSrcPath = path.join(srcDir, 'types.ts');
const typesDestPath = path.join(destDir, 'types.ts');
if (fs.existsSync(typesSrcPath)) {
  fs.copyFileSync(typesSrcPath, typesDestPath);
  console.log('Copied types.ts');
}

// 3. Copy and modify supabase.ts (API client)
const subSrcPath = path.join(srcDir, 'supabase.ts');
const subDestPath = path.join(destDir, 'supabase.ts');
if (fs.existsSync(subSrcPath)) {
  let content = fs.readFileSync(subSrcPath, 'utf8');
  content = content.replace(/const API_BASE = '\/api';/g, "const API_BASE = '/api/admin';");
  fs.writeFileSync(subDestPath, content, 'utf8');
  console.log('Copied and modified supabase.ts');
}

console.log('God Mode component migration script complete.');
