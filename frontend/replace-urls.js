const fs = require('fs');
const path = require('path');

const API_VAR = "${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}";

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace instances that are already in template literals (e.g. `http://127.0.0.1:4000/api/...`)
  content = content.replace(/`http:\/\/127\.0\.0\.1:4000/g, '`' + API_VAR);

  // Replace instances in single quotes (e.g. 'http://127.0.0.1:4000/api/...')
  // We need to change the single quotes to backticks so the template literal works
  content = content.replace(/'http:\/\/127\.0\.0\.1:4000([^']*)'/g, '`' + API_VAR + '$1`');
  
  // Replace instances in double quotes (e.g. "http://127.0.0.1:4000/api/...")
  content = content.replace(/"http:\/\/127\.0\.0\.1:4000([^"]*)"/g, '`' + API_VAR + '$1`');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done replacing API URLs!');
