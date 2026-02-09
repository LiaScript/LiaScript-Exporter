#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.js');

console.log('Adding shebang to dist/index.js...');

// Read the file
const content = fs.readFileSync(indexPath, 'utf8');

// Add shebang if not already present
if (!content.startsWith('#!')) {
  const newContent = '#!/usr/bin/env node\n\n' + content;
  fs.writeFileSync(indexPath, newContent, 'utf8');
  console.log('✓ Shebang added to dist/index.js');
  
  // Make executable on Unix-like systems
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(indexPath, '755');
      console.log('✓ Made dist/index.js executable');
    } catch (err) {
      console.warn('Warning: Could not make file executable:', err.message);
    }
  }
} else {
  console.log('✓ Shebang already present in dist/index.js');
}
