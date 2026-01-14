import { DependencyGraph } from '../utils/graph.js';
import { Logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import chalk from 'chalk';

export default async function depsCommand(options) {
  const logger = new Logger({ 
    verbose: config.isVerbose(),
    silent: config.isSilent()
  });
  
  try {
    logger.info('ƒ Analyzing package dependencies');
    
    // Discover packages
    const dependencyGraph = new DependencyGraph();
    await dependencyGraph.discoverPackages();
    
    const packages = Array.from(dependencyGraph.packages.keys());
    
    if (packages.length === 0) {
      logger.warn('No packages found');
      return;
    }
    
    logger.info(`Found ${packages.length} package(s)\n`);
    
    if (options.json) {
      // JSON output
      const jsonOutput = dependencyGraph.toJSON();
      console.log(JSON.stringify(jsonOutput, null, 2));
      return;
    }
    
    if (options.tree) {
      // Tree view
      console.log(chalk.bold('‡ Dependency Tree'));
      console.log('='.repeat(50));
      
      const printTree = (packageName, indent = '', last = true) => {
        const prefix = last ? '└── ' : '├── ';
        console.log(indent + prefix + chalk.cyan(packageName));
        
        const deps = dependencyGraph.getDependents(packageName);
        deps.forEach((dep, index) => {
          const newIndent = indent + (last ? '    ' : '│   ');
          printTree(dep, newIndent, index === deps.length - 1);
        });
      };
      
      // Find root packages (those with no dependencies)
      const rootPackages = packages.filter(pkg => 
        dependencyGraph.getDependencies(pkg).length === 0
      );
      
      rootPackages.forEach((pkg, index) => {
        printTree(pkg, '', index === rootPackages.length - 1);
      });
      
      return;
    }
    
    if (options.visual || true) { // Default to visual
      // Visual graph
      console.log(dependencyGraph.visualize());
      return;
    }
    
    // Default table view
    console.log(chalk.bold('» Package Dependencies'));
    console.log('='.repeat(80));
    
    for (const pkg of packages) {
      const deps = dependencyGraph.getDependencies(pkg);
      const dependents = dependencyGraph.getDependents(pkg);
      
      console.log(chalk.bold(`\n› ${pkg}`));
      
      if (deps.length > 0) {
        console.log(`  · Depends on: ${deps.map(d => chalk.cyan(d)).join(', ')}`);
      } else {
        console.log(`  · No dependencies`);
      }
      
      if (dependents.length > 0) {
        console.log(`  · Used by: ${dependents.map(d => chalk.magenta(d)).join(', ')}`);
      } else {
        console.log(`  · No dependents`);
      }
    }
    
    // Circular dependency check
    try {
      dependencyGraph.getOverallOrder();
    } catch (error) {
      if (error.message.includes('circular')) {
        console.log(chalk.red('\n‼  Warning: Circular dependencies detected!'));
      }
    }
    
  } catch (error) {
    logger.error(`Failed to analyze dependencies: ${error.message}`);
    process.exit(1);
  }
}