export { PackageBuilder } from './core/builder.js';
export { DependencyGraph } from './utils/graph.js';
export { Logger } from './utils/logger.js';
export { config } from './utils/config.js';
export { default as buildCommand } from './commands/build.js';
export { default as cleanCommand } from './commands/clean.js';
export { default as watchCommand } from './commands/watch.js';
export { default as depsCommand } from './commands/deps.js';

// Default export
export default {
  PackageBuilder,
  DependencyGraph,
  Logger,
  config,
  commands: {
    build: buildCommand,
    clean: cleanCommand,
    watch: watchCommand,
    deps: depsCommand
  }
};