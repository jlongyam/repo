import pkg from 'fs-extra';
import { join, resolve } from 'path';

const { readJson, pathExists } = pkg;

export class ConfigManager {
  #config = {
    // Package discovery
    packagesDir: 'packages',
    packagesDirs: ['packages', 'libs', 'projects', 'apps', 'modules'],
    packages: null,
    workspaces: null,
    
    // Build configuration
    buildDir: 'dist',
    sourceDir: 'src',
    typesDir: 'types',
    packageJson: 'package.json',
    
    // Commands
    defaultBuildCommand: 'npm run build',
    defaultCleanCommand: 'rm -rf dist',
    defaultWatchCommand: 'npm run watch',
    
    // Behavior
    verbose: false,
    silent: false,
    parallel: false,
    maxParallel: 4,
    incremental: false,
    cache: true,
    cacheDir: '.mr-builder-cache',
    
    // File patterns
    includePatterns: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**'
    ],
    
    // Environment
    env: {
      NODE_ENV: 'production'
    },
    
    // Hooks
    hooks: {}
  };

  #customConfig = {};
  #configPath = null;

  constructor() {
    // Don't auto-load config in constructor to avoid async issues
    // Config will be loaded on first access
  }

  async loadConfig(configPath = null) {
    const cwd = process.cwd();
    if (!cwd || typeof cwd !== 'string') {
      // No valid cwd, skip config loading
      return;
    }
    
    const searchPaths = [
      configPath,
      join(cwd, 'monorepo-builder.config.js'),
      join(cwd, 'monorepo-builder.config.json'),
      join(cwd, 'monorepo-builder.config.mjs'),
      join(cwd, '.mr-builderrc'),
      join(cwd, '.mr-builderrc.json'),
      join(cwd, '.config/mr-builder/config.json'),
    ];

    for (const path of searchPaths) {
      if (!path) continue;
      
      try {
        if (await pathExists(path)) {
          if (path.endsWith('.js') || path.endsWith('.mjs')) {
            const module = await import(`file://${resolve(path)}`);
            this.#customConfig = module.default || module;
          } else if (path.endsWith('.json')) {
            this.#customConfig = await readJson(path);
          }
          
          this.#configPath = path;
          break;
        }
      } catch (error) {
        // Silently ignore errors loading config from individual paths
      }
    }

    // Check for package.json workspaces
    const rootPackagePath = join(cwd, 'package.json');
    if (await pathExists(rootPackagePath)) {
      try {
        const rootPackage = await readJson(rootPackagePath);
        if (rootPackage.workspaces && !this.#customConfig.workspaces) {
          this.#customConfig.workspaces = Array.isArray(rootPackage.workspaces) 
            ? rootPackage.workspaces 
            : rootPackage.workspaces.packages || [];
        }
      } catch (error) {
        // Ignore errors reading package.json
      }
    }
  }

  get(key) {
    return this.#customConfig[key] !== undefined
      ? this.#customConfig[key]
      : this.#config[key];
  }

  getAll() {
    return { ...this.#config, ...this.#customConfig };
  }

  setConfig(customConfig) {
    // Merge custom config into #customConfig
    Object.assign(this.#customConfig, customConfig);
  }

  getConfigPath() {
    return this.#configPath;
  }

  isVerbose() {
    return this.get('verbose');
  }

  isSilent() {
    return this.get('silent');
  }

  isParallel() {
    return this.get('parallel');
  }

  getMaxParallel() {
    return parseInt(this.get('maxParallel'), 10);
  }

  getEnv() {
    return { ...process.env, ...this.get('env') };
  }

  async getPackagesConfig() {
    // Save any custom config that was set via setConfig()
    const savedCustomConfig = { ...this.#customConfig };
    
    // Always reload config to handle directory changes
    // Reset state to ensure fresh loading
    this.#configPath = null;
    this.#customConfig = {};
    await this.loadConfig();
    
    // Restore saved custom config (setConfig takes precedence)
    Object.assign(this.#customConfig, savedCustomConfig);
    
    // If packages are explicitly defined
    if (this.get('packages') && Array.isArray(this.get('packages'))) {
      return {
        type: 'explicit',
        paths: this.get('packages')
      };
    }
    
    // If workspaces are defined
    if (this.get('workspaces') && Array.isArray(this.get('workspaces'))) {
      return {
        type: 'workspaces',
        patterns: this.get('workspaces')
      };
    }
    
    // Auto-discover in common directories
    const packagesDirs = this.get('packagesDirs');
    const packagesDir = this.get('packagesDir');
    
    // Handle case where config values might be undefined
    if (!packagesDirs && !packagesDir) {
      return {
        type: 'none',
        paths: []
      };
    }
    
    // Ensure we have a valid array
    const dirs = Array.isArray(packagesDirs) && packagesDirs.length > 0
      ? packagesDirs
      : [packagesDir].filter(Boolean); // Filter out undefined/null values
    
    const cwd = process.cwd();
    if (!cwd || typeof cwd !== 'string') {
      return {
        type: 'none',
        paths: []
      };
    }
    
    for (const dirName of dirs) {
      if (!dirName || typeof dirName !== 'string') continue; // Skip invalid values
      const dirPath = join(cwd, dirName);
      
      if (await pathExists(dirPath)) {
        return {
          type: 'directory',
          path: dirName
        };
      }
    }
    
    // Check if root is a package
    const rootPackagePath = join(cwd, 'package.json');
    const rootExists = await pathExists(rootPackagePath);
    
    if (rootExists) {
      const rootPackage = await readJson(rootPackagePath);
      if (rootPackage.name) {
        return {
          type: 'root',
          path: '.'
        };
      }
    }
    
    return {
      type: 'none',
      paths: []
    };
  }
}

// Singleton instance
export const config = new ConfigManager();
export default config;