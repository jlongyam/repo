import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DependencyGraph } from '../../src/utils/graph.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

describe('DependencyGraph', () => {
  let graph;
  let tempDir;

  beforeEach(async () => {
    graph = new DependencyGraph();
    tempDir = join(__dirname, 'temp-graph-test');
    await mkdir(tempDir, { recursive: true });
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(__dirname);
    await rm(tempDir, { recursive: true, force: true });
  });

  const createPackage = async (name, dependencies = {}) => {
    const packageDir = join(tempDir, 'packages', name);
    await mkdir(packageDir, { recursive: true });
    
    const packageJson = {
      name,
      version: '1.0.0',
      dependencies
    };
    
    await writeFile(
      join(packageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    return packageDir;
  };

  describe('discoverPackages', () => {
    it('should discover packages in packages directory', async () => {
      await createPackage('ui');
      await createPackage('utils');
      
      const packages = await graph.discoverPackages();
      
      expect(packages.size).toBe(2);
      expect(packages.has('ui')).toBe(true);
      expect(packages.has('utils')).toBe(true);
    });

    it('should handle packages with dependencies', async () => {
      await createPackage('utils');
      await createPackage('ui', { utils: '^1.0.0' });
      
      const packages = await graph.discoverPackages();
      
      expect(packages.size).toBe(2);
      expect(graph.getDependencies('ui')).toEqual(['utils']);
      expect(graph.getDependents('utils')).toEqual(['ui']);
    });

    it('should handle circular dependency detection', async () => {
      await createPackage('pkg-a', { 'pkg-b': '^1.0.0' });
      await createPackage('pkg-b', { 'pkg-a': '^1.0.0' });
      
      const packages = await graph.discoverPackages();
      
      expect(packages.size).toBe(2);
      // Should still add packages despite circular deps
      expect(packages.has('pkg-a')).toBe(true);
      expect(packages.has('pkg-b')).toBe(true);
    });

    it('should return empty map when no packages found', async () => {
      const packages = await graph.discoverPackages();
      
      expect(packages.size).toBe(0);
    });
  });

  describe('getBuildOrder', () => {
    beforeEach(async () => {
      await createPackage('utils');
      await createPackage('shared', { utils: '^1.0.0' });
      await createPackage('ui', { shared: '^1.0.0', utils: '^1.0.0' });
      await createPackage('api', { shared: '^1.0.0' });
      await createPackage('standalone');
      
      await graph.discoverPackages();
    });

    it('should return correct build order for all packages', () => {
      const buildOrder = graph.getBuildOrder();
      
      // utils should be first (no dependencies)
      expect(buildOrder[0]).toBe('utils');
      // shared depends on utils
      expect(buildOrder.indexOf('shared')).toBeGreaterThan(buildOrder.indexOf('utils'));
      // ui and api depend on shared
      expect(buildOrder.indexOf('ui')).toBeGreaterThan(buildOrder.indexOf('shared'));
      expect(buildOrder.indexOf('api')).toBeGreaterThan(buildOrder.indexOf('shared'));
    });

    it('should return correct build order for specific packages', () => {
      const buildOrder = graph.getBuildOrder(['ui', 'api']);
      
      // Should include dependencies
      expect(buildOrder).toContain('utils');
      expect(buildOrder).toContain('shared');
      expect(buildOrder).toContain('ui');
      expect(buildOrder).toContain('api');
      
      // Should be in correct order
      expect(buildOrder.indexOf('utils')).toBeLessThan(buildOrder.indexOf('shared'));
      expect(buildOrder.indexOf('shared')).toBeLessThan(buildOrder.indexOf('ui'));
      expect(buildOrder.indexOf('shared')).toBeLessThan(buildOrder.indexOf('api'));
    });

    it('should handle packages without dependencies', () => {
      const buildOrder = graph.getBuildOrder(['standalone']);
      
      expect(buildOrder).toEqual(['standalone']);
    });

    it('should return empty array for no packages', () => {
      const buildOrder = graph.getBuildOrder([]);
      
      expect(buildOrder).toEqual([]);
    });
  });

  describe('getDependencies and getDependents', () => {
    beforeEach(async () => {
      await createPackage('utils');
      await createPackage('shared', { utils: '^1.0.0' });
      await createPackage('ui', { shared: '^1.0.0' });
      
      await graph.discoverPackages();
    });

    it('should get dependencies', () => {
      expect(graph.getDependencies('ui')).toEqual(['shared', 'utils']);
      expect(graph.getDependencies('shared')).toEqual(['utils']);
      expect(graph.getDependencies('utils')).toEqual([]);
    });

    it('should get dependents', () => {
      expect(graph.getDependents('utils')).toEqual(['shared', 'ui']);
      expect(graph.getDependents('shared')).toEqual(['ui']);
      expect(graph.getDependents('ui')).toEqual([]);
    });

    it('should return empty array for unknown package', () => {
      expect(graph.getDependencies('unknown')).toEqual([]);
      expect(graph.getDependents('unknown')).toEqual([]);
    });
  });

  describe('visualize', () => {
    beforeEach(async () => {
      await createPackage('utils');
      await createPackage('ui', { utils: '^1.0.0' });
      
      await graph.discoverPackages();
    });

    it('should generate visualization string', () => {
      const visualization = graph.visualize();
      
      expect(visualization).toContain('utils');
      expect(visualization).toContain('ui');
      expect(visualization).toContain('Depends on');
      expect(visualization).toContain('Used by');
    });
  });

  describe('toJSON', () => {
    beforeEach(async () => {
      await createPackage('utils');
      await createPackage('ui', { utils: '^1.0.0' });
      
      await graph.discoverPackages();
    });

    it('should generate JSON representation', () => {
      const json = graph.toJSON();
      
      expect(json).toHaveProperty('utils');
      expect(json).toHaveProperty('ui');
      expect(json.utils.dependencies).toEqual([]);
      expect(json.utils.dependents).toEqual(['ui']);
      expect(json.ui.dependencies).toEqual(['utils']);
      expect(json.ui.dependents).toEqual([]);
    });
  });
});