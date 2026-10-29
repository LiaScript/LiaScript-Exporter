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
} else if (mode === 'h5p') {
  // The H5P.LiaScript library's own files, see src/export/h5p.ts
  console.log('Copying the H5P library...');
  fs.ensureDirSync('dist/assets');
  fs.copySync('src/export/h5p-library', 'dist/assets/h5p-library');
  console.log('✓ Copied src/export/h5p-library to dist/assets/h5p-library');
} else {
  // Copy public folder to dist/server/
  console.log('Copying server/public folder...');
  fs.ensureDirSync('dist/server');
  fs.copySync('src/server/public', 'dist/server/public');
  const index = 'dist/server/public/index.html';
  const version = require('../package.json').version;
  fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replace(
    '<p id="exporter-version"></p>', `<p id="exporter-version">Version ${version}</p>`));
  console.log('✓ Copied src/server/public to dist/server/public');
}
