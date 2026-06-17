import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { get, ref as dbRef, update } from 'firebase/database';
import { CheckCircle2, LogOut, Moon, Pencil, Phone, UserRound, X } from 'lucide-react-native';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  activateWhatsAppFromApp,
  getWhatsAppActivationErrorMessage,
} from '@/services/whatsappActivation';
import { useAppTheme, useThemePreference } from '@/theme/appTheme';
import { auth, database } from '../../src/config/firebase';

type ProfileRecord = {
  name?: string;
  phone?: string;
  whatsappActive?: boolean;
};

type SettingRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action: ReactNode;
};

const fonts = {
  medium: { fontFamily: 'Inter_500Medium' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

const surfaceShadow = {
  shadowColor: '#191622',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 3,
};

function formatPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, '') ?? '';

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone || 'WhatsApp nao informado';
}

function SettingRow({ icon, title, subtitle, action }: SettingRowProps) {
  const theme = useAppTheme();

  return (
    <View className="flex-row items-center px-4 py-4">
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-[16px]"
        style={{ backgroundColor: theme.colors.cardMuted }}>
        {icon}
      </View>

      <View className="flex-1 pr-3">
        <Text style={[fonts.bold, { color: theme.colors.text }]} className="text-[14px]">
          {title}
        </Text>
        <Text
          style={[fonts.medium, { color: theme.colors.textSoft }]}
          className="mt-0.5 text-[12px]"
          numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      {action}
    </View>
  );
}

