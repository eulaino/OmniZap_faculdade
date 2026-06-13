import type { ReactNode } from 'react';
import { Text } from 'react-native';

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <Text className={`text-[11px] font-bold uppercase tracking-[0.18em] text-[#4B675E] ${className}`}>
      {children}
    </Text>
  );
}
