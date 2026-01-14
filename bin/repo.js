#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

// Import commands dynamically
const loadCommand = async (commandName) => {
  const module = await import(`../src/commands/${commandName}.js`);
  return module.default;
};

const main = async () => {
  const buildCommand = await loadCommand('build');
  const cleanCommand = await loadCommand('clean');
  const watchCommand = await loadCommand('watch');
  const depsCommand = await loadCommand('deps');

  program
    .name('mr-builder')
    .description('ES6 Monorepo Builder CLI')
    .version(packageJson.version);

  // Build command
  program
    .command('build')
    .description('Build packages in dependency order')
    .option('-p, --packages <packages...>', 'Specific packages to build')
    .option('-a, --all', 'Build all packages')
    .option('-s, --skip-deps', 'Skip building dependencies')
    .option('-c, --config <path>', 'Path to config file')
    .option('-v, --verbose', 'Verbose output')
    .option('-p, --parallel', 'Build packages in parallel')
    .option('-m, --max-parallel <number>', 'Maximum parallel builds', '4')
    .action(buildCommand);

  // Clean command
  program
    .command('clean')
    .description('Clean build artifacts')
    .option('-p, --packages <packages...>', 'Specific packages to clean')
    .option('-a, --all', 'Clean all packages')
    .option('-f, --force', 'Force clean without confirmation')
    .action(cleanCommand);

  // Watch command
  program
    .command('watch')
    .description('Watch packages for changes and rebuild')
    .option('-p, --packages <packages...>', 'Specific packages to watch')
    .option('-i, --ignore <patterns...>', 'Ignore patterns')
    .action(watchCommand);

  // Dependencies command
  program
    .command('deps')
    .description('Show dependency graph')
    .option('-v, --visual', 'Show visual representation')
    .option('-t, --tree', 'Show as tree view')
    .option('-j, --json', 'Output as JSON')
    .action(depsCommand);

  // Init command
  program
    .command('init')
    .description('Initialize monorepo builder configuration')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(async (options) => {
      const initCommand = await loadCommand('init');
      await initCommand(options);
    });

  // If no arguments, show help
  if (process.argv.length === 2) {
    program.help();
  }

  program.parse(process.argv);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('× CLI Error:', error.message);
  process.exit(1);
});