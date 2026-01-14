import { mkdtemp, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export class TestEnvironment {
  constructor() {
    this.tempDir = null;
    this.originalCwd = process.cwd();
  }

  async create() {
    this.tempDir = await mkdtemp(join(tmpdir(), 'mr-builder-test-'));
    return this.tempDir;
  }

  async destroy() {
    if (this.tempDir) {
      // Cleanup handled by OS for temp directories
      process.chdir(this.originalCwd);
      this.tempDir = null;
    }
  }

  async createPackage(name, dependencies = {}, scripts = {}) {
    const packageDir = join(this.tempDir, 'packages', name);
    await mkdir(packageDir, { recursive: true });

    const packageJson = {
      name,
      version: '1.0.0',
      scripts: {
        build: 'echo "Building package"',
        clean: 'rm -rf dist',
        ...scripts
      },
      dependencies,
      main: 'index.js'
    };

    await writeFile(
      join(packageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create source directory
    await mkdir(join(packageDir, 'src'), { recursive: true });
    await writeFile(
      join(packageDir, 'src', 'index.js'),
      `export default '${name}';`
    );

    return packageDir;
  }

  async createConfig(config = {}) {
    const configPath = join(this.tempDir, 'monorepo-builder.config.js');
    await writeFile(
      configPath,
      `export default ${JSON.stringify(config, null, 2)};`
    );
    return configPath;
  }

  async createRootPackage(workspaces = []) {
    const packageJson = {
      name: 'test-monorepo',
      version: '1.0.0',
      private: true,
      workspaces
    };

    await writeFile(
      join(this.tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async changeToTempDir() {
    process.chdir(this.tempDir);
  }

  getTempDir() {
    return this.tempDir;
  }
}

export const mockExeca = (success = true, output = '', error = '') => {
  return {
    command: jest.fn().mockImplementation(() => ({
      stdout: output,
      stderr: error,
      exitCode: success ? 0 : 1
    }))
  };
};

export const createMockPackage = (name, path, dependencies = {}) => ({
  name,
  path,
  relativePath: `packages/${name}`,
  json: {
    name,
    version: '1.0.0',
    scripts: { build: 'npm run build' },
    dependencies
  },
  dependencies,
  scripts: { build: 'npm run build' }
});