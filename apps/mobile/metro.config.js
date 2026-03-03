const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so hoisted packages (react, react-native, etc.) are found
config.watchFolders = [monorepoRoot];

// Resolve modules from project root first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// react-native-safe-area-context exists in BOTH locations:
//   apps/mobile/node_modules/react-native-safe-area-context  (4.10.5)
//   node_modules/react-native-safe-area-context              (4.14.1)
// Having two copies causes "tried to register two views at the same time".
// Fix: always use the local copy and block the root copy from being scanned.
const localSafeArea = path.resolve(projectRoot, 'node_modules/react-native-safe-area-context');
const rootSafeArea  = path.resolve(monorepoRoot, 'node_modules/react-native-safe-area-context');

config.resolver.extraNodeModules = {
  'react-native-safe-area-context': localSafeArea,
};

config.resolver.blockList = [
  new RegExp(`^${rootSafeArea.replace(/[/\\]/g, '[/\\\\]')}.*`),
];

module.exports = config;
