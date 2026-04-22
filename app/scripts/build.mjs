import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(root, 'src/main.ts'), join(root, 'src/test-components.ts')],
  outdir: join(root, 'www/js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  sourcemap: true,
  logLevel: 'info',
});
