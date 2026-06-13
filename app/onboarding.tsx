import { useMemo, useState } from 'react';
import { ref, set } from 'firebase/database';
import { database, auth } from '../src/config/firebase';
import { updateProfile } from 'firebase/auth';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CheckCircle2, UserRound } from 'lucide-react-native';
import { Atmosphere } from '@/components/ui/Atmosphere';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type SaveState = 'idle' | 'error' | 'success';

const onboardingLogo = require('../assets/images/logo.jpg');

function aplicarMascaraTelefone(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 13); // 55 + DDD + 9 dígitos

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
  const [isFocused, setIsFocused] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const normalizedName = useMemo(() => name.trim().replace(/\s+/g, ' '), [name]);
  const canSubmit = normalizedName.length >= 2 && !loading && saveState !== 'success' && phone;


  const title = saveState === 'success' ? 'Perfil pronto.' : 'Como devemos te chamar?';
  const subtitle =
    saveState === 'success'
      ? 'Aguarde um instante.'
      : 'Este nome aparece para sua equipe.';

  const resetFeedbackIfNeeded = () => {
    if (saveState !== 'idle') {
      setSaveState('idle');
      setFeedbackMessage('');
    }
  };

  const phoneRaw = phone.replace(/\D/g, '');

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

      await set(ref(database, `users/${user.uid}/name`), {
        name: normalizedName,
        phone: phoneRaw,
        createdAt: new Date().toISOString(),
      });
      await updateProfile(user, { displayName: normalizedName });

      // 3. Guardar no AsyncStorage para uso imediato no app
      await AsyncStorage.setItem('user_phone', phoneRaw);

      setSaveState('success');
      setFeedbackMessage('Perfil salvo. Entrando...');
      setLoading(false);
      await new Promise((resolve) => setTimeout(resolve, 420));
      router.replace('/');
      return;
    } catch (error) {
      console.log('Erro ao salvar nome no onboarding', error);
      setSaveState('error');
      setFeedbackMessage('Nao foi possivel salvar. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const inputTone =
    saveState === 'error'
      ? 'border-rose-300 bg-rose-50'
      : isFocused
        ? 'border-[#128C7E] bg-white'
        : 'border-[#DCEAE5] bg-[#F7FCFA]';



  return (
    <SafeAreaView className="flex-1 bg-[#EAF7F1]" edges={['top']}>
      <StatusBar backgroundColor="#EAF7F1" barStyle="dark-content" />


      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingVertical: 24,
        }}
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Atmosphere className="w-full max-w-[430px] self-center">
          <SurfaceCard className="px-5 py-5">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#DCEAE5] bg-white">
                <Image
                  source={onboardingLogo}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
              </View>

              <View className="flex-1">
                <Text className="text-lg font-black tracking-tight text-slate-900">OmniZap</Text>
                <View className="mt-0.5 flex-row items-center">
                  <View className="mr-1.5 h-2 w-2 rounded-full bg-[#25D366]" />
                  <Text className="text-xs font-medium text-[#4B675E]">Etapa final do onboarding</Text>
                </View>
              </View>
            </View>

            <View className="mt-5 h-px bg-[#DCEAE5]" />

            <Text className="mt-5 text-3xl font-black leading-10 text-slate-900">{title}</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</Text>

            <View className="mt-6 gap-3">
              <Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B675E]">
                Nome de exibicao
              </Text>

              <View className={`h-14 flex-row items-center gap-3 rounded-2xl border px-4 ${inputTone}`}>
                <UserRound size={18} color={saveState === 'error' ? '#dc2626' : '#64748b'} />

                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    resetFeedbackIfNeeded();
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    resetFeedbackIfNeeded();
                  }}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ex.: Ana Martins"
                  placeholderTextColor="#9aa8b7"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  accessibilityLabel="Digite seu nome de exibicao"
                  className="flex-1 py-3 text-base font-semibold text-slate-900"
                />
              </View>

              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Número
              </Text>

              <View className={`h-14 flex-row items-center gap-3 rounded-2xl border px-4 ${inputTone}`}>
                <UserRound size={18} color={saveState === 'error' ? '#dc2626' : '#64748b'} />

                <TextInput
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(aplicarMascaraTelefone(value));
                    resetFeedbackIfNeeded();
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    resetFeedbackIfNeeded();
                  }}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ex.: 5521990555020"
                  placeholderTextColor="#9aa8b7"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  accessibilityLabel="Digite seu número de WhatsApp"
                  className="flex-1 py-3 text-base font-semibold text-slate-900"
                />
              </View>

              <Pressable
                onPress={handleSaveName}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityLabel="Salvar nome e continuar"
                accessibilityState={{ disabled: !canSubmit, busy: loading }}
                className={`mt-1 h-14 flex-row items-center justify-center gap-2 rounded-2xl ${!canSubmit ? 'bg-[#128C7E]/45' : 'bg-[#128C7E] active:bg-[#0f766e]'
                  }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text className="text-base font-bold text-white">Salvando...</Text>
                  </>
                ) : saveState === 'success' ? (
                  <>
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text className="text-base font-bold text-white">Tudo certo</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-base font-bold text-white">Continuar</Text>
                    <ArrowRight size={18} color="#ffffff" />
                  </>
                )}
              </Pressable>
            </View>
          </SurfaceCard>
        </Atmosphere>
      </KeyboardAwareScrollView>

    </SafeAreaView>
  );
}
