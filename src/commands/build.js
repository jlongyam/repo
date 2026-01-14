import { DependencyGraph } from '../utils/graph.js';
import { PackageBuilder } from '../core/builder.js';
import { Logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import chalk from 'chalk';

export default async function buildCommand(options) {
  const logger = new Logger({ 
    verbose: options.verbose || config.isVerbose(),
    silent: config.isSilent()
  });
  
  try {
    logger.info('√ Starting monorepo build');
    
    // Discover packages
    const dependencyGraph = new DependencyGraph();
    const packages = await dependencyGraph.discoverPackages();
    
    if (packages.size === 0) {
      logger.warn('No packages found. Check your configuration or package structure.');
      logger.info('Try:');
      logger.info('  • Creating a "packages" directory');
      logger.info('  • Adding packages to your config file');
      logger.info('  • Configuring workspaces in package.json');
      return;
    }
    
    // Determine which packages to build
    let packagesToBuild;
    if (options.all) {
      packagesToBuild = Array.from(packages.keys());
      logger.info(`Building all ${packagesToBuild.length} package(s)`);
    } else if (options.packages && options.packages.length > 0) {
      packagesToBuild = options.packages;
      logger.info(`Building specific packages: ${packagesToBuild.join(', ')}`);
    } else {
      logger.error('Please specify packages to build or use --all flag');
      logger.info('Usage examples:');
      logger.info('  mr-builder build --all');
      logger.info('  mr-builder build -p ui utils');
      process.exit(1);
    }
    
    // Validate package names
    const invalidPackages = packagesToBuild.filter(pkg => !packages.has(pkg));
    if (invalidPackages.length > 0) {
      logger.warn(`Packages not found: ${invalidPackages.join(', ')}`);
      packagesToBuild = packagesToBuild.filter(pkg => packages.has(pkg));
    }
    
    // Get build order
    const buildOrder = options.skipDeps 
      ? packagesToBuild 
      : dependencyGraph.getBuildOrder(packagesToBuild);
    
    if (buildOrder.length === 0) {
      logger.warn('No valid packages to build');
      return;
    }
    
    logger.info(`Build order: ${buildOrder.map(p => chalk.cyan(p)).join(' › ')}`);
    
    // Initialize builder
    const builder = new PackageBuilder({
      verbose: options.verbose,
      concurrent: options.parallel,
      maxConcurrent: parseInt(options.maxParallel, 10)
    });
    
    // Build packages
    const results = [];
    const failedPackages = [];
    
    if (builder.concurrent && buildOrder.length > 1) {
      // Parallel build
      await builder.buildParallel(buildOrder, packages, results, failedPackages);
    } else {
      // Sequential build
      for (const packageName of buildOrder) {
        const packageInfo = packages.get(packageName);
        const result = await builder.buildPackage(packageName, packageInfo);
        results.push(result);
        
        if (!result.success) {
          failedPackages.push(packageName);
          if (!options.continue) break; // Stop on first failure unless continue flag
        }
      }
    }
    
    // Print summary
    logger.info('\n' + chalk.bold('∑ Build Summary'));
    logger.info('='.repeat(50));
    
    const successful = results.filter(r => r.success && !r.skipped);
    const skipped = results.filter(r => r.skipped);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
      logger.info(chalk.green(`√ Successful: ${successful.length}`));
      successful.forEach(result => {
        logger.info(`   ${chalk.cyan(result.package)} ${chalk.dim(`(${(result.duration / 1000).toFixed(2)}s)`)}`);
      });
    }
    
    if (skipped.length > 0) {
      logger.info(chalk.yellow(`‼  Skipped: ${skipped.length}`));
      skipped.forEach(result => {
        logger.info(`   ${chalk.yellow(result.package)}`);
      });
    }
    
    if (failed.length > 0) {
      logger.error(`× Failed: ${failed.length}`);
      failed.forEach(result => {
        logger.error(`   ${chalk.red(result.package)}: ${result.error}`);
      });
      
      logger.info('\n‡ Troubleshooting tips:');
      logger.info('• Run with --verbose flag for detailed output');
      logger.info('• Check package build scripts');
      logger.info('• Ensure all dependencies are installed');
      process.exit(1);
    }
    
    // Calculate total time
    const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    logger.info('\n' + chalk.green.bold(`∑ All packages built successfully in ${(totalTime / 1000).toFixed(2)}s`));
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (config.isVerbose()) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}