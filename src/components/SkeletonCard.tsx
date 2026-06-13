// src/components/SkeletonCard.tsx
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity, width: 220, marginRight: 12 }}>
      <View className="bg-white rounded-3xl overflow-hidden border border-gray-100">
        {/* Imagem placeholder */}
        <View className="h-36 bg-gray-200" />
        {/* Texto placeholder */}
        <View className="px-3.5 py-3 gap-y-2">
          <View className="h-3 bg-gray-200 rounded-full w-3/4" />
          <View className="h-3 bg-gray-200 rounded-full w-1/2" />
          <View className="h-3 bg-gray-200 rounded-full w-1/3" />
        </View>
      </View>
    </Animated.View>
  );
}