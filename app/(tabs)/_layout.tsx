import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, router, Tabs } from 'expo-router';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { auth } from '../../src/config/firebase';

const dockShadow = {
  shadowColor: '#6135E8',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.14,
  shadowRadius: 24,
  elevation: 8,
};

const actionShadow = {
  shadowColor: '#6135E8',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.32,
  shadowRadius: 16,
  elevation: 10,
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  function renderTab(routeIndex: number) {
    const route = state.routes[routeIndex];
    const options = descriptors[route.key]?.options;
    const focused = state.index === routeIndex;
    const color = focused ? '#6135E8' : '#8B7CC7';
    const isHome = route.name === 'home';
    const iconName = isHome
      ? focused
        ? 'home'
        : 'home-outline'
      : focused
        ? 'people'
        : 'people-outline';

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={options?.tabBarAccessibilityLabel}
        className="h-full flex-1 items-center justify-center">
        <Ionicons name={iconName} size={23} color={color} />
      </Pressable>
    );
  }

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom }}>
      <View
        className="mx-5 h-16 flex-row items-center rounded-[22px] bg-[#EEE7FF] px-3"
        style={dockShadow}>
        {renderTab(0)}
        <View className="w-[78px]" />
        {renderTab(1)}
      </View>

      <Pressable
        onPress={() => router.push('/criar-comando')}
        accessibilityRole="button"
        accessibilityLabel="Novo lembrete"
        className="absolute -top-6 h-14 w-14 items-center justify-center self-center rounded-full bg-[#6135E8]"
        style={actionShadow}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        <ActivityIndicator size="large" color="#6135E8" />
        <Text className="mt-3 text-slate-500">Verificando sessao...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={23} color={color} />
            ),
          }}
        />
      </Tabs>
      <Toast />
    </>
  );
}
