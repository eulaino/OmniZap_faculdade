import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Phone, UserRound } from 'lucide-react-native';

import { AuthWaveBackdropSvg } from '@/components/auth/AuthWaveBackdropSvg';
import {
  activateWhatsAppFromApp,
  getWhatsAppActivationErrorMessage,
} from '@/services/whatsappActivation';
import { auth, database } from '../src/config/firebase';

type SaveState = 'idle' | 'error' | 'success';
type FocusedField = 'name' | 'phone' | null;

const authFonts = {
  semibold: { fontFamily: 'Inter_600SemiBold' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

function aplicarMascaraTelefone(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 13);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 4) {
    return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`;
  }

  if (numbers.length <= 9) {
    return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
  }

  return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
}

export default function Onboarding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const normalizedName = useMemo(() => name.trim().replace(/\s+/g, ' '), [name]);
  const phoneRaw = phone.replace(/\D/g, '');
  const canSubmit =
    normalizedName.length >= 2 &&
    phoneRaw.length >= 10 &&
    phoneRaw.length <= 15 &&
    !loading &&
    saveState !== 'success';

  const title = saveState === 'success' ? 'Perfil pronto' : 'Finalize seu perfil';
  const subtitle =
    saveState === 'success'
      ? 'Tudo certo. Seus lembretes ja podem chegar no WhatsApp.'
      : 'Informe seu nome e WhatsApp para receber lembretes direto por mensagem.';

  const resetFeedbackIfNeeded = () => {
    if (saveState !== 'idle') {
      setSaveState('idle');
      setFeedbackMessage('');
    }
  };

  const handleSaveName = async () => {
    const user = auth.currentUser;

    if (!user) {
      setSaveState('error');
      setFeedbackMessage('Sessao expirada. Faca login novamente.');
      return;
    }

    if (normalizedName.length < 2) {
      setSaveState('error');
      setFeedbackMessage('Digite ao menos 2 caracteres.');
      return;
    }

    setLoading(true);
    setSaveState('idle');
    setFeedbackMessage('');

    try {
      const activation = await activateWhatsAppFromApp({
        uid: user.uid,
        phone: phoneRaw,
      });

      await set(ref(database, `users/${user.uid}/name`), {
        name: normalizedName,
        phone: activation.numero || phoneRaw,
        whatsappActive: activation.whatsappActive,
        whatsappLid: activation.lid,
        whatsappVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      await updateProfile(user, { displayName: normalizedName });
      await AsyncStorage.setItem('user_phone', activation.numero || phoneRaw);

      setSaveState('success');
      setFeedbackMessage('WhatsApp conectado. Entrando...');
      setLoading(false);
      await new Promise((resolve) => setTimeout(resolve, 420));
      router.replace('/');
      return;
    } catch (error) {
      console.log('Erro ao salvar nome no onboarding', error);
      setSaveState('error');
      setFeedbackMessage(getWhatsAppActivationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const nameLineTone =
    saveState === 'error'
      ? 'border-rose-400'
      : focusedField === 'name'
        ? 'border-[#128C7E]'
        : 'border-[#8ECFC0]';

  const phoneLineTone =
    saveState === 'error'
      ? 'border-rose-400'
      : focusedField === 'phone'
        ? 'border-[#128C7E]'
        : 'border-[#C8DAD4]';

  return (
    <SafeAreaView className="flex-1 bg-[#F7FCFA]" edges={['top']}>
      <StatusBar backgroundColor="#128C7E" barStyle="light-content" />

      <View className="absolute left-0 right-0 top-0 h-[336px] overflow-hidden">
        <AuthWaveBackdropSvg width={430} height={336} />
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingBottom: 32,
          paddingTop: 292,
        }}
        enableOnAndroid
        extraScrollHeight={84}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[430px] flex-1 self-center">
          <View className="flex-1">
            <View>
              <Text style={authFonts.black} className="text-[34px] leading-10 text-[#1F2D29]">
                {title}
              </Text>
              <View className="mt-2 h-1 w-16 rounded-full bg-[#25D366]" />

              <Text
                style={authFonts.semibold}
                className="mt-4 text-[15px] leading-6 text-[#4B675E]">
                {subtitle}
              </Text>

              <View className="mt-7 gap-5">
                <View>
                  <Text style={authFonts.black} className="text-[15px] text-[#38584F]">
                    Nome de exibicao
                  </Text>

                  <View className={`mt-2 h-10 flex-row items-center border-b ${nameLineTone}`}>
                    <UserRound size={16} color={saveState === 'error' ? '#E11D48' : '#6B8A81'} />
                    <TextInput
                      allowFontScaling={false}
                      cursorColor="#128C7E"
                      importantForAutofill="no"
                      selectionColor="#128C7E"
                      textContentType="none"
                      underlineColorAndroid="transparent"
                      value={name}
                      onChangeText={(value) => {
                        setName(value);
                        resetFeedbackIfNeeded();
                      }}
                      onFocus={() => {
                        setFocusedField('name');
                        resetFeedbackIfNeeded();
                      }}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ex.: João Fernandes"
                      placeholderTextColor="#8FA39C"
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      accessibilityLabel="Digite seu nome de exibicao"
                      style={authFonts.semibold}
                      className="ml-2 flex-1 py-1 text-[15px] text-[#233832]"
                    />
                  </View>
                </View>

                <View>
                  <Text style={authFonts.black} className="text-[15px] text-[#38584F]">
                    WhatsApp
                  </Text>

                  <View className={`mt-2 h-10 flex-row items-center border-b ${phoneLineTone}`}>
                    <Phone size={16} color={saveState === 'error' ? '#E11D48' : '#6B8A81'} />
                    <TextInput
                      allowFontScaling={false}
                      autoComplete="off"
                      cursorColor="#128C7E"
                      importantForAutofill="no"
                      selectionColor="#128C7E"
                      textContentType="none"
                      underlineColorAndroid="transparent"
                      value={phone}
                      onChangeText={(value) => {
                        setPhone(aplicarMascaraTelefone(value));
                        resetFeedbackIfNeeded();
                      }}
                      onFocus={() => {
                        setFocusedField('phone');
                        resetFeedbackIfNeeded();
                      }}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ex.: 5521990558030"
                      placeholderTextColor="#8FA39C"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                      accessibilityLabel="Digite seu numero de WhatsApp"
                      style={authFonts.semibold}
                      className="ml-2 flex-1 py-1 text-[15px] text-[#233832]"
                    />
                  </View>
                </View>

                {feedbackMessage ? (
                  <View
                    className={`rounded-xl border px-3 py-2.5 ${saveState === 'success'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-rose-200 bg-rose-50'
                      }`}>
                    <Text
                      style={authFonts.bold}
                      className={`text-center text-[13px] leading-5 ${saveState === 'success' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                      {feedbackMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="pt-9">
              <Pressable
                onPress={handleSaveName}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityLabel="Salvar perfil e entrar"
                accessibilityState={{ disabled: !canSubmit, busy: loading }}
                className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${!canSubmit ? 'bg-[#128C7E]/55' : 'bg-[#128C7E] active:bg-[#0f766e]'
                  }`}>
                {loading ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={authFonts.black} className="text-[16px] text-white">
                      Salvando...
                    </Text>
                  </>
                ) : saveState === 'success' ? (
                  <>
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text style={authFonts.black} className="text-[16px] text-white">
                      Tudo certo
                    </Text>
                  </>
                ) : (
                  <Text style={authFonts.black} className="text-[16px] text-white">
                    Ativar lembretes
                  </Text>
                )}
              </Pressable>

              <Text
                style={authFonts.semibold}
                className="mt-5 text-center text-[13px] leading-5 text-[#7A8D87]">
                Use o WhatsApp em que voce quer receber seus lembretes.
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
