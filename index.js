/**
 * @format
 */
import 'react-native-gesture-handler'; // MUST be first
import 'react-native-get-random-values'; // Add this for crypto/uuid needs
import 'react-native-url-polyfill/auto'; // Add this for Supabase
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
