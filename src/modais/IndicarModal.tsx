import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Modal, Pressable, Share, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalProps = {
  userName: string | null;
  modalVisible: boolean;
  onSetVisible: (text: boolean) => void;
};

const fonts = {
  regular: { fontFamily: 'Inter_400Regular' },
  medium: { fontFamily: 'Inter_500Medium' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

function IndicarModalComponente({ userName, modalVisible, onSetVisible }: ModalProps) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
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
        className="mt-5 flex-row items-center justify-between rounded-[28px] bg-white p-4"
        onPress={() => {
          setCopied(false);
          onSetVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Indicar amigos">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-[18px] bg-[#EEE7FF]">
            <Ionicons name="gift-outline" size={20} color="#6135E8" />
          </View>

          <View>
            <Text style={fonts.bold} className="text-[15px] text-[#24252C]">
              Indique e ganhe
            </Text>
            <Text style={fonts.medium} className="mt-0.5 text-[12px] text-[#8B8D97]">
              Compartilhe seu codigo
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#B4B8C2" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => onSetVisible(false)}>
        <TouchableWithoutFeedback onPress={() => onSetVisible(false)}>
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
                  onPress={() => onSetVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar indicacao"
                  className="absolute right-5 top-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7]">
                  <Ionicons name="close" size={20} color="#747887" />
                </Pressable>

                <View className="pr-12">
                  <Text style={fonts.black} className="text-[22px] text-[#24252C]">
                    Indique amigos
                  </Text>
                  <Text style={fonts.medium} className="mt-1 text-[13px] leading-5 text-[#8B8D97]">
                    Copie seu codigo e envie para quem tambem quer receber lembretes no WhatsApp.
                  </Text>
                </View>

                <View className="mt-5 rounded-[24px] bg-[#F7F8FB] p-4">
                  <Text
                    style={fonts.bold}
                    className="text-[11px] uppercase tracking-[0.14em] text-[#8B8D97]">
                    Seu codigo
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
                    Compartilhar convite
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

export const IndicarModal = React.memo(IndicarModalComponente);