export default function Perfil() {
  const theme = useAppTheme();
  const { preference, toggleTheme } = useThemePreference();
  const user = auth.currentUser;
  const [userName, setUserName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [activatingWhatsApp, setActivatingWhatsApp] = useState(false);
  const [activationFeedback, setActivationFeedback] = useState('');

  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }

    get(dbRef(database, `users/${user.uid}/name`))
      .then((snapshot) => {
        if (!snapshot.exists()) return;

        const val = snapshot.val() as ProfileRecord;
        setUserName(val.name ?? null);
        setPhone(val.phone ?? null);
        setWhatsappActive(val.whatsappActive === true);
      })
      .catch((error) => {
        console.log('Erro ao buscar perfil:', error);
      })
      .finally(() => setLoadingUser(false));
  }, [user]);

  const displayName = userName ?? user?.displayName ?? 'Usuario';
  const accountEmail = user?.email ?? 'sem-email@conta.com';
  const avatarLetter = (displayName || accountEmail || '?')[0].toUpperCase();
  const formattedPhone = useMemo(() => formatPhone(phone), [phone]);
  const themeModeLabel =
    preference === 'system' ? 'Seguindo o aparelho' : theme.isDark ? 'Tema escuro' : 'Tema claro';
  const canSaveName = nome.trim().length >= 2 && !saving;

  function openEditProfile() {
    setNome(displayName);
    setEditVisible(true);
  }

  function closeEditProfile() {
    setEditVisible(false);
  }

  async function salvarNome() {
    const trimmedName = nome.trim();

    if (!user || trimmedName.length < 2) return;

    try {
      setSaving(true);
      await updateProfile(user, { displayName: trimmedName });
      await update(dbRef(database, `users/${user.uid}/name`), { name: trimmedName });
      setUserName(trimmedName);
      closeEditProfile();
    } catch (error) {
      console.log('Erro ao atualizar nome:', error);
    } finally {
      setSaving(false);
    }
  }

  async function ativarWhatsApp() {
    if (!user || !phone) return;

    try {
      setActivatingWhatsApp(true);
      setActivationFeedback('');

      const activation = await activateWhatsAppFromApp({
        uid: user.uid,
        phone,
      });

      await update(dbRef(database, `users/${user.uid}/name`), {
        phone: activation.numero || phone,
        whatsappActive: activation.whatsappActive,
        whatsappLid: activation.lid,
        whatsappVerifiedAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem('user_phone', activation.numero || phone);
      setPhone(activation.numero || phone);
      setWhatsappActive(activation.whatsappActive);
      setActivationFeedback('WhatsApp conectado ao bot.');
    } catch (error) {
      setActivationFeedback(getWhatsAppActivationErrorMessage(error));
    } finally {
      setActivatingWhatsApp(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.replace('/(auth)/login');
  }

  if (loadingUser) {
    return (
      <LinearGradient colors={theme.gradient} locations={[0, 0.35, 0.72, 1]} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  if (!user) return null;

  return (
    <LinearGradient colors={theme.gradient} locations={[0, 0.35, 0.72, 1]} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} className="flex-1">
        <StatusBar backgroundColor={theme.colors.statusBar} barStyle={theme.statusBarStyle} />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-28 pt-5"
          showsVerticalScrollIndicator={false}>
          <View className="mb-5">
            <Text style={[fonts.black, { color: theme.colors.text }]} className="text-[24px]">
              Perfil
            </Text>
            <Text
              style={[fonts.medium, { color: theme.colors.textSoft }]}
              className="mt-1 text-[13px]">
              Conta e preferencias essenciais
            </Text>
          </View>

          <View
            className="rounded-[26px] p-5"
            style={[surfaceShadow, { backgroundColor: theme.colors.card }]}>
            <View className="flex-row items-center">
              <View
                className="h-[64px] w-[64px] items-center justify-center rounded-[24px]"
                style={{ backgroundColor: theme.colors.primary }}>
                <Text style={fonts.black} className="text-[25px] text-white">
                  {avatarLetter}
                </Text>
              </View>

              <View className="ml-4 flex-1">
                <Text
                  style={[fonts.black, { color: theme.colors.text }]}
                  className="text-[21px] leading-7"
                  numberOfLines={1}>
                  {displayName}
                </Text>
                <Text
                  style={[fonts.medium, { color: theme.colors.textMuted }]}
                  className="mt-1 text-[13px]"
                  numberOfLines={1}>
                  {accountEmail}
                </Text>
              </View>

              <Pressable
                onPress={openEditProfile}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.colors.cardMuted }}>
                <Pencil size={17} color={theme.colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View
            className="mt-4 overflow-hidden rounded-[26px]"
            style={[surfaceShadow, { backgroundColor: theme.colors.card }]}>
            <SettingRow
              icon={<Phone size={18} color={theme.colors.primary} />}
              title="WhatsApp"
              subtitle={`${formattedPhone} · ${
                whatsappActive ? 'conectado ao bot' : 'ativacao pendente'
              }`}
              action={
                whatsappActive ? (
                  <CheckCircle2 size={20} color={theme.colors.success} />
                ) : (
                  <Pressable
                    onPress={ativarWhatsApp}
                    disabled={activatingWhatsApp || !phone}
                    accessibilityRole="button"
                    accessibilityLabel="Ativar WhatsApp dos lembretes"
                    className="min-w-[72px] items-center rounded-[16px] px-3 py-2"
                    style={{ backgroundColor: theme.colors.primary }}>
                    {activatingWhatsApp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={fonts.black} className="text-[12px] text-white">
                        Ativar
                      </Text>
                    )}
                  </Pressable>
                )
              }
            />

            {activationFeedback ? (
              <Text
                style={[
                  fonts.bold,
                  { color: whatsappActive ? theme.colors.success : theme.colors.danger },
                ]}
                className="px-4 pb-4 text-[12px]">
                {activationFeedback}
              </Text>
            ) : null}

            <View className="mx-4 h-px" style={{ backgroundColor: theme.colors.border }} />

            <SettingRow
              icon={<Moon size={18} color={theme.colors.accent} />}
              title="Tema"
              subtitle={themeModeLabel}
              action={
                <Switch
                  value={theme.isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: theme.colors.border, true: theme.colors.accentMuted }}
                  thumbColor={theme.isDark ? theme.colors.accent : theme.colors.card}
                  ios_backgroundColor={theme.colors.border}
                  accessibilityLabel="Alternar tema escuro"
                />
              }
            />
          </View>

          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            className="mt-4 flex-row items-center justify-center rounded-[22px] px-4 py-4"
            style={{ backgroundColor: theme.colors.card }}>
            <LogOut size={18} color={theme.colors.danger} />
            <Text
              style={[fonts.black, { color: theme.colors.danger }]}
              className="ml-2 text-[14px]">
              Sair da conta
            </Text>
          </Pressable>
        </ScrollView>

        <Modal
          visible={editVisible}
          transparent
          animationType="slide"
          onRequestClose={closeEditProfile}>
          <View className="flex-1 justify-end bg-black/35">
            <Pressable className="absolute inset-0" onPress={closeEditProfile} />

            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={72}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
              <View
                className="rounded-t-[30px] px-5 pb-7 pt-3"
                style={[surfaceShadow, { backgroundColor: theme.colors.card }]}>
                <View className="items-center pb-3">
                  <View
                    className="h-1.5 w-11 rounded-full"
                    style={{ backgroundColor: theme.colors.border }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      style={[fonts.black, { color: theme.colors.text }]}
                      className="text-[22px]">
                      Editar perfil
                    </Text>
                    <Text
                      style={[fonts.medium, { color: theme.colors.textSoft }]}
                      className="mt-1 text-[13px]">
                      Atualize o nome exibido na conta.
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeEditProfile}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar edicao de perfil"
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.colors.cardMuted }}>
                    <X size={18} color={theme.colors.textMuted} />
                  </Pressable>
                </View>

                <View className="mt-6">
                  <Text
                    style={[fonts.bold, { color: theme.colors.textMuted }]}
                    className="mb-2 text-[13px]">
                    Nome
                  </Text>

                  <View
                    className="flex-row items-center rounded-[20px] border px-4"
                    style={{
                      backgroundColor: theme.colors.cardMuted,
                      borderColor: theme.colors.border,
                    }}>
                    <UserRound size={17} color={theme.colors.primary} />
                    <TextInput
                      value={nome}
                      onChangeText={setNome}
                      placeholder="Digite seu nome"
                      placeholderTextColor={theme.colors.textSoft}
                      autoCapitalize="words"
                      cursorColor={theme.colors.primary}
                      selectionColor={theme.colors.primary}
                      className="ml-3 flex-1 py-4 text-[16px]"
                      style={[fonts.medium, { color: theme.colors.text }]}
                    />
                  </View>
                </View>

                <View className="mt-6 flex-row gap-3">
                  <Pressable
                    onPress={closeEditProfile}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar edicao"
                    className="h-[52px] flex-1 items-center justify-center rounded-[18px] border"
                    style={{
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    }}>
                    <Text
                      style={[fonts.bold, { color: theme.colors.textMuted }]}
                      className="text-[14px]">
                      Cancelar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={salvarNome}
                    disabled={!canSaveName}
                    accessibilityRole="button"
                    accessibilityLabel="Salvar perfil"
                    className="h-[52px] flex-1 items-center justify-center rounded-[18px]"
                    style={{
                      backgroundColor: canSaveName ? theme.colors.primary : theme.colors.border,
                    }}>
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={fonts.black}
                        className={`text-[14px] ${canSaveName ? 'text-white' : 'text-[#8B8D97]'}`}>
                        Salvar
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
