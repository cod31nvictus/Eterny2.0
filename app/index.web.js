import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('Eterny', () => App);

// Run the app
AppRegistry.runApplication('Eterny', {
  rootTag: document.getElementById('root'),
}); 