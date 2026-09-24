// RED COUNTY build — bundles src/main.js into docs/index.html for GitHub Pages
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

mkdirSync('docs', { recursive: true });

let tipSha = 'dev';
try { tipSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch {}

const minify = process.argv.includes('--min');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const buildId = `${pkg.version}-${createHash('sha256').update(readFileSync('src/main.js')).digest('hex').slice(0, 8)}`;

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify,
  sourcemap: false,
  write: false,
  logLevel: 'warning',
  define: {
    '__BUILD_ID__': JSON.stringify(buildId),
    '__TIP_SHA__': JSON.stringify(tipSha),
  },
});

let js = result.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>');
const css = readFileSync('src/style.css', 'utf8');
const shell = readFileSync('src/shell.html', 'utf8')
  .replace('/*__CSS__*/', css)
  .replace('/*__JS__*/', js)
  .replace(/__TIP_SHA__/g, tipSha)
  .replace(/__BUILD_ID__/g, buildId);

writeFileSync('docs/index.html', shell);
writeFileSync('docs/.nojekyll', '');
console.log(`built docs/index.html  tip=${tipSha}  build=${buildId}  bytes=${shell.length}`);
