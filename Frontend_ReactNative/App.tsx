/**
 * Mobile Marketplace Services
 * React Native Frontend Application
 *
 * @format
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/contexts/AuthContext';
import {WebSocketProvider} from './src/contexts/WebSocketContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <WebSocketProvider>
          <AppNavigator />
        </WebSocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;

