import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const services = [
  {
    name: 'backend',
    path: join(rootDir, 'services', 'backend'),
    needsBuild: true,
    devDeps: ['typescript', 'ts-node', 'tsx'],
    requiredPackages: []
  },
  {
    name: 'pipeline',
    path: join(rootDir, 'services', 'pipeline'),
    needsBuild: false,
    devDeps: [],
    requiredPackages: ['express']
  },
  {
    name: 'scraper',
    path: join(rootDir, 'services', 'scraper'),
    needsBuild: false,
    devDeps: [],
    requiredPackages: ['express']
  }
];

const run = (cmd, args, cwd, env = process.env) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', env });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}`);
  }
};

const ensureInstall = (service) => {
  const modulesPath = join(service.path, 'node_modules');
  const hasModules = existsSync(modulesPath);
  const missingDev = service.devDeps.some((dep) => !existsSync(join(modulesPath, dep)));
  const missingPackages = service.requiredPackages.some((dep) => !existsSync(join(modulesPath, dep)));

  if (!hasModules || missingDev || missingPackages) {
    const args = ['install'];
    if (service.devDeps.length > 0) {
      args.push('--include=dev');
    }
    console.log(`Installing dependencies for ${service.name}...`);
    run('npm', args, service.path, { ...process.env, npm_config_loglevel: 'error' });
  }
};

const ensureBuild = (service) => {
  if (!service.needsBuild) {
    return;
  }
  const distEntry = join(service.path, 'dist', 'index.js');
  if (!existsSync(distEntry)) {
    console.log(`Building ${service.name}...`);
    run('npm', ['run', 'build'], service.path);
  }
};

try {
  for (const service of services) {
    ensureInstall(service);
    ensureBuild(service);
  }
  console.log('Service preparation complete.');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
