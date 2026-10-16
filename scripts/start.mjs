// Root `pnpm start`.
// On Railway each service runs this same repo, so start only the app that matches the service
// (RAILWAY_SERVICE_NAME, or APP to override): the `web` service must not try to boot the API.
// Anywhere else (local), start everything through turbo as before.
import { spawnSync } from 'node:child_process';

const APPS = ['api', 'web'];
const app = (process.env.APP ?? process.env.RAILWAY_SERVICE_NAME ?? '').trim().toLowerCase();

const [command, args] = APPS.includes(app)
  ? ['pnpm', ['--filter', app, 'start']]
  : ['pnpm', ['exec', 'turbo', 'run', 'start']];

if (process.env.RAILWAY_SERVICE_NAME && !APPS.includes(app)) {
  console.warn(`[start] Railway service "${process.env.RAILWAY_SERVICE_NAME}" is not named api or web; set APP=api or APP=web. Starting both apps.`);
}

const result = spawnSync(command, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
