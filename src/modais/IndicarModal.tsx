import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, TouchableWithoutFeedback, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalProps = {
  userName: string | null;
  modalVisible: boolean;
  onSetVisible: (text: boolean) => void;
};

function IndicarModalComponente({ userName, modalVisible, onSetVisible }: ModalProps) {
  const insets = useSafeAreaInsets();
  const referralCode = userName ? `${userName.toUpperCase().replace(/\s/g, '').slice(0, 6)}10` : 'AMIGO10';
  console.log('Renderizou inidicarModal', {
    userName,
    modalVisible,
    onSetVisible
  });
  return (
    <>
      <TouchableOpacity
        className="mx-4 mt-4 flex-row items-center justify-between rounded-3xl border border-slate-200 bg-white p-4"
        onPress={() => onSetVisible(true)}
        activeOpacity={0.82}
      >
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
            <Ionicons name="gift-outline" size={20} color="#128C7E" />
          </View>

          <View>
            <Text style={{ fontFamily: 'SofiaProBold' }} className="text-lg text-slate-900">
              Indique e ganhe R$ 10
            </Text>
            <Text style={{ fontFamily: 'SofiaProRegular' }} className="mt-0.5 text-xs text-slate-500">
              Convide amigos para usar o app
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => onSetVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => onSetVisible(false)}>
          <View className="flex-1 justify-end bg-black/45">
            <TouchableWithoutFeedback>
              <View className="rounded-t-[28px] border-t border-slate-200 bg-white" style={{
                paddingBottom: Math.max(insets.bottom, 16),
              }}>
                <View className="items-center pb-2 pt-3">
                  <View className="h-1 w-10 rounded-full bg-slate-300" />
                </View>

                <Pressable
                  onPress={() => onSetVisible(false)}
                  className="absolute right-5 top-4 z-10 h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>

                <View className="items-center px-6 pt-2">
                  <View className="mb-3 h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                    <Ionicons name="gift" size={30} color="#128C7E" />
                  </View>

                  <Text style={{ fontFamily: 'SofiaProBold' }} className="text-center text-xl text-slate-900">
                    Indique amigos e ganhe R$ 10
                  </Text>

                  <Text style={{ fontFamily: 'SofiaProRegular' }} className="mt-1.5 text-center text-sm leading-5 text-slate-500">
                    Quando um amigo fizer o primeiro pedido, voces dois recebem desconto.
                  </Text>
                </View>

                <View className="mx-6 mt-5 flex-row items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5">
                  <View>
                    <Text style={{ fontFamily: 'SofiaProRegular' }} className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      Seu codigo
                    </Text>
                    <Text style={{ fontFamily: 'SofiaProBold' }} className="mt-1 text-lg text-slate-900">
                      {referralCode}
                    </Text>
                  </View>

                  <TouchableOpacity className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2">
                    <Text style={{ fontFamily: 'SofiaProBold' }} className="text-xs text-emerald-700">
                      Copiar
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="mx-6 mt-5 gap-3">
                  {[
                    { icon: 'paper-plane-outline' as const, text: 'Compartilhe seu codigo com amigos.' },
                    { icon: 'cart-outline' as const, text: 'Seu amigo realiza o primeiro pedido.' },
                    { icon: 'cash-outline' as const, text: 'Os dois recebem R$ 10 em desconto.' },
                  ].map((step, index) => (
                    <View key={index} className="flex-row items-center">
                      <View className="h-9 w-9 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50">
                        <Ionicons name={step.icon} size={17} color="#0284C7" />
                      </View>

                      <Text style={{ fontFamily: 'SofiaProRegular' }} className="ml-3 flex-1 text-sm text-slate-700">
                        {step.text}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  className="mx-6 mt-6 flex-row items-center justify-center rounded-2xl bg-[#128C7E] py-4"
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={{ fontFamily: 'SofiaProBold' }} className="ml-2 text-base text-white">
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

export const IndicarModal = React.memo(IndicarModalComponente);