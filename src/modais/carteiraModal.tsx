import React, { memo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalProps = {
  userName: string | null;
};

function CarteiraModalComponente({ userName }: ModalProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const referralCode = userName
    ? `${userName.toUpperCase().replace(/\s/g, '').slice(0, 6)}10`
    : 'AMIGO10';

  console.log('Renderizou carteiraModal', {
    userName,
  });
  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between px-4 py-3.5"
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}>
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <Ionicons name="wallet-outline" size={20} color="#0f172a" />
        </View>

        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-lg text-slate-900">
            Carteira
          </Text>
          <Text
            style={{ fontFamily: 'Inter_400Regular' }}
            className="mt-0.5 text-xs text-slate-500">
            Meu saldo e QR code
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-black/45">
            <TouchableWithoutFeedback>
              <View
                className="rounded-t-[28px] border-t border-slate-200 bg-white"
                style={{
                  paddingBottom: Math.max(insets.bottom, 16),
                }}>
                <View className="items-center pb-2 pt-3">
                  <View className="h-1 w-10 rounded-full bg-slate-300" />
                </View>

                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="absolute right-5 top-4 z-10 h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>

                <View className="items-center px-6 pt-2">
                  <View className="mb-3 h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                    <Ionicons name="wallet-outline" size={28} color="#128C7E" />
                  </View>

                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="text-center text-xl text-slate-900">
                    Seu saldo
                  </Text>

                  <Text
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="mt-1.5 text-center text-sm leading-5 text-slate-500">
                    Use seus convites para acumular credito em novos pedidos.
                  </Text>
                </View>

                <View className="mx-6 mt-5 flex-row items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5">
                  <View>
                    <Text
                      style={{ fontFamily: 'Inter_400Regular' }}
                      className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      Seu codigo
                    </Text>
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="mt-1 text-lg text-slate-900">
                      {referralCode}
                    </Text>
                  </View>

                  <TouchableOpacity className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2">
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-xs text-emerald-700">
                      Copiar
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="mx-6 mt-6 flex-row items-center justify-center rounded-2xl bg-[#128C7E] py-4"
                  activeOpacity={0.85}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="ml-2 text-base text-white">
                    Compartilhar convite
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export const CarteiraModal = memo(CarteiraModalComponente);
