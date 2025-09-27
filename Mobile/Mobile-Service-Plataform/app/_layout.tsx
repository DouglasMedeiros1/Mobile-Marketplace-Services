import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { I18nProvider } from '@/contexts/I18nContext';
import { ThemeProviderLocal, useThemeLocal } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const systemScheme = useColorScheme();
  const { theme } = useThemeLocal();
  const { isAuthenticated, isLoading } = useAuth();
  const navTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  if (isLoading) {
    return null; // Ou um componente de loading
  }

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </>
        ) : (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        )}
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProviderLocal>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProviderLocal>
    </I18nProvider>
  );
}
