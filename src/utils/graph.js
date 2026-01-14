import { DepGraph } from 'dependency-graph';
import pkg from 'fs-extra';
import { join, dirname, relative } from 'path';
import fg from 'fast-glob';
import { config } from './config.js';
import { Logger } from './logger.js';
import chalk from 'chalk';

const { readJson, pathExists } = pkg;

export class DependencyGraph {
  constructor() {
    this.graph = new DepGraph();
    this.packages = new Map();
    this.logger = new Logger({ verbose: config.isVerbose() });
  }

  async discoverPackages() {
    const packagesConfig = await config.getPackagesConfig();
    this.logger.debug(`Package discovery type: ${packagesConfig.type}`);
    
    let packagePaths = [];

    switch (packagesConfig.type) {
    case 'explicit':
      packagePaths = await this.#discoverExplicitPackages(packagesConfig.paths);
      break;
      
    case 'workspaces':
      packagePaths = await this.#discoverWorkspacePackages(packagesConfig.patterns);
      break;
      
    case 'directory':
      packagePaths = await this.#discoverDirectoryPackages(packagesConfig.path);
      break;
      
    case 'root':
      packagePaths = [join(process.cwd(), 'package.json')];
      break;
      
    case 'none':
      this.logger.warn('No packages found. Please create a packages directory or configure package locations.');
      return this.packages;
    }

    // Process discovered packages
    await this.#processPackages(packagePaths);
    
    this.logger.info(`Discovered ${this.packages.size} package(s)`);
    
    if (config.isVerbose()) {
      for (const [name, pkg] of this.packages) {
        this.logger.debug(`  ${name} -> ${pkg.path}`);
      }
    }
    
    return this.packages;
  }

  async #discoverExplicitPackages(paths) {
    const packagePaths = [];
    
    for (const pkgPath of paths) {
      const absolutePath = join(process.cwd(), pkgPath);
      const packageJsonPath = join(absolutePath, 'package.json');
      
      if (await pathExists(packageJsonPath)) {
        packagePaths.push(packageJsonPath);
      } else {
        this.logger.warn(`Package not found: ${pkgPath}`);
      }
    }
    
    return packagePaths;
  }

  async #discoverWorkspacePackages(patterns) {
    const packagePaths = [];
    
    for (const pattern of patterns) {
      const globPattern = pattern.endsWith('/') 
        ? `${pattern}package.json` 
        : `${pattern}/package.json`;
      
      const found = await fg(globPattern, {
        absolute: true,
        cwd: process.cwd(),
        ignore: config.get('ignorePatterns'),
        onlyFiles: true
      });
      
      packagePaths.push(...found);
    }
    
    return [...new Set(packagePaths)]; // Remove duplicates
  }

  async #discoverDirectoryPackages(dirName) {
    const dirPath = join(process.cwd(), dirName);
    
    if (!await pathExists(dirPath)) {
      this.logger.warn(`Packages directory not found: ${dirPath}`);
      return [];
    }
    
    return await fg(`${dirName}/*/package.json`, {
      absolute: true,
      cwd: process.cwd(),
      ignore: config.get('ignorePatterns'),
      onlyFiles: true
    });
  }

  async #processPackages(packagePaths) {
    this.packages.clear();
    this.graph = new DepGraph();

    for (const packageJsonPath of packagePaths) {
      try {
        const packageDir = dirname(packageJsonPath);
        const packageJson = await readJson(packageJsonPath);
        const packageName = packageJson.name || this.#generatePackageName(packageDir);
        
        const pkg = {
          name: packageName,
          path: packageDir,
          relativePath: relative(process.cwd(), packageDir),
          json: packageJson,
          dependencies: {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies,
            ...packageJson.optionalDependencies
          },
          scripts: packageJson.scripts || {}
        };
        
        this.packages.set(packageName, pkg);
        this.graph.addNode(packageName);
        
        this.logger.debug(`Added package: ${packageName} (${pkg.relativePath})`);
      } catch (error) {
        this.logger.error(`Failed to process package at ${packageJsonPath}:`, error.message);
      }
    }

    // Build dependency graph
    for (const [packageName, pkg] of this.packages) {
      const internalDeps = Object.keys(pkg.dependencies || {}).filter(dep => 
        this.packages.has(dep)
      );
      
      for (const dep of internalDeps) {
        try {
          this.graph.addDependency(packageName, dep);
          this.logger.debug(`  ${packageName} → ${dep}`);
        } catch (error) {
          this.logger.warn(`Circular dependency detected between ${packageName} and ${dep}`);
        }
      }
    }
  }

  #generatePackageName(packageDir) {
    const dirName = packageDir.split('/').pop();
    return `@monorepo/${dirName}`;
  }

  getBuildOrder(packages) {
    // Handle different cases:
    // - No argument: build all packages
    // - Empty array: return empty array
    // - Array with packages: build those packages and their dependencies
    
    let packagesToBuild;
    
    if (packages === undefined) {
      // No argument - build all packages
      packagesToBuild = Array.from(this.packages.keys());
    } else if (packages.length === 0) {
      // Empty array - return empty
      return [];
    } else {
      // Array with packages - filter to valid ones
      packagesToBuild = packages.filter(pkg => this.packages.has(pkg));
    }
    
    if (packagesToBuild.length === 0) {
      return [];
    }

    const buildOrder = [];
    const visited = new Set();

    const visit = (node) => {
      if (visited.has(node)) return;
      visited.add(node);

      const dependencies = this.graph.dependenciesOf(node);
      dependencies.forEach(dep => visit(dep));
      
      // Add to build order (includes all dependencies)
      buildOrder.push(node);
    };

    packagesToBuild.forEach(pkg => visit(pkg));
    
    if (config.isVerbose()) {
      this.logger.debug(`Build order: ${buildOrder.join(' › ')}`);
    }
    
    return buildOrder;
  }

  getDependents(packageName) {
    if (!this.graph.hasNode(packageName)) {
      return [];
    }
    // Reverse to match expected order (dependents first, then their dependents)
    return this.graph.dependantsOf(packageName).reverse();
  }

  getDependencies(packageName) {
    if (!this.graph.hasNode(packageName)) {
      return [];
    }
    // Reverse to match expected order (dependencies first, then their dependencies)
    return this.graph.dependenciesOf(packageName).reverse();
  }

  getOverallOrder() {
    try {
      return this.graph.overallOrder();
    } catch (error) {
      if (error.message.includes('circular')) {
        this.logger.error('Circular dependency detected in the graph');
        return Array.from(this.packages.keys());
      }
      throw error;
    }
  }

  visualize() {
    const nodes = this.getOverallOrder();
    const output = [];
    
    for (const node of nodes) {
      const deps = this.getDependencies(node);
      const dependents = this.getDependents(node);
      
      output.push(`📦 ${chalk.bold(node)}`);
      if (deps.length > 0) {
        output.push(`  ƒ Depends on: ${deps.map(d => chalk.cyan(d)).join(', ')}`);
      }
      if (dependents.length > 0) {
        output.push(`  ƒ Used by: ${dependents.map(d => chalk.magenta(d)).join(', ')}`);
      }
      output.push('');
    }
    
    return output.join('\n');
  }

  toJSON() {
    const result = {};
    
    for (const [name, pkg] of this.packages) {
      result[name] = {
        path: pkg.relativePath,
        dependencies: this.getDependencies(name),
        dependents: this.getDependents(name)
      };
    }
    
    return result;
  }
}

export default DependencyGraph;