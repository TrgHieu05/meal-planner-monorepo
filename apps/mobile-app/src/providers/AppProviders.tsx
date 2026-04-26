import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import config from '@tamagui-config';
import { bootstrapGoogleSignIn } from '@features/auth/hooks/useGoogleIdTokenSignIn';

import { AuthProvider } from './AuthProvider';

bootstrapGoogleSignIn();

type AppThemeName = 'light' | 'dark';

type AppThemeContextValue = {
  themeName: AppThemeName;
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppProviders');
  }

  return context;
}

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const colorScheme = useColorScheme();
  const systemTheme: AppThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  const [themeName, setThemeName] = useState<AppThemeName>(systemTheme);

  useEffect(() => {
    setThemeName(systemTheme);
  }, [systemTheme]);

  const toggleTheme = useCallback(() => {
    setThemeName((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const contextValue = useMemo<AppThemeContextValue>(() => {
    return {
      themeName,
      toggleTheme,
    };
  }, [themeName, toggleTheme]);

  const [fontsLoaded] = useFonts({
    DMSans: require('@assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Light': require('@assets/fonts/DMSans-Light.ttf'),
    'DMSans-Regular': require('@assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('@assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('@assets/fonts/DMSans-SemiBold.ttf'),
    BricolageGrotesque: require('@assets/fonts/BricolageGrotesque-Regular.ttf'),
    'BricolageGrotesque-Regular': require('@assets/fonts/BricolageGrotesque-Regular.ttf'),
    'BricolageGrotesque-Medium': require('@assets/fonts/BricolageGrotesque-Medium.ttf'),
    'BricolageGrotesque-Bold': require('@assets/fonts/BricolageGrotesque-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config} defaultTheme={themeName}>
      <AppThemeContext.Provider value={contextValue}>
        <AuthProvider>{children}</AuthProvider>
      </AppThemeContext.Provider>
    </TamaguiProvider>
  );
}
