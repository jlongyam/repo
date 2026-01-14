import { DependencyGraph } from '../utils/graph.js';
import { PackageBuilder } from '../core/builder.js';
import { Logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import inquirer from 'inquirer';

export default async function cleanCommand(options) {
  const logger = new Logger({ 
    verbose: config.isVerbose(),
    silent: config.isSilent()
  });
  
  try {
    logger.info('🧹 Cleaning monorepo packages');
    
    // Discover packages
    const dependencyGraph = new DependencyGraph();
    const packages = await dependencyGraph.discoverPackages();
    
    if (packages.size === 0) {
      logger.warn('No packages found to clean');
      return;
    }
    
    // Determine which packages to clean
    let packagesToClean;
    if (options.all) {
      packagesToClean = Array.from(packages.keys());
      logger.info(`Cleaning all ${packagesToClean.length} package(s)`);
    } else if (options.packages && options.packages.length > 0) {
      packagesToClean = options.packages;
      logger.info(`Cleaning specific packages: ${packagesToClean.join(', ')}`);
    } else {
      logger.error('Please specify packages to clean or use --all flag');
      process.exit(1);
    }
    
    // Validate package names
    const validPackages = packagesToClean.filter(pkg => packages.has(pkg));
    const invalidPackages = packagesToClean.filter(pkg => !packages.has(pkg));
    
    if (invalidPackages.length > 0) {
      logger.warn(`Packages not found: ${invalidPackages.join(', ')}`);
    }
    
    if (validPackages.length === 0) {
      logger.warn('No valid packages to clean');
      return;
    }
    
    // Confirm if not forced
    if (!options.force && validPackages.length > 1) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Clean ${validPackages.length} packages? This will remove build artifacts.`,
          default: false
        }
      ]);
      
      if (!confirm) {
        logger.info('Clean cancelled');
        return;
      }
    }
    
    // Clean packages
    const builder = new PackageBuilder();
    const results = [];
    
    for (const packageName of validPackages) {
      const packageInfo = packages.get(packageName);
      try {
        await builder.cleanPackage(packageName, packageInfo);
        results.push({ package: packageName, success: true });
      } catch (error) {
        results.push({ package: packageName, success: false, error: error.message });
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (failed > 0) {
      logger.error(`Clean completed with ${failed} error(s)`);
      results.filter(r => !r.success).forEach(r => {
        logger.error(`  ${r.package}: ${r.error}`);
      });
      process.exit(1);
    }
    
    logger.success(`Cleaned ${successful} package(s) successfully`);
    
  } catch (error) {
    logger.error(`Clean failed: ${error.message}`);
    process.exit(1);
  }
}