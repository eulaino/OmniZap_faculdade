import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { Atmosphere } from '@/components/ui/Atmosphere';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type FormData = {
  email: string;
  password: string;
};

const onboardingLogo = require('../../assets/images/logo.jpg');

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleAuth = async (data: FormData) => {
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        router.replace('/');
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        console.log('Email cadastrado', data.email);
        router.replace('/onboarding');
      }
    } catch (error: any) {
      let errorMessage = 'E-mail ou senha incorretos.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail ja esta em uso.';
      }

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'E-mail ou senha incorretos.';
      }

      setMessage(errorMessage);
      console.log('Erro', error);
    } finally {
      setLoading(false);
    }
  };

  const emailTone = errors.email
    ? 'border-rose-300 bg-rose-50'
    : focusedField === 'email'
      ? 'border-[#128C7E] bg-white'
      : 'border-[#DCEAE5] bg-[#F7FCFA]';

  const passwordTone = errors.password
    ? 'border-rose-300 bg-rose-50'
    : focusedField === 'password'
      ? 'border-[#128C7E] bg-white'
      : 'border-[#DCEAE5] bg-[#F7FCFA]';

  return (
    <SafeAreaView className="flex-1 bg-[#EAF7F1]" edges={['top']}>
      <StatusBar backgroundColor="#EAF7F1" barStyle="dark-content" />


      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 32,
        }}
        enableOnAndroid
        extraScrollHeight={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center">
          <Atmosphere>
            <SurfaceCard className="px-5 py-5">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#DCEAE5] bg-white">
                  <Image
                    source={onboardingLogo}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                    }}
                    resizeMode="cover"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-black tracking-tight text-slate-900">OmniZap</Text>
                  <View className="mt-0.5 flex-row items-center">
                    <View className="mr-1.5 h-2 w-2 rounded-full bg-[#25D366]" />
                    <Text className="text-xs font-medium text-[#4B675E]">Central ativa</Text>
                  </View>
                </View>
              </View>

              <View className="mt-5 h-px bg-[#DCEAE5]" />

              <View className="mt-4 flex-row rounded-2xl border border-[#DCEAE5] bg-[#F7FCFA] p-1">
                <Pressable
                  onPress={() => {
                    setIsLogin(true);
                    setMessage('');
                  }}
                  className={`flex-1 rounded-xl py-2.5 ${isLogin ? 'border border-[#DCEAE5] bg-white' : 'bg-transparent'} active:opacity-80`}
                >
                  <Text
                    className={`text-center text-sm font-bold ${isLogin ? 'text-slate-900' : 'text-slate-500'}`}
                  >
                    Entrar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsLogin(false);
                    setMessage('');
                  }}
                  className={`flex-1 rounded-xl py-2.5 ${!isLogin ? 'border border-[#DCEAE5] bg-white' : 'bg-transparent'} active:opacity-80`}
                >
                  <Text
                    className={`text-center text-sm font-bold ${!isLogin ? 'text-slate-900' : 'text-slate-500'}`}
                  >
                    Cadastrar
                  </Text>
                </Pressable>
              </View>

              <View className="mt-5 gap-3">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B675E]">E-mail</Text>

                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'E-mail e obrigatorio',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'E-mail invalido',
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <View className={`h-14 flex-row items-center gap-3 rounded-2xl border px-4 ${emailTone}`}>
                      <Feather name="mail" size={18} color={errors.email ? '#DC2626' : '#64748b'} />

                      <TextInput
                        placeholder="seu@email.com"
                        placeholderTextColor="#94a3b8"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField((previous) => (previous === 'email' ? null : previous))}
                        className="flex-1 font-medium text-slate-900"
                      />
                    </View>
                  )}
                />

                {errors.email ? (
                  <Text className="text-xs font-medium text-rose-600">{errors.email.message}</Text>
                ) : null}

                <Text className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B675E]">Senha</Text>

                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: 'Senha e obrigatoria',
                    minLength: {
                      value: 6,
                      message: 'Minimo 6 caracteres',
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <View className={`h-14 flex-row items-center gap-3 rounded-2xl border px-4 ${passwordTone}`}>
                      <Feather name="lock" size={18} color={errors.password ? '#DC2626' : '#64748b'} />

                      <TextInput
                        placeholder="sua senha"
                        placeholderTextColor="#94a3b8"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() =>
                          setFocusedField((previous) => (previous === 'password' ? null : previous))
                        }
                        className="flex-1 font-medium text-slate-900"
                      />

                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        className="h-8 w-8 items-center justify-center rounded-full active:bg-slate-200"
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748b" />
                      </Pressable>
                    </View>
                  )}
                />

                {errors.password ? (
                  <Text className="text-xs font-medium text-rose-600">{errors.password.message}</Text>
                ) : null}

                <Pressable
                  onPress={handleSubmit(handleAuth)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={isLogin ? 'Entrar na central' : 'Criar minha conta'}
                  accessibilityState={{ disabled: loading, busy: loading }}
                  className={`mt-4 h-14 items-center justify-center rounded-2xl border border-[#0F7B6E] ${loading ? 'bg-[#128C7E]/55' : 'bg-[#128C7E] active:bg-[#0f766e]'
                    }`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Text className="font-bold tracking-wide text-white">
                        {isLogin ? 'Entrar na central' : 'Criar minha conta'}
                      </Text>
                      <Feather name="arrow-right" size={17} color="white" />
                    </View>
                  )}
                </Pressable>

                {message ? (
                  <View className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                    <Text className="text-center text-xs font-medium text-rose-700">{message}</Text>
                  </View>
                ) : null}
              </View>
            </SurfaceCard>
          </Atmosphere>
        </View>
      </KeyboardAwareScrollView>

    </SafeAreaView>
  );
}
