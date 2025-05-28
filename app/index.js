/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Minimal polyfills
if (global.performance === undefined) {
  global.performance = {};
}
if (global.performance.now === undefined) {
  global.performance.now = function() {
    return Date.now();
  };
}

if (global.window === undefined) {
  global.window = global;
}

AppRegistry.registerComponent(appName, () => App); 