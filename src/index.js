import PackageBuilder from './core/builder.js';
import { DependencyGraph } from './utils/graph.js';
import { Logger } from './utils/logger.js';
import { config } from './utils/config.js';
import buildCommand from './commands/build.js';
import cleanCommand from './commands/clean.js';
import watchCommand from './commands/watch.js';
import depsCommand from './commands/deps.js';

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