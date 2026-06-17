import { auth } from '@/config/firebase';
import { CarteiraModal } from '@/modais/carteiraModal';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

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

const fonts = {
  regular: { fontFamily: 'Inter_400Regular' },
  medium: { fontFamily: 'Inter_500Medium' },
  bold: { fontFamily: 'Inter_700Bold' },
};

async function handleLogout() {
  await signOut(auth);
  router.replace('/(auth)/login');
}

function MenuRow({ icon, title, subtitle, badge, danger, onPress }: MenuRowProps) {
  const iconColor = danger ? '#E11D48' : '#128C7E';
  const iconBg = danger ? 'bg-red-50' : 'bg-[#E7F8F1]';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="flex-row items-center px-4 py-4">
      <View className={`mr-3 h-11 w-11 items-center justify-center rounded-[18px] ${iconBg}`}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            style={fonts.bold}
            className={`text-[15px] ${danger ? 'text-red-600' : 'text-[#24252C]'}`}>
            {title}
          </Text>

          {badge ? (
            <View className="ml-2 rounded-full bg-[#EEE7FF] px-2 py-0.5">
              <Text style={fonts.bold} className="text-[10px] text-[#6135E8]">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={fonts.medium} className="mt-0.5 text-[12px] text-[#8B8D97]">
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#B4B8C2" />
    </Pressable>
  );
}

function Divider() {
  return <View className="mx-4 h-px bg-[#EEF1F4]" />;
}

export function MenuPerfil({ userName }: ModalProps) {
  return (
    <View className="overflow-hidden rounded-[28px] bg-white">
      <MenuRow icon="chatbubbles-outline" title="Chats" subtitle="Minhas conversas" />
      <Divider />

      <MenuRow
        icon="notifications-outline"
        title="Notificacoes"
        subtitle="Lembretes enviados no WhatsApp"
      />
      <Divider />

      <CarteiraModal userName={userName} />
      <Divider />

      <MenuRow icon="ribbon-outline" title="Clube" subtitle="Pacotes de desconto" badge="Novo" />
      <Divider />

      <MenuRow icon="pricetag-outline" title="Cupons" subtitle="Descontos disponiveis" />
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
