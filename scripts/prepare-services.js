import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

console.log('=== Prepare Services Debug ===');
console.log('Script location:', __filename);
console.log('Root directory:', rootDir);
console.log('===============================\n');

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
    console.log(`  Working directory: ${service.path}`);
    run('npm', args, service.path, { ...process.env, npm_config_loglevel: 'error' });
  }

  for (const pkg of service.requiredPackages) {
    const pkgPath = join(modulesPath, pkg, 'package.json');
    console.log(`  Checking ${pkg} at: ${pkgPath}`);
    if (!existsSync(pkgPath)) {
      console.log(`  ${pkg} missing for ${service.name}, installing directly...`);
      run('npm', ['install', pkg, '--save'], service.path, { ...process.env, npm_config_loglevel: 'error' });
      
      // Re-check after install
      if (!existsSync(pkgPath)) {
        console.error(`  ERROR: Still cannot find ${pkgPath}`);
        console.error(`  node_modules exists: ${existsSync(modulesPath)}`);
        console.error(`  ${pkg} folder exists: ${existsSync(join(modulesPath, pkg))}`);
        throw new Error(`Missing required package '${pkg}' for ${service.name} even after install`);
      } else {
        console.log(`  ✓ ${pkg} installed successfully`);
      }
    } else {
      console.log(`  ✓ ${pkg} already present`);
    }
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
