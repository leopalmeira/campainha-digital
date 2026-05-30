const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src');

function replaceInDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const targetStr = "const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';";
      const targetStr2 = "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';";
      
      let changed = false;
      if (content.includes(targetStr)) {
        content = content.replace(targetStr, "const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');");
        changed = true;
      }
      if (content.includes(targetStr2)) {
        content = content.replace(targetStr2, "const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');");
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}

replaceInDir(dir);
console.log('Done.');
