import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('✦ [DreamzDecors] Starting backend & frontend...\n');

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(root, 'backend'),
  stdio: 'inherit',
  shell: true,
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(root, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
