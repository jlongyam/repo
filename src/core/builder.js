import execa from 'execa';
import { join } from 'path';
import pkg from 'fs-extra';
import { config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import chalk from 'chalk';

const { readFile, readJson, pathExists } = pkg;

export class PackageBuilder {
  constructor(options = {}) {
    this.logger = new Logger({
      verbose: options.verbose || config.isVerbose(),
      silent: options.silent || config.isSilent()
    });
    
    this.concurrent = options.concurrent || config.isParallel();
    this.maxConcurrent = options.maxConcurrent || config.getMaxParallel();
    this.env = config.getEnv();
  }

  async buildPackage(packageName, packageInfo) {
    const timer = this.logger.startTimer(`Build ${packageName}`);
    
    try {
      this.logger.progress(packageName, 'Starting build...');
      
      // Get build command from package config or default
      const buildCommand = this.#getBuildCommand(packageName, packageInfo);
      
      if (!buildCommand) {
        this.logger.warn(`No build command found for ${packageName}, skipping`);
        return { 
          success: true, 
          skipped: true, 
          package: packageName,
          duration: timer.stop()
        };
      }

      this.logger.debug(`Build command: ${buildCommand}`);
      
      // Execute build command
      const result = await execa.command(buildCommand, {
        cwd: packageInfo.path,
        stdio: this.logger.verbose ? 'inherit' : 'pipe',
        shell: true,
        env: this.env,
        timeout: 300000 // 5 minutes timeout
      });

      const duration = timer.stop();
      this.logger.progress(packageName, `Built successfully in ${(duration / 1000).toFixed(2)}s`, 'success');
      
      return {
        success: true,
        package: packageName,
        duration,
        output: result.stdout
      };
      
    } catch (error) {
      const duration = timer.stop();
      this.logger.progress(packageName, `Build failed after ${(duration / 1000).toFixed(2)}s`, 'error');
      
      if (error.timedOut) {
        this.logger.error(`Build timed out for ${packageName}`);
      } else if (error.stdout || error.stderr) {
        this.logger.debug(`Build output:\n${error.stdout || error.stderr}`);
      }
      
      return {
        success: false,
        package: packageName,
        duration,
        error: error.message,
        code: error.exitCode
      };
    }
  }

  async cleanPackage(packageName, packageInfo) {
    try {
      this.logger.progress(packageName, 'Cleaning...');
      
      const cleanCommand = this.#getCleanCommand(packageName, packageInfo);
      
      if (cleanCommand) {
        // Use custom clean command
        await execa.command(cleanCommand, {
          cwd: packageInfo.path,
          stdio: this.logger.verbose ? 'inherit' : 'pipe',
          shell: true,
          env: this.env
        });
      } else {
        // Default clean: remove build directory
        const buildDir = config.get('buildDir');
        const distPath = join(packageInfo.path, buildDir);
        
        if (await pathExists(distPath)) {
          await remove(distPath);
          this.logger.debug(`Removed ${buildDir} directory`);
        }
        
        // Also clean types directory if it exists
        const typesDir = config.get('typesDir');
        const typesPath = join(packageInfo.path, typesDir);
        if (await pathExists(typesPath)) {
          await remove(typesPath);
          this.logger.debug(`Removed ${typesDir} directory`);
        }
      }
      
      this.logger.progress(packageName, 'Cleaned successfully', 'success');
      
    } catch (error) {
      this.logger.progress(packageName, `Clean failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async watchPackage(packageName, packageInfo) {
    try {
      this.logger.progress(packageName, 'Starting watch mode...');
      
      const watchCommand = this.#getWatchCommand(packageName, packageInfo);
      
      if (!watchCommand) {
        throw new Error(`No watch command found for ${packageName}`);
      }
      
      this.logger.debug(`Watch command: ${watchCommand}`);
      
      const child = execa.command(watchCommand, {
        cwd: packageInfo.path,
        stdio: 'inherit',
        shell: true,
        env: { ...this.env, NODE_ENV: 'development' }
      });

      // Handle process events
      child.on('exit', (code) => {
        this.logger.progress(packageName, `Watch process exited with code ${code}`, 'warning');
      });

      child.on('error', (error) => {
        this.logger.progress(packageName, `Watch process error: ${error.message}`, 'error');
      });

      return child;
      
    } catch (error) {
      this.logger.progress(packageName, `Failed to start watch: ${error.message}`, 'error');
      throw error;
    }
  }

  #getBuildCommand(packageName, packageInfo) {
    // Check package-specific config
    const packageConfigs = config.get('packageConfigs') || {};
    if (packageConfigs[packageName]?.buildCommand) {
      return packageConfigs[packageName].buildCommand;
    }
    
    // Check package.json scripts
    if (packageInfo.scripts?.build) {
      return packageInfo.scripts.build;
    }
    
    // Use default
    return config.get('defaultBuildCommand');
  }

  #getCleanCommand(packageName, packageInfo) {
    // Check package-specific config
    const packageConfigs = config.get('packageConfigs') || {};
    if (packageConfigs[packageName]?.cleanCommand) {
      return packageConfigs[packageName].cleanCommand;
    }
    
    // Check package.json scripts
    if (packageInfo.scripts?.clean) {
      return packageInfo.scripts.clean;
    }
    
    // Return null to use default behavior
    return null;
  }

  #getWatchCommand(packageName, packageInfo) {
    // Check package-specific config
    const packageConfigs = config.get('packageConfigs') || {};
    if (packageConfigs[packageName]?.watchCommand) {
      return packageConfigs[packageName].watchCommand;
    }
    
    // Check package.json scripts
    if (packageInfo.scripts?.watch) {
      return packageInfo.scripts.watch;
    }
    
    // Try dev script
    if (packageInfo.scripts?.dev) {
      return packageInfo.scripts.dev;
    }
    
    // Use default
    return config.get('defaultWatchCommand');
  }
}

export default PackageBuilder;