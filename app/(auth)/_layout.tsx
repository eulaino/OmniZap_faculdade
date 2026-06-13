import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../src/config/firebase';

export default function AuthLayout() {
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerTitle: 'Login/Cadastro' }} />
    </Stack>
  );
}
