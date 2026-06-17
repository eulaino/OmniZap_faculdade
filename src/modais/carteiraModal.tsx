import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { memo, useState } from 'react';
import { Modal, Pressable, Share, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalProps = {
  userName: string | null;
};

const fonts = {
  regular: { fontFamily: 'Inter_400Regular' },
  medium: { fontFamily: 'Inter_500Medium' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

function CarteiraModalComponente({ userName }: ModalProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const insets = useSafeAreaInsets();
  const referralCode = userName
    ? `${userName.toUpperCase().replace(/\s/g, '').slice(0, 6)}10`
    : 'AMIGO10';

  async function copyCode() {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
  }

  async function shareInvite() {
    await Share.share({
      message: `Use meu codigo ${referralCode} no OmniZap para receber lembretes pelo WhatsApp.`,
    });
  }

  return (
    <>
      <Pressable
        className="flex-row items-center px-4 py-4"
        onPress={() => {
          setCopied(false);
          setModalVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Abrir carteira">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-[18px] bg-[#E7F8F1]">
          <Ionicons name="wallet-outline" size={20} color="#128C7E" />
        </View>

        <View className="flex-1">
          <Text style={fonts.bold} className="text-[15px] text-[#24252C]">
            Carteira
          </Text>
          <Text style={fonts.medium} className="mt-0.5 text-[12px] text-[#8B8D97]">
            Codigo e beneficios
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#B4B8C2" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-black/35">
            <TouchableWithoutFeedback>
              <View
                className="rounded-t-[30px] bg-white px-5 pb-5 pt-3"
                style={{
                  paddingBottom: Math.max(insets.bottom, 20),
                }}>
                <View className="items-center pb-3">
                  <View className="h-1.5 w-11 rounded-full bg-[#D8DEE4]" />
                </View>

                <Pressable
                  onPress={() => setModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar carteira"
                  className="absolute right-5 top-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7]">
                  <Ionicons name="close" size={20} color="#747887" />
                </Pressable>

                <View className="pr-12">
                  <Text style={fonts.black} className="text-[22px] text-[#24252C]">
                    Carteira
                  </Text>
                  <Text style={fonts.medium} className="mt-1 text-[13px] leading-5 text-[#8B8D97]">
                    Use seu codigo para convidar pessoas e acompanhar beneficios.
                  </Text>
                </View>

                <View className="mt-5 rounded-[24px] bg-[#F7F8FB] p-4">
                  <Text
                    style={fonts.bold}
                    className="text-[11px] uppercase tracking-[0.14em] text-[#8B8D97]">
                    Codigo ativo
                  </Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text style={fonts.black} className="text-[24px] text-[#24252C]">
                      {referralCode}
                    </Text>
                    <Pressable
                      onPress={copyCode}
                      className="rounded-[16px] bg-[#E7F8F1] px-4 py-2.5">
                      <Text style={fonts.bold} className="text-[13px] text-[#128C7E]">
                        {copied ? 'Copiado' : 'Copiar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={shareInvite}
                  className="mt-5 h-14 flex-row items-center justify-center rounded-[20px] bg-[#128C7E]">
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={fonts.black} className="ml-2 text-[15px] text-white">
                    Compartilhar codigo
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export const CarteiraModal = memo(CarteiraModalComponente);
