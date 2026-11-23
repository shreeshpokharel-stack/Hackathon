import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const outDir = path.join(root, 'public', 'downloads');
fs.mkdirSync(outDir, { recursive: true });

// 1. Build Vite production assets first to obtain compiled Tailwind CSS
execFileSync('npx', ['vite', 'build'], { cwd: root, stdio: 'inherit' });

const distAssetsDir = path.join(root, 'dist', 'assets');
const cssFile = fs.readdirSync(distAssetsDir).find((f) => f.endsWith('.css'));
if (!cssFile) {
  throw new Error('Expected compiled CSS file in dist/assets');
}
const compiledCss = fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf8');

// 2. Bundle React + TypeScript app into a single classic IIFE script (works both over HTTP and file://)
const bundled = await build({
  entryPoints: [path.join(root, 'src', 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  plugins: [
    {
      name: 'ignore-css',
      setup(b) {
        b.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      }
    }
  ]
});

const jsCode = bundled.outputFiles[0].text;
// Escape closing script tags safely if any appear inside string literals
const safeJs = jsCode.replace(/<\/script>/gi, '<\\/script>');

const standaloneHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Echoes of Tomorrow — Temporal Puzzle Adventure</title>
    <meta name="description" content="Bridge Past (2089) and Future (2189) in a simultaneous split-screen temporal puzzle platformer." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>${compiledCss}</style>
  </head>
  <body data-state="title">
    <div id="root"></div>
    <script>${safeJs}</script>
  </body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), standaloneHtml, 'utf8');

// 3. Package clean source repository ZIP using Python's built-in zipfile module
const readmeContent = `# Echoes of Tomorrow — Temporal Puzzle Adventure

Simultaneous split-screen **Past (2089)** & **Future (2189)** puzzle-platformer featuring a Princess of Persia–inspired temporal acrobat, Chrono Shift (\`Q\`), Temporal Freeze (\`F\`), Butterfly Effects, and 3 interconnected levels.

## Quick Run (Source)
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build for Static Hosting
\`\`\`bash
npm run build
\`\`\`

## Controls
- \`A\` / \`D\` or \`←\` / \`→\`: Move (synced across Past & Future)
- \`Space\` / \`W\` / \`↑\`: Jump
- \`E\`: Interact (free wildlife, plant seeds, collapse supports, activate conduits)
- \`Q\`: Chrono Shift between 2089 and 2189
- \`F\`: Temporal Freeze (5s, freezes Future drones)
- \`R\`: Reset current level
- \`Esc\` / \`P\`: Pause menu
`;

const zipPath = path.join(outDir, 'echoes-of-tomorrow-source.zip');
const pyScript = `
import os, zipfile

root = ${JSON.stringify(root)}
zip_path = ${JSON.stringify(zipPath)}
readme = ${JSON.stringify(readmeContent)}

top_files = ['index.html', 'package.json', 'tsconfig.json', 'vite.config.ts', '.gitignore', 'metadata.json']

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('README.md', readme)
    for f in top_files:
        p = os.path.join(root, f)
        if os.path.isfile(p):
            zf.write(p, f)
    src_dir = os.path.join(root, 'src')
    for dirpath, _, filenames in os.walk(src_dir):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root)
            zf.write(full, rel)
`;

execFileSync('python3', ['-c', pyScript], { cwd: root, stdio: 'inherit' });
console.log('Generated downloads in public/downloads/');
