const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// For monorepo setup with bun workspaces, ensure modules resolve correctly
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Force resolution to mobile package's node_modules
config.watchFolders = [
  projectRoot,
];

module.exports = config;
