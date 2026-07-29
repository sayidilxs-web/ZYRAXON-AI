const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

// Create a custom metro config
const config = {
  ...getExpoDefaultConfig(projectRoot),
  watchFolders: [projectRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
    extraNodeModules: {
      // Ensure expo resolves from mobile package
      'expo': path.resolve(projectRoot, 'node_modules', 'expo'),
      'expo-router': path.resolve(projectRoot, 'node_modules', 'expo-router'),
    },
  },
};

module.exports = config;
