import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

const THEME_STORAGE_KEY = 'app_theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AppTheme = {
  isDark: boolean;
  colors: {
    accent: string;
    accentMuted: string;
    background: string;
    border: string;
    card: string;
    cardMuted: string;
    danger: string;
    input: string;
    primary: string;
    primaryPressed: string;
    secondary: string;
    shadow: string;
    statusBar: string;
    success: string;
    successMuted: string;
    text: string;
    textMuted: string;
    textSoft: string;
  };
  gradient: readonly [string, string, string, string];
  statusBarStyle: 'light-content' | 'dark-content';
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    accent: '#6135E8',
    accentMuted: '#EEE7FF',
    background: '#FBFFFD',
    border: '#E6E8EE',
    card: '#FFFFFF',
    cardMuted: '#F7F8FB',
    danger: '#E11D48',
    input: '#FBFCFD',
    primary: '#128C7E',
    primaryPressed: '#0f766e',
    secondary: '#159DEA',
    shadow: '#191622',
    statusBar: '#FFFFFF',
    success: '#128C7E',
    successMuted: '#E7F8F1',
    text: '#24252C',
    textMuted: '#747887',
    textSoft: '#8B8D97',
  },
  gradient: ['#FFFFFF', '#FBFFFD', '#F4FFF9', '#F7F3FF'],
  statusBarStyle: 'dark-content',
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    accent: '#9B7CFF',
    accentMuted: '#27213D',
    background: '#0D1110',
    border: '#2A3330',
    card: '#151B19',
    cardMuted: '#1C2421',
    danger: '#FB7185',
    input: '#111816',
    primary: '#22C7A7',
    primaryPressed: '#16A58D',
    secondary: '#38BDF8',
    shadow: '#000000',
    statusBar: '#0D1110',
    success: '#35D39F',
    successMuted: '#12382E',
    text: '#F2F7F5',
    textMuted: '#B5C2BE',
    textSoft: '#8FA09B',
  },
  gradient: ['#0D1110', '#101816', '#141F1B', '#18152A'],
  statusBarStyle: 'light-content',
};

export function getAppTheme(colorScheme: ColorSchemeName): AppTheme {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export function getThemeForPreference(
  preference: ThemePreference,
  systemScheme: ColorSchemeName
): AppTheme {
  if (preference === 'dark') return darkTheme;
  if (preference === 'light') return lightTheme;

  return getAppTheme(systemScheme);
}

type AppThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: AppTheme;
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function normalizeThemePreference(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedPreference) => {
        setPreferenceState(normalizeThemePreference(storedPreference));
      })
      .catch((error) => {
        console.log('Erro ao carregar tema:', error);
      });
  }, []);

  const theme = getThemeForPreference(preference, systemScheme);

  const setPreference = (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextPreference).catch((error) => {
      console.log('Erro ao salvar tema:', error);
    });
  };

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      theme,
      toggleTheme: () => setPreference(theme.isDark ? 'light' : 'dark'),
    }),
    [preference, theme]
  );

  return createElement(AppThemeContext.Provider, { value }, children);
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  const systemScheme = useColorScheme();

  return context?.theme ?? getAppTheme(systemScheme);
}

export function useThemePreference() {
  const context = useContext(AppThemeContext);
  const systemScheme = useColorScheme();
  const fallbackTheme = getAppTheme(systemScheme);

  return (
    context ?? {
      preference: 'system' as ThemePreference,
      setPreference: () => undefined,
      theme: fallbackTheme,
      toggleTheme: () => undefined,
    }
  );
}
