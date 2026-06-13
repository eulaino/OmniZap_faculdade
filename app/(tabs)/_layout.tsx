import Toast from 'react-native-toast-message';
import { Tabs, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="mt-3 text-slate-500">
          Verificando sessão...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: 12,
          },

          tabBarActiveTintColor: "#128C7E",
          tabBarInactiveTintColor: "#94A3B8",

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <Toast />
    </>
  );
}
