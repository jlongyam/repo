import { DependencyGraph } from '../utils/graph.js';
import { PackageBuilder } from '../core/builder.js';
import { Logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import chalk from 'chalk';

export default async function watchCommand(options) {
  const logger = new Logger({ 
    verbose: config.isVerbose(),
    silent: config.isSilent()
  });
  
  try {
    logger.info('√ Starting watch mode');
    logger.info('Press Ctrl+C to stop\n');
    
    // Discover packages
    const dependencyGraph = new DependencyGraph();
    const packages = await dependencyGraph.discoverPackages();
    
    if (packages.size === 0) {
      logger.warn('No packages found to watch');
      return;
    }
    
    // Determine which packages to watch
    let packagesToWatch;
    if (options.packages && options.packages.length > 0) {
      packagesToWatch = options.packages.filter(pkg => packages.has(pkg));
    } else {
      packagesToWatch = Array.from(packages.keys());
    }
    
    if (packagesToWatch.length === 0) {
      logger.warn('No valid packages to watch');
      return;
    }
    
    logger.info(`Watching ${packagesToWatch.length} package(s): ${packagesToWatch.map(p => chalk.cyan(p)).join(', ')}`);
    
    // Start watching
    const builder = new PackageBuilder();
    const processes = [];
    
    for (const packageName of packagesToWatch) {
      const packageInfo = packages.get(packageName);
      try {
        const process = await builder.watchPackage(packageName, packageInfo);
        processes.push({ package: packageName, process });
      } catch (error) {
        logger.error(`Failed to watch ${packageName}: ${error.message}`);
      }
    }
    
    if (processes.length === 0) {
      logger.error('No watch processes started');
      return;
    }
    
    // Setup graceful shutdown
    const cleanup = async () => {
      logger.info('\n× Stopping watch processes...');
      
      for (const { package: pkgName, process } of processes) {
        if (process && !process.killed) {
          try {
            process.kill('SIGTERM');
            logger.debug(`Stopped ${pkgName}`);
          } catch (error) {
            // Ignore errors during cleanup
          }
        }
      }
      
      // Give processes time to clean up
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Keep process alive
    await new Promise(() => {});
    
  } catch (error) {
    logger.error(`Watch failed: ${error.message}`);
    process.exit(1);
  }
}