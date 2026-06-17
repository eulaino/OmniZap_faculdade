import { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';

import { AuthWaveBackdropSvg } from '@/components/auth/AuthWaveBackdropSvg';
import { useAppTheme } from '@/theme/appTheme';
import { auth } from '../../src/config/firebase';

type FormData = {
  email: string;
  password: string;
};

type Feedback = {
  type: 'error' | 'success';
  text: string;
};

const emailPattern = /^\S+@\S+\.\S+$/;
const authFonts = {
  medium: { fontFamily: 'Inter_500Medium' },
  semibold: { fontFamily: 'Inter_600SemiBold' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

export default function LoginPage() {
  const theme = useAppTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);

  const {
    control,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const busy = loading || resetLoading;
  const clearFeedback = () => setFeedback(null);

  const handleAuth = async (data: FormData) => {
    setLoading(true);
    setFeedback(null);

    try {
      const email = data.email.trim();

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, data.password);
        router.replace('/');
      } else {
        await createUserWithEmailAndPassword(auth, email, data.password);
        console.log('Email cadastrado', email);
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

      setFeedback({ type: 'error', text: errorMessage });
      console.log('Erro', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = getValues('email').trim();

    if (!email) {
      setFeedback({ type: 'error', text: 'Digite seu e-mail para receber o link de acesso.' });
      return;
    }

    if (!emailPattern.test(email)) {
      setFeedback({ type: 'error', text: 'Digite um e-mail valido para recuperar a senha.' });
      return;
    }

    setResetLoading(true);
    setFeedback(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setFeedback({
        type: 'success',
        text: 'Enviamos um link de redefinicao para seu e-mail.',
      });
    } catch (error: any) {
      const errorMessage =
        error.code === 'auth/user-not-found'
          ? 'Nao encontramos uma conta com este e-mail.'
          : 'Nao foi possivel enviar o link agora. Tente novamente.';

      setFeedback({ type: 'error', text: errorMessage });
      console.log('Erro ao recuperar senha', error);
    } finally {
      setResetLoading(false);
    }
  };

  const emailLineTone = errors.email
    ? 'border-rose-400'
    : focusedField === 'email'
      ? 'border-[#128C7E]'
      : 'border-[#8ECFC0]';

  const passwordLineTone = errors.password
    ? 'border-rose-400'
    : focusedField === 'password'
      ? 'border-[#128C7E]'
      : 'border-[#C8DAD4]';

  const title = isLogin ? 'Entrar' : 'Criar conta';
  const buttonLabel = isLogin ? 'Ver meus lembretes' : 'Criar conta';
  const footerPrefix = isLogin ? 'Ainda nao tem conta?' : 'Ja tem conta?';
  const footerAction = isLogin ? 'Criar conta' : 'Entrar';

  const switchMode = () => {
    setIsLogin((current) => !current);
    setFeedback(null);
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={['top']}
      style={{ backgroundColor: theme.colors.background }}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

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
              <Text
                style={[authFonts.black, { color: theme.colors.text }]}
                className="text-[34px] leading-10">
                {title}
              </Text>
              <View className="mt-2 h-1 w-16 rounded-full bg-[#25D366]" />

              <View className="mt-7 gap-5">
                <View>
                  <Text
                    style={[authFonts.black, { color: theme.colors.textMuted }]}
                    className="text-[15px]">
                    E-mail
                  </Text>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: 'E-mail e obrigatorio',
                      pattern: {
                        value: emailPattern,
                        message: 'E-mail invalido',
                      },
                    }}
                    render={({ field: { value, onChange } }) => (
                      <View className={`mt-2 h-9 flex-row items-center border-b ${emailLineTone}`}>
                        <Mail
                          size={16}
                          color={errors.email ? theme.colors.danger : theme.colors.textSoft}
                        />
                        <TextInput
                          allowFontScaling={false}
                          cursorColor={theme.colors.primary}
                          selectionColor={theme.colors.primary}
                          underlineColorAndroid="transparent"
                          placeholder="seu@email.com"
                          placeholderTextColor={theme.colors.textSoft}
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            clearFeedback();
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          inputMode="email"
                          onFocus={() => setFocusedField('email')}
                          onBlur={() =>
                            setFocusedField((previous) => (previous === 'email' ? null : previous))
                          }
                          style={[authFonts.semibold, { color: theme.colors.text }]}
                          className="ml-2 flex-1 py-1 text-[15px]"
                        />
                      </View>
                    )}
                  />
                  {errors.email ? (
                    <Text style={authFonts.semibold} className="mt-1 text-[13px] text-rose-600">
                      {errors.email.message}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text
                    style={[authFonts.black, { color: theme.colors.textMuted }]}
                    className="text-[15px]">
                    Senha
                  </Text>
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
                      <View
                        className={`mt-2 h-10 flex-row items-center border-b ${passwordLineTone}`}>
                        <LockKeyhole
                          size={16}
                          color={errors.password ? theme.colors.danger : theme.colors.textSoft}
                        />
                        <TextInput
                          allowFontScaling={false}
                          cursorColor={theme.colors.primary}
                          importantForAutofill="no"
                          selectionColor={theme.colors.primary}
                          textContentType="none"
                          underlineColorAndroid="transparent"
                          placeholder="sua senha"
                          placeholderTextColor={theme.colors.textSoft}
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            clearFeedback();
                          }}
                          secureTextEntry={!showPassword}
                          autoComplete="off"
                          onFocus={() => setFocusedField('password')}
                          onBlur={() =>
                            setFocusedField((previous) =>
                              previous === 'password' ? null : previous
                            )
                          }
                          style={[authFonts.semibold, { color: theme.colors.text }]}
                          className="ml-2 flex-1 py-1 text-[15px]"
                        />
                        <Pressable
                          onPress={() => setShowPassword(!showPassword)}
                          className="h-8 w-8 items-center justify-center rounded-full active:bg-[#F4EEEE]"
                          accessibilityRole="button"
                          accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                          {showPassword ? (
                            <EyeOff size={16} color={theme.colors.textSoft} />
                          ) : (
                            <Eye size={16} color={theme.colors.textSoft} />
                          )}
                        </Pressable>
                      </View>
                    )}
                  />
                  {errors.password ? (
                    <Text style={authFonts.semibold} className="mt-1 text-[13px] text-rose-600">
                      {errors.password.message}
                    </Text>
                  ) : null}
                </View>

                {isLogin ? (
                  <View className="mt-1 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="mr-2 h-4 w-4 rounded border border-[#128C7E] bg-[#128C7E]" />
                      <Text
                        style={[authFonts.black, { color: theme.colors.textMuted }]}
                        className="text-[13px]">
                        Sessao segura
                      </Text>
                    </View>

                    <Pressable
                      onPress={handlePasswordReset}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel="Recuperar senha"
                      accessibilityState={{ disabled: busy, busy: resetLoading }}
                      className="px-1 py-1 active:opacity-70">
                      <Text
                        style={authFonts.black}
                        className={`text-[13px] ${busy ? 'text-[#A8B8B2]' : 'text-[#128C7E]'}`}>
                        {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {feedback ? (
                  <View
                    className={`rounded-xl border px-3 py-2.5 ${
                      feedback.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-rose-200 bg-rose-50'
                    }`}>
                    <Text
                      style={authFonts.bold}
                      className={`text-center text-[13px] leading-5 ${
                        feedback.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                      {feedback.text}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="pt-9">
              <Pressable
                onPress={handleSubmit(handleAuth)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={isLogin ? 'Ver meus lembretes' : 'Criar minha conta'}
                accessibilityState={{ disabled: busy, busy: loading }}
                className={`h-14 items-center justify-center rounded-2xl ${
                  busy ? 'bg-[#128C7E]/55' : 'bg-[#128C7E] active:bg-[#0f766e]'
                }`}
                style={{
                  backgroundColor: busy ? `${theme.colors.primary}88` : theme.colors.primary,
                }}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={authFonts.black} className="text-[16px] text-white">
                    {buttonLabel}
                  </Text>
                )}
              </Pressable>

              <View className="mt-6 flex-row justify-center">
                <Text
                  style={[authFonts.semibold, { color: theme.colors.textSoft }]}
                  className="text-[14px]">
                  {footerPrefix}{' '}
                </Text>
                <Pressable onPress={switchMode} accessibilityRole="button">
                  <Text
                    style={[authFonts.black, { color: theme.colors.primary }]}
                    className="text-[14px]">
                    {footerAction}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
