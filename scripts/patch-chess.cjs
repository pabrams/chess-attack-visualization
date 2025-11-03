#!/usr/bin/env node

/**
 * Post-install script to apply custom patches to chess.js
 * Attempts to use the unified diff patches via the patch command
 */

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
    console.warn(`⚠️  Patch file not found: ${patchFile}`);
    failed++;
    continue;
  }

  try {
    console.log(`Applying ${name}...`);
    // Use -p0 for relative paths, --no-backup-if-mismatch to skip backup
    execSync(`patch -p0 --no-backup-if-mismatch < "${patchFile}"`, {
      cwd: chessJsDir,
      stdio: 'pipe',
      timeout: 5000,
    });
    console.log(`✓ ${name} patched successfully\n`);
    applied++;
  } catch (error) {
    // Don't fail the install if patching fails - log and continue
    console.error(`⚠️  Could not patch ${name} (may already be patched)`);
    console.error(`   See CHESS_JS_PATCHING.md for manual patching instructions\n`);
    failed++;
  }
}

console.log(`Results: ${applied} file(s) patched, ${failed} file(s) skipped/failed\n`);

// Don't exit with error - patches can be applied manually
process.exit(0);
