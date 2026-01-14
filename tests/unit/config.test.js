import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';
import { ConfigManager } from '../../src/utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ConfigManager', () => {
  let configManager;
  let tempDir;

  beforeEach(async () => {
    configManager = new ConfigManager();
    tempDir = join(__dirname, 'temp-config-test');
    await mkdir(tempDir, { recursive: true });
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(__dirname);
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should load config from JS file', async () => {
      const configContent = `
        export default {
          packagesDir: 'libs',
          verbose: true,
          env: { NODE_ENV: 'test' }
        };
      `;
      
      await writeFile(
        join(tempDir, 'monorepo-builder.config.js'),
        configContent
      );

      await configManager.loadConfig();
      
      expect(configManager.get('packagesDir')).toBe('libs');
      expect(configManager.get('verbose')).toBe(true);
      expect(configManager.get('env')).toEqual({ NODE_ENV: 'test' });
    });

    it('should load config from JSON file', async () => {
      const configContent = {
        packagesDir: 'projects',
        verbose: false
      };
      
      await writeFile(
        join(tempDir, '.mr-builderrc.json'),
        JSON.stringify(configContent)
      );

      await configManager.loadConfig();
      
      expect(configManager.get('packagesDir')).toBe('projects');
      expect(configManager.get('verbose')).toBe(false);
    });

    it('should use default values when no config file exists', async () => {
      await configManager.loadConfig();
      
      expect(configManager.get('packagesDir')).toBe('packages');
      expect(configManager.get('buildDir')).toBe('dist');
      expect(configManager.get('verbose')).toBe(false);
    });

    it('should detect workspaces from package.json', async () => {
      const packageJson = {
        name: 'test-monorepo',
        workspaces: ['packages/*', 'apps/*']
      };
      
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      await configManager.loadConfig();
      
      expect(configManager.get('workspaces')).toEqual(['packages/*', 'apps/*']);
    });
  });

  describe('getPackagesConfig', () => {
    it('should return explicit packages config', async () => {
      configManager.setConfig({
        packages: ['./ui', './api']
      });
      
      const config = await configManager.getPackagesConfig();
      
      expect(config.type).toBe('explicit');
      expect(config.paths).toEqual(['./ui', './api']);
    });

    it('should return workspaces config', async () => {
      configManager.setConfig({
        workspaces: ['packages/*']
      });
      
      const config = await configManager.getPackagesConfig();
      
      expect(config.type).toBe('workspaces');
      expect(config.patterns).toEqual(['packages/*']);
    });

    it('should return directory config when packages directory exists', async () => {
      await mkdir(join(tempDir, 'packages'), { recursive: true });
      
      const config = await configManager.getPackagesConfig();
      
      expect(config.type).toBe('directory');
      expect(config.path).toBe('packages');
    });

    it('should return root config when only root package.json exists', async () => {
      const packageJson = {
        name: 'single-package',
        version: '1.0.0'
      };
      
      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const config = await configManager.getPackagesConfig();
      
      expect(config.type).toBe('root');
      expect(config.path).toBe('.');
    });

    it('should return none when no packages found', async () => {
      const config = await configManager.getPackagesConfig();
      
      expect(config.type).toBe('none');
      expect(config.paths).toEqual([]);
    });
  });

  describe('get methods', () => {
    beforeEach(async () => {
      configManager.setConfig({
        packagesDir: 'custom-packages',
        verbose: true,
        parallel: true,
        maxParallel: '8'
      });
    });

    it('should get custom config value', () => {
      expect(configManager.get('packagesDir')).toBe('custom-packages');
      expect(configManager.get('verbose')).toBe(true);
    });

    it('should get default config value when custom not set', () => {
      expect(configManager.get('buildDir')).toBe('dist');
      expect(configManager.get('sourceDir')).toBe('src');
    });

    it('should get all config', () => {
      const allConfig = configManager.getAll();
      
      expect(allConfig.packagesDir).toBe('custom-packages');
      expect(allConfig.buildDir).toBe('dist');
      expect(allConfig.verbose).toBe(true);
    });

    it('should get boolean flags', () => {
      expect(configManager.isVerbose()).toBe(true);
      expect(configManager.isSilent()).toBe(false);
      expect(configManager.isParallel()).toBe(true);
    });

    it('should get max parallel as number', () => {
      expect(configManager.getMaxParallel()).toBe(8);
    });

    it('should get environment variables', () => {
      process.env.CUSTOM_ENV = 'test';
      configManager.setConfig({ env: { NODE_ENV: 'production' } });
      
      const env = configManager.getEnv();
      
      expect(env.NODE_ENV).toBe('production');
      expect(env.CUSTOM_ENV).toBe('test');
    });
  });
});