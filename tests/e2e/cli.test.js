import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execa } from 'execa';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CLI End-to-End Tests', () => {
  let tempDir;
  let cliPath;

  beforeAll(async () => {
    // Get the path to the CLI
    cliPath = join(process.cwd(), 'bin', 'mr-builder.js');
    
    // Create temporary directory for tests
    tempDir = await mkdtemp(join(tmpdir(), 'mr-builder-e2e-'));
  });

  afterAll(async () => {
    // Cleanup
    await rm(tempDir, { recursive: true, force: true });
  });

  const runCLI = async (args, cwd = tempDir) => {
    try {
      const { stdout, stderr, exitCode } = await execa('node', [cliPath, ...args], {
        cwd,
        reject: false
      });
      return { stdout, stderr, exitCode };
    } catch (error) {
      return {
        stdout: error.stdout,
        stderr: error.stderr,
        exitCode: error.exitCode
      };
    }
  };

  const createTestMonorepo = async () => {
    // Create packages directory
    await mkdir(join(tempDir, 'packages'), { recursive: true });

    // Create utils package
    await mkdir(join(tempDir, 'packages', 'utils'), { recursive: true });
    await writeFile(
      join(tempDir, 'packages', 'utils', 'package.json'),
      JSON.stringify({
        name: 'utils',
        version: '1.0.0',
        scripts: {
          build: 'echo "Building utils" && mkdir -p dist && echo "utils" > dist/built.txt',
          clean: 'rm -rf dist'
        }
      }, null, 2)
    );

    // Create ui package that depends on utils
    await mkdir(join(tempDir, 'packages', 'ui'), { recursive: true });
    await writeFile(
      join(tempDir, 'packages', 'ui', 'package.json'),
      JSON.stringify({
        name: 'ui',
        version: '1.0.0',
        scripts: {
          build: 'echo "Building ui" && mkdir -p dist && echo "ui" > dist/built.txt',
          clean: 'rm -rf dist'
        },
        dependencies: {
          utils: '1.0.0'
        }
      }, null, 2)
    );

    // Create config file
    await writeFile(
      join(tempDir, 'monorepo-builder.config.js'),
      `export default {
        packagesDir: 'packages',
        verbose: false
      };`
    );
  };

  it('should show help when no arguments', async () => {
    const { stdout, exitCode } = await runCLI([]);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Commands:');
    expect(stdout).toContain('build');
    expect(stdout).toContain('clean');
    expect(stdout).toContain('watch');
    expect(stdout).toContain('deps');
  });

  it('should show version', async () => {
    const { stdout, exitCode } = await runCLI(['--version']);
    
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it('should build all packages', async () => {
    await createTestMonorepo();
    
    const { stdout, exitCode } = await runCLI(['build', '--all']);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Starting monorepo build');
    expect(stdout).toContain('Discovered 2 package(s)');
    expect(stdout).toContain('Build order:');
    expect(stdout).toContain('Build Summary');
    expect(stdout).toContain('All packages built successfully');
  });

  it('should build specific packages', async () => {
    await createTestMonorepo();
    
    const { stdout, exitCode } = await runCLI(['build', '-p', 'ui']);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Building specific packages: ui');
  });

  it('should clean packages', async () => {
    await createTestMonorepo();
    
    // First build to create dist directories
    await runCLI(['build', '--all']);
    
    const { stdout, exitCode } = await runCLI(['clean', '--all', '--force']);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Cleaning monorepo packages');
    expect(stdout).toContain('Cleaned 2 package(s) successfully');
  });

  it('should show dependencies', async () => {
    await createTestMonorepo();
    
    const { stdout, exitCode } = await runCLI(['deps']);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Analyzing package dependencies');
    expect(stdout).toContain('Found 2 package(s)');
    expect(stdout).toContain('utils');
    expect(stdout).toContain('ui');
  });

  it('should show dependencies as JSON', async () => {
    await createTestMonorepo();
    
    const { stdout, exitCode } = await runCLI(['deps', '--json']);
    
    expect(exitCode).toBe(0);
    
    // Parse JSON output
    const json = JSON.parse(stdout);
    expect(json).toHaveProperty('utils');
    expect(json).toHaveProperty('ui');
    expect(json.ui.dependencies).toContain('utils');
  });

  it('should show tree view', async () => {
    await createTestMonorepo();
    
    const { stdout, exitCode } = await runCLI(['deps', '--tree']);
    
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Dependency Tree');
    expect(stdout).toContain('utils');
    expect(stdout).toContain('ui');
  });

  it('should handle missing packages directory', async () => {
    // Create temp dir without packages
    const emptyDir = await mkdtemp(join(tmpdir(), 'empty-'));
    await writeFile(
      join(emptyDir, 'monorepo-builder.config.js'),
      'export default { packagesDir: \'packages\' };'
    );
    
    const { stdout, exitCode } = await runCLI(['build', '--all'], emptyDir);
    
    expect(exitCode).toBe(0); // Should exit gracefully, not with error
    expect(stdout).toContain('No packages found');
    
    await rm(emptyDir, { recursive: true, force: true });
  });
});