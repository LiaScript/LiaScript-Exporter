#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

// Check if we're copying presets or public folder
const mode = process.argv[2];

if (mode === 'presets') {
  // Copy presets.yaml to dist/
  console.log('Copying presets.yaml...');
  fs.ensureDirSync('dist');
  fs.copyFileSync('src/presets.yaml', 'dist/presets.yaml');
  console.log('✓ Copied presets.yaml to dist/');
} else {
  // Copy public folder to dist/server/
  console.log('Copying server/public folder...');
  fs.ensureDirSync('dist/server');
  fs.copySync('src/server/public', 'dist/server/public');
  console.log('✓ Copied src/server/public to dist/server/public');
}
