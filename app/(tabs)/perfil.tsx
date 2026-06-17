import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { get, ref as dbRef, update } from 'firebase/database';
import { CheckCircle2, ChevronRight, Mail, Pencil, Phone, UserRound, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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

import { MenuPerfil } from '@/components/menuPerfil';
import { IndicarModal } from '@/modais/IndicarModal';
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
  whatsappLid?: string | null;
};

const fonts = {
  regular: { fontFamily: 'Inter_400Regular' },
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
  const [modalVisible, setModalVisible] = useState(false);

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
    preference === 'system' ? 'Sistema' : theme.isDark ? 'Tema escuro' : 'Tema claro';
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

      await updateProfile(user, {
        displayName: trimmedName,
      });

      await update(dbRef(database, `users/${user.uid}/name`), {
        name: trimmedName,
      });

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
          <View className="items-center">
            <Text
              style={[fonts.black, { color: theme.colors.text }]}
              className="text-[20px] leading-6">
              Perfil
            </Text>
            <Text
              style={[fonts.medium, { color: theme.colors.textSoft }]}
              className="mt-1 text-[12px]">
              Conta e preferencias
            </Text>
          </View>

          <View
            className="mt-7 rounded-[30px] p-5"
            style={[surfaceShadow, { backgroundColor: theme.colors.card }]}>
            <View className="flex-row items-start">
              <View
                className="h-[72px] w-[72px] items-center justify-center rounded-[26px]"
                style={{ backgroundColor: theme.colors.primary }}>
                <Text style={fonts.black} className="text-[28px] text-white">
                  {avatarLetter}
                </Text>
              </View>

              <View className="ml-4 flex-1">
                <View
                  className="self-start rounded-full px-3 py-1.5"
                  style={{ backgroundColor: theme.colors.successMuted }}>
                  <Text
                    style={[fonts.bold, { color: theme.colors.success }]}
                    className="text-[11px]">
                    Conta ativa
                  </Text>
                </View>

                <Text
                  style={[fonts.black, { color: theme.colors.text }]}
                  className="mt-3 text-[23px] leading-7">
                  {displayName}
                </Text>

                <Text
                  style={[fonts.medium, { color: theme.colors.textMuted }]}
                  className="mt-1 text-[13px] leading-5"
                  numberOfLines={1}>
                  {accountEmail}
                </Text>
              </View>
            </View>

            <View className="mt-5 gap-3">
              <View
                className="flex-row items-center rounded-[22px] px-4 py-3"
                style={{ backgroundColor: theme.colors.cardMuted }}>
                <Phone size={17} color={theme.colors.primary} />
                <View className="ml-3 flex-1">
                  <Text
                    style={[fonts.bold, { color: theme.colors.textSoft }]}
                    className="text-[11px]">
                    WhatsApp dos lembretes
                  </Text>
                  <Text
                    style={[fonts.bold, { color: theme.colors.text }]}
                    className="mt-0.5 text-[14px]">
                    {formattedPhone}
                  </Text>
                  <Text
                    style={fonts.bold}
                    className={`mt-1 text-[11px] ${
                      whatsappActive ? 'text-[#128C7E]' : 'text-[#B45309]'
                    }`}>
                    {whatsappActive ? 'Conectado ao bot' : 'Ativacao pendente'}
                  </Text>
                </View>
                {whatsappActive ? (
                  <CheckCircle2 size={18} color={theme.colors.primary} />
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
                )}
              </View>

              {activationFeedback ? (
                <Text
                  style={fonts.bold}
                  className={`px-1 text-[12px] ${
                    whatsappActive ? 'text-[#128C7E]' : 'text-rose-600'
                  }`}>
                  {activationFeedback}
                </Text>
              ) : null}

              <View
                className="flex-row items-center rounded-[22px] px-4 py-3"
                style={{ backgroundColor: theme.colors.cardMuted }}>
                <Mail size={17} color={theme.colors.accent} />
                <View className="ml-3 flex-1">
                  <Text
                    style={[fonts.bold, { color: theme.colors.textSoft }]}
                    className="text-[11px]">
                    E-mail de acesso
                  </Text>
                  <Text
                    style={[fonts.bold, { color: theme.colors.text }]}
                    className="mt-0.5 text-[14px]"
                    numberOfLines={1}>
                    {accountEmail}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={openEditProfile}
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
              className="mt-5 h-[52px] flex-row items-center justify-center rounded-[20px]"
              style={{ backgroundColor: theme.colors.primary }}>
              <Pencil size={16} color="#FFFFFF" />
              <Text style={fonts.black} className="ml-2 text-[15px] text-white">
                Editar perfil
              </Text>
            </Pressable>
          </View>

          <IndicarModal
            userName={userName}
            modalVisible={modalVisible}
            onSetVisible={setModalVisible}
          />

          <View className="mt-5">
            <Text style={[fonts.black, { color: theme.colors.text }]} className="mb-3 text-[18px]">
              Preferencias
            </Text>
            <View
              className="mb-3 flex-row items-center rounded-[24px] px-4 py-3"
              style={[surfaceShadow, { backgroundColor: theme.colors.card }]}>
              <View className="flex-1">
                <Text style={[fonts.bold, { color: theme.colors.text }]} className="text-[15px]">
                  Tema escuro
                </Text>
                <Text
                  style={[fonts.medium, { color: theme.colors.textSoft }]}
                  className="mt-0.5 text-[12px]">
                  {themeModeLabel}
                </Text>
              </View>
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.accentMuted }}
                thumbColor={theme.isDark ? theme.colors.accent : theme.colors.card}
                ios_backgroundColor={theme.colors.border}
                accessibilityLabel="Alternar tema escuro"
              />
            </View>
            <MenuPerfil userName={userName} />
          </View>
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
                      O nome aparece na sua conta.
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
                    className="h-[52px] flex-1 flex-row items-center justify-center rounded-[18px]"
                    style={{
                      backgroundColor: canSaveName ? theme.colors.primary : theme.colors.border,
                    }}>
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text
                          style={fonts.black}
                          className={`text-[14px] ${canSaveName ? 'text-white' : 'text-[#8B8D97]'}`}>
                          Salvar
                        </Text>
                        <ChevronRight size={16} color={canSaveName ? '#FFFFFF' : '#8B8D97'} />
                      </>
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
