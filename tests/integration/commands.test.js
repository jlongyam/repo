import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestEnvironment } from '../utils/test-helpers.js';
import buildCommand from '../../src/commands/build.js';
import cleanCommand from '../../src/commands/clean.js';
import depsCommand from '../../src/commands/deps.js';

describe('Commands', () => {
  let testEnv;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.create();
    await testEnv.changeToTempDir();
  });

  afterEach(async () => {
    await testEnv.destroy();
  });

  describe('build command', () => {
    it('should build all packages', async () => {
      // Create test packages
      await testEnv.createPackage('utils', {});
      await testEnv.createPackage('ui', { utils: '^1.0.0' });
      
      // Mock execa to simulate successful builds
      jest.mock('execa', () => ({
        command: jest.fn().mockResolvedValue({
          stdout: 'Build successful',
          stderr: ''
        })
      }));

      const options = {
        all: true,
        verbose: false
      };

      await expect(buildCommand(options)).resolves.not.toThrow();
    });

    it('should handle build failure', async () => {
      await testEnv.createPackage('test-package', {});

      // Mock execa to simulate build failure
      jest.mock('execa', () => ({
        command: jest.fn().mockRejectedValue(new Error('Build failed'))
      }));

      const options = {
        all: true,
        verbose: false
      };

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      await buildCommand(options);

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(consoleError).toHaveBeenCalled();

      mockExit.mockRestore();
      consoleError.mockRestore();
    });
  });

  describe('clean command', () => {
    it('should clean packages', async () => {
      await testEnv.createPackage('test-package', {});

      // Mock inquirer to auto-confirm
      jest.mock('inquirer', () => ({
        prompt: jest.fn().mockResolvedValue({ confirm: true })
      }));

      // Mock execa for clean command
      jest.mock('execa', () => ({
        command: jest.fn().mockResolvedValue({
          stdout: '',
          stderr: ''
        })
      }));

      const options = {
        all: true,
        force: false
      };

      await expect(cleanCommand(options)).resolves.not.toThrow();
    });
  });

  describe('deps command', () => {
    it('should show dependency tree', async () => {
      await testEnv.createPackage('utils', {});
      await testEnv.createPackage('ui', { utils: '^1.0.0' });

      const options = {
        tree: true,
        json: false,
        visual: false
      };

      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      await depsCommand(options);

      expect(consoleLog).toHaveBeenCalled();
      expect(consoleLog.mock.calls.some(call => 
        call[0].includes('utils') || call[0].includes('ui')
      )).toBe(true);

      consoleLog.mockRestore();
    });

    it('should output JSON', async () => {
      await testEnv.createPackage('test-package', {});

      const options = {
        tree: false,
        json: true,
        visual: false
      };

      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      await depsCommand(options);

      expect(consoleLog).toHaveBeenCalled();
      const output = consoleLog.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('test-package');

      consoleLog.mockRestore();
    });
  });
});