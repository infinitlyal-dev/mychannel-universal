import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const vitestBin = resolve(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');

const env = {
  ...process.env,
  RUN_LIVE_ELEVENLABS: process.env.RUN_LIVE_ELEVENLABS ?? '1',
};

const result = spawnSync(
  process.execPath,
  [vitestBin, 'run', '--config', 'vitest.integration.config.ts'],
  {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);
