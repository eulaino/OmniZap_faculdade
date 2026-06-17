import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { useAppTheme } from '@/theme/appTheme';

export default function AuthLayout() {
  const theme = useAppTheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return unsubscribe; //Limpa o listener ao desmontar;
  }, []);

  if (initializing) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerTitle: 'Login/Cadastro' }} />
    </Stack>
  );
}
