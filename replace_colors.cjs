const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const map = {
  'bg-blue-': 'bg-emerald-',
  'text-blue-': 'text-emerald-',
  'border-blue-': 'border-emerald-',
  'ring-blue-': 'ring-emerald-',
  'shadow-blue-': 'shadow-emerald-',
  'from-blue-': 'from-emerald-',
  'to-blue-': 'to-emerald-',
  'selection:bg-blue-': 'selection:bg-emerald-',
};

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // simple replace logic
    Object.keys(map).forEach(key => {
      const val = map[key];
      // match exact prefix
      const regex = new RegExp(key + '(\\d+)', 'g');
      content = content.replace(regex, val + '$1');
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
