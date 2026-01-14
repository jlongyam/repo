export default {
  // Package discovery
  packagesDir: 'packages',
  
  // Build configuration
  buildDir: 'dist',
  sourceDir: 'src',
  
  // Commands
  defaultBuildCommand: 'npm run build',
  defaultCleanCommand: 'rm -rf dist',
  defaultWatchCommand: 'npm run dev',
  
  // Behavior
  verbose: false,
  parallel: true,
  maxParallel: 4,
  
  // Package-specific configurations
  packageConfigs: {
    'ui': {
      buildCommand: 'vite build',
      watchCommand: 'vite'
    },
    'api': {
      buildCommand: 'tsc --project tsconfig.json'
    }
  },
  
  // Environment variables
  env: {
    NODE_ENV: 'production',
    CI: 'false'
  },
  
  // Hooks
  hooks: {
    beforeBuild: async (packageName, packageInfo) => {
      console.log(`🔨 Starting build for ${packageName}`);
    },
    afterBuild: async (packageName, packageInfo, result) => {
      console.log(`✅ Built ${packageName} in ${result.duration}ms`);
    }
  }
};