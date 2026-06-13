import React from 'react';
import { MoreVertical } from 'lucide-react-native';
import { View, Text, TouchableOpacity, Image } from 'react-native';

type HeaderProps = {
  status: string;
  statusBg: string;
}

const onboardingLogo = require('../../assets/images/logo.jpg');

function HeaderComponent({ status, statusBg }: HeaderProps) {
  return (
    <View className="border-b border-slate-200 bg-white px-5 pb-4 pt-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white">
            <Image source={onboardingLogo} style={{
              width: 40,
              height: 40,
              borderRadius: 12,
            }} resizeMode="cover" />
          </View>

          <View>
            <Text className="text-[15px] font-black text-slate-900">
              Omni Bot
            </Text>

            <View className="mt-1 flex-row items-center">
              <View className={`mr-1.5 h-2 w-2 rounded-full ${statusBg}`} />
              <Text className="text-xs font-medium text-slate-500">
                {status}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
        >
          <MoreVertical size={17} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const Header = React.memo(HeaderComponent);
