import type { ReactNode } from 'react';
import { View } from 'react-native';

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className = '' }: SurfaceCardProps) {
  return <View className={`rounded-3xl border border-[#DCEAE5] bg-white p-5 ${className}`}>{children}</View>;
}
