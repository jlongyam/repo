import pkg from 'fs-extra';
import { join, resolve } from 'path';

const { readJson, pathExists } = pkg;
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

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
    this.loadConfig();
  }

  async loadConfig(configPath = null) {
    const searchPaths = [
      configPath,
      join(process.cwd(), 'monorepo-builder.config.js'),
      join(process.cwd(), 'monorepo-builder.config.json'),
      join(process.cwd(), 'monorepo-builder.config.mjs'),
      join(process.cwd(), '.mr-builderrc'),
      join(process.cwd(), '.mr-builderrc.json'),
      join(process.cwd(), '.config/mr-builder/config.json'),
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
          // console.log removed
          break;
        }
      } catch (error) {
        // Silently ignore errors loading config from individual paths
      }
    }

    // Check for package.json workspaces
    const rootPackagePath = join(process.cwd(), 'package.json');
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
    const config = this.getAll();
    
    // If packages are explicitly defined
    if (config.packages && Array.isArray(config.packages)) {
      return {
        type: 'explicit',
        paths: config.packages
      };
    }
    
    // If workspaces are defined
    if (config.workspaces && Array.isArray(config.workspaces)) {
      return {
        type: 'workspaces',
        patterns: config.workspaces
      };
    }
    
    // Auto-discover in common directories
    const dirs = config.packagesDirs || [config.packagesDir];
    for (const dirName of dirs) {
      const dirPath = join(process.cwd(), dirName);
      if (await pathExists(dirPath)) {
        return {
          type: 'directory',
          path: dirName
        };
      }
    }
    
    // Check if root is a package
    const rootPackagePath = join(process.cwd(), 'package.json');
    if (await pathExists(rootPackagePath)) {
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