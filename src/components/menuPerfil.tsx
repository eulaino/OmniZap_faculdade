import { auth } from '@/config/firebase';
import { CarteiraModal } from '@/modais/carteiraModal';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import type { ComponentProps } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

type ModalProps = {
  userName: string | null;
};

type MenuRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  badge?: string;
  danger?: boolean;
  onPress?: () => void;
};

async function handleLogout() {
  await signOut(auth);
  router.replace('/(auth)/login');
}

function MenuRow({ icon, title, subtitle, badge, danger, onPress }: MenuRowProps) {
  const iconColor = danger ? '#0F766E' : '#0f172a';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center justify-between px-4 py-3.5">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text
          style={{ fontFamily: 'Inter_700Bold' }}
          className={danger ? 'text-lg text-emerald-700' : 'text-lg text-slate-900'}>
          {title}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular' }} className="mt-0.5 text-xs text-slate-500">
          {subtitle}
        </Text>
      </View>

      <View className="ml-3 flex-row items-center">
        {badge ? (
          <View className="mr-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5">
            <Text
              style={{ fontFamily: 'Inter_700Bold' }}
              className="text-[10px] uppercase text-emerald-700">
              {badge}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View className="mx-4 h-px bg-slate-200" />;
}

export function MenuPerfil({ userName }: ModalProps) {
  return (
    <View className="mx-4 mb-8 mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <MenuRow icon="chatbubbles-outline" title="Chats" subtitle="Minhas conversas" />
      <Divider />

      <MenuRow
        icon="notifications-outline"
        title="Notificacoes"
        subtitle="Minha central de alertas"
      />
      <Divider />

      <CarteiraModal userName={userName} />
      <Divider />

      <MenuRow
        icon="ribbon-outline"
        title="Clube"
        subtitle="Meus pacotes de desconto"
        badge="Novo"
      />
      <Divider />

      <MenuRow icon="pricetag-outline" title="Cupons" subtitle="Meus cupons de desconto" />
      <Divider />

      <MenuRow
        icon="log-out-outline"
        title="Sair da conta"
        subtitle="Encerrar sessao neste dispositivo"
        danger
        onPress={handleLogout}
      />
    </View>
  );
}
