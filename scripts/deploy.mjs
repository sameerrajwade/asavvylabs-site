#!/usr/bin/env node
/**
 * Build, check and publish _site/ to the gh-pages branch (what GitHub Pages
 * serves until the Actions workflow in ci/pages.yml is switched on).
 *   node scripts/deploy.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, cwd = ROOT) => execSync(cmd, { cwd, stdio: 'inherit' });
run('node scripts/build.mjs');
const sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
const remote = execSync('git remote get-url origin', { cwd: ROOT }).toString().trim();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-pages-'));
fs.cpSync(path.join(ROOT, '_site'), tmp, { recursive: true });
run('git init -q -b gh-pages', tmp);
run('git add -A', tmp);
run(`git -c user.name="site-deploy" -c user.email="noreply@savvylabs.dev" commit -q -m "Deploy ${sha}"`, tmp);
run(`git push -q -f ${remote} gh-pages`, tmp);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ Deployed ${sha} to gh-pages`);
