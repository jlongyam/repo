import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PackageBuilder } from '../../src/core/builder.js';
import { Logger } from '../../src/utils/logger.js';
import execa from 'execa';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

jest.mock('execa');

describe('PackageBuilder', () => {
  let builder;
  let logger;
  let tempDir;

  beforeEach(async () => {
    logger = new Logger({ silent: true });
    builder = new PackageBuilder({ logger });
    tempDir = join(__dirname, 'temp-builder-test');
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  const createMockPackage = (name, scripts = {}) => ({
    name,
    path: join(tempDir, 'packages', name),
    relativePath: `packages/${name}`,
    json: {
      name,
      version: '1.0.0',
      scripts
    },
    scripts
  });

  describe('buildPackage', () => {
    it('should successfully build package', async () => {
      const mockPackage = createMockPackage('test-package', {
        build: 'echo "Building test-package"'
      });

      execa.command.mockResolvedValueOnce({
        stdout: 'Build output',
        stderr: ''
      });

      const result = await builder.buildPackage('test-package', mockPackage);

      expect(result.success).toBe(true);
      expect(result.package).toBe('test-package');
      expect(result.duration).toBeDefined();
      expect(execa.command).toHaveBeenCalledWith(
        'echo "Building test-package"',
        expect.objectContaining({
          cwd: mockPackage.path,
          shell: true
        })
      );
    });

    it('should handle build failure', async () => {
      const mockPackage = createMockPackage('test-package', {
        build: 'exit 1'
      });

      const mockError = new Error('Build failed');
      mockError.exitCode = 1;
      execa.command.mockRejectedValueOnce(mockError);

      const result = await builder.buildPackage('test-package', mockPackage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Build failed');
      expect(result.code).toBe(1);
    });

    it('should handle timeout', async () => {
      const mockPackage = createMockPackage('test-package', {
        build: 'sleep 10'
      });

      const mockError = new Error('Command timed out');
      mockError.timedOut = true;
      execa.command.mockRejectedValueOnce(mockError);

      const result = await builder.buildPackage('test-package', mockPackage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command timed out');
    });

    it('should skip package without build command', async () => {
      const mockPackage = createMockPackage('test-package', {});

      const result = await builder.buildPackage('test-package', mockPackage);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(execa.command).not.toHaveBeenCalled();
    });

    it('should use custom build command from config', async () => {
      // Mock config.get to return package-specific config
      const config = {
        get: jest.fn((key) => {
          if (key === 'packageConfigs') {
            return {
              'test-package': {
                buildCommand: 'custom build command'
              }
            };
          }
          return null;
        })
      };

      jest.mock('../../src/utils/config.js', () => ({
        config
      }));

      const mockPackage = createMockPackage('test-package', {});

      execa.command.mockResolvedValueOnce({
        stdout: 'Build output',
        stderr: ''
      });

      const result = await builder.buildPackage('test-package', mockPackage);

      expect(result.success).toBe(true);
      expect(execa.command).toHaveBeenCalledWith(
        'custom build command',
        expect.any(Object)
      );
    });
  });

  describe('cleanPackage', () => {
    it('should clean package with custom clean command', async () => {
      const mockPackage = createMockPackage('test-package', {
        clean: 'rm -rf dist'
      });

      execa.command.mockResolvedValueOnce({
        stdout: '',
        stderr: ''
      });

      await builder.cleanPackage('test-package', mockPackage);

      expect(execa.command).toHaveBeenCalledWith(
        'rm -rf dist',
        expect.objectContaining({
          cwd: mockPackage.path
        })
      );
    });

    it('should handle clean failure', async () => {
      const mockPackage = createMockPackage('test-package', {
        clean: 'exit 1'
      });

      const mockError = new Error('Clean failed');
      execa.command.mockRejectedValueOnce(mockError);

      await expect(
        builder.cleanPackage('test-package', mockPackage)
      ).rejects.toThrow('Clean failed');
    });
  });

  describe('watchPackage', () => {
    it('should start watch process', async () => {
      const mockPackage = createMockPackage('test-package', {
        watch: 'npm run watch'
      });

      const mockChildProcess = {
        on: jest.fn(),
        killed: false
      };

      execa.command.mockReturnValueOnce(mockChildProcess);

      const process = await builder.watchPackage('test-package', mockPackage);

      expect(process).toBe(mockChildProcess);
      expect(execa.command).toHaveBeenCalledWith(
        'npm run watch',
        expect.objectContaining({
          cwd: mockPackage.path,
          stdio: 'inherit'
        })
      );
    });

    it('should throw error when no watch command', async () => {
      const mockPackage = createMockPackage('test-package', {});

      await expect(
        builder.watchPackage('test-package', mockPackage)
      ).rejects.toThrow('No watch command found');
    });
  });
});