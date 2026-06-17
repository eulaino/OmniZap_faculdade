import '../global.css';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@/theme/appTheme';

const queryClient = new QueryClient();

type TextComponentWithDefaults = {
  defaultProps?: {
    allowFontScaling?: boolean;
    style?: unknown;
  };
};

const appText = Text as unknown as TextComponentWithDefaults;
const appTextInput = TextInput as unknown as TextComponentWithDefaults;

appText.defaultProps = appText.defaultProps ?? {};
appText.defaultProps.allowFontScaling = false;
appText.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, appText.defaultProps.style];

appTextInput.defaultProps = appTextInput.defaultProps ?? {};
appTextInput.defaultProps.allowFontScaling = false;
appTextInput.defaultProps.style = [
  { fontFamily: 'Inter_400Regular' },
  appTextInput.defaultProps.style,
];

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  const theme = useAppTheme();

  if (!fontsLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerTitle: 'Home', headerShown: true }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}
