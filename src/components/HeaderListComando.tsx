import React, { useRef } from 'react';
import { Plus } from 'lucide-react-native';
import { TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';

// type HeaderListComandoProps = {
//   onOpen: () => void;
// };

export function HeaderListComando() {
  const navigatingRef = useRef(false);

  function handleCriarComando() {
    if (navigatingRef.current) return; //false

    navigatingRef.current = true;
    router.push('/criar-comando');

    setTimeout(() => {
      navigatingRef.current = false;
    }, 700);
  }

  return (
    <View className="mb-5 flex-row items-center justify-between">
      <View className="mr-3 flex-1">
        <Text className="text-xl font-black text-slate-900">
          Respostas automáticas
        </Text>

        <Text className="mt-1 text-sm text-slate-500">
          Organize os gatilhos do bot em um só lugar.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleCriarComando}
        activeOpacity={0.8}
        className="h-11 flex-row items-center rounded-2xl bg-[#128C7E] px-3.5"
      >
        <Plus size={18} color="#fff" />
        <Text className="ml-1.5 text-sm font-bold text-white">
          Novo
        </Text>
      </TouchableOpacity>
    </View>
  );
}
