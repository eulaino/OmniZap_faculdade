import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { auth, database } from '../../src/config/firebase';
import { ref as dbRef, get, set } from 'firebase/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IndicarModal } from '@/modais/IndicarModal';
import { MenuPerfil } from '@/components/menuPerfil';
import { Atmosphere } from '@/components/ui/Atmosphere';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { updateProfile } from 'firebase/auth';

export default function Perfil() {
  const [fontsLoaded] = useFonts({
    SofiaProBold: require('../../assets/fonts/SofiaProBold.otf'),
    SofiaProRegular: require('../../assets/fonts/SofiaProRegular.otf'),
  });

  const user = auth.currentUser;
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true); // 👈 adicionar
  const [visible, setVisible] = useState(false);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const avatarColors = ['#128C7E', '#0F766E', '#14B8A6', '#0284C7', '#0EA5E9', '#334155'];

  useEffect(() => {
    if (user) {
      get(dbRef(database, `users/${user.uid}/name`)).then((snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setUserName(val.name ?? null);
        }
      })
        .finally(() => setLoadingUser(false));
    } else {
      setLoadingUser(false);
    }
  }, [user]);

  function getAvatarColor(char: string) {
    return avatarColors[(char.codePointAt(0) ?? 0) % avatarColors.length];
  }

  const onClose = () => {
    setVisible(false);
  };

  async function salvarNome() {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      await updateProfile(user, {
        displayName: nome.trim(),
      });

      await set(dbRef(database, `users/${user.uid}/name`), {
        name: nome.trim()
      })

      setUserName(nome.trim());
      onClose();

    } catch (error) {
      console.log('Erro ao atualizar nome:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return null;

  const avatarLetter = (userName ?? user.displayName ?? user.email ?? '?')[0].toUpperCase();
  const avatarColor = getAvatarColor(avatarLetter);
  const displayName = userName ?? user.displayName ?? 'Usuario';
  const accountEmail = user.email ?? 'sem-email@conta.com';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#EAF7F1]">
      <StatusBar backgroundColor="#EAF7F1" barStyle="dark-content" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <Atmosphere className="mx-4">
          <SurfaceCard>
            <Eyebrow>minha conta</Eyebrow>

            <Text className="mt-2 text-3xl font-black leading-9 text-slate-900">
              Perfil
            </Text>

            <Text className="mt-2 text-sm leading-5 text-slate-500">
              Centralize seus dados e acessos em uma experiencia limpa e organizada.
            </Text>

            <View className="mt-5 rounded-2xl border border-[#DCEAE5] bg-[#F7FCFA] p-4">
              {/* Botão Editar perfil */}
              <Pressable className="flex-row items-center" onPress={() => { setNome(displayName); setVisible(true) }}>
                <View
                  className="h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: avatarColor }}
                >
                  <Text style={{ fontFamily: 'SofiaProBold' }} className="text-2xl text-white">
                    {avatarLetter}
                  </Text>
                </View>

                <View className="ml-3 flex-1">
                  <Text style={{ fontFamily: 'SofiaProBold' }} className="text-lg text-slate-900">
                    {displayName}
                  </Text>

                  <Text style={{ fontFamily: 'SofiaProRegular' }} className="mt-0.5 text-sm text-slate-500">
                    {accountEmail}
                  </Text>

                  <View className="mt-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                    <Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      conta ativa
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </SurfaceCard>
        </Atmosphere>

        <IndicarModal userName={userName} modalVisible={modalVisible} onSetVisible={setModalVisible} />
        <MenuPerfil userName={userName} />
      </ScrollView>

{/* Modal Editar Nome */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
          />

          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              Editar perfil
            </Text>

            <Text className="mt-2 text-sm text-slate-500">
              Altere seu nome de exibição.
            </Text>

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Nome
              </Text>

              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
                placeholderTextColor="#94a3b8"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              />
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 rounded-2xl bg-slate-100 py-4"
              >
                <Text className="text-center font-semibold text-slate-700">
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={salvarNome}
                className="flex-1 rounded-2xl bg-orange-500 py-4"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    Salvar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
