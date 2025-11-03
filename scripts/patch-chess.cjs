#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chessJsDir = path.join(__dirname, '..', 'node_modules', 'chess.js');
const projectRoot = path.join(__dirname, '..');

const patches = [
  {
    name: 'TypeScript source (src/chess.ts)',
    patchFile: path.join(projectRoot, 'chess.js.ts.patch'),
  },
  {
    name: 'Node types (src/node.ts)',
    patchFile: path.join(projectRoot, 'chess.js.node.patch'),
  },
  {
    name: 'CommonJS build (dist/cjs/chess.js)',
    patchFile: path.join(projectRoot, 'chess.js.cjs.patch'),
  },
  {
    name: 'ESM build (dist/esm/chess.js)',
    patchFile: path.join(projectRoot, 'chess.js.esm.patch'),
  },
];

console.log('Applying chess.js patches...\n');

let applied = 0;
let failed = 0;

for (const { name, patchFile } of patches) {
  if (!fs.existsSync(patchFile)) {
    console.warn(`Patch file not found: ${patchFile}`);
    failed++;
    continue;
  }

  try {
    console.log(`Applying ${name}...`);
    execSync(`patch -p0 --no-backup-if-mismatch < "${patchFile}"`, {
      cwd: chessJsDir,
      stdio: 'pipe',
      timeout: 5000,
    });
    console.log(`✓ ${name} patched successfully\n`);
    applied++;
  } catch (error) {
    console.warn(`Could not patch ${name} (may already be patched)`);
    failed++;
  }
}

console.log(`Results: ${applied} file(s) patched, ${failed} file(s) skipped/failed\n`);
process.exit(0);
