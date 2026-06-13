import type { ReactNode } from 'react';
import { View } from 'react-native';

type AtmosphereProps = {
  children: ReactNode;
  className?: string;
};

export function Atmosphere({ children, className = '' }: AtmosphereProps) {
  return (
    <View className={`relative ${className}`}>
      <View className="absolute -right-7 -top-4 h-24 w-24 rounded-full bg-[#BFEAD9]" />
      <View className="absolute -left-8 top-20 h-20 w-20 rounded-full bg-[#D7F3E8]" />
      {children}
    </View>
  );
}
