import { auth } from '@/config/firebase';
import { CarteiraModal } from '@/modais/carteiraModal';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/appTheme';

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
  const theme = useAppTheme();
  const iconColor = danger ? theme.colors.danger : theme.colors.primary;
  const iconBg = danger ? '#3A1720' : theme.colors.successMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="flex-row items-center px-4 py-4">
      <View
        className="mr-3 h-11 w-11 items-center justify-center rounded-[18px]"
        style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            style={[fonts.bold, { color: danger ? theme.colors.danger : theme.colors.text }]}
            className="text-[15px]">
            {title}
          </Text>

          {badge ? (
            <View
              className="ml-2 rounded-full px-2 py-0.5"
              style={{ backgroundColor: theme.colors.accentMuted }}>
              <Text style={[fonts.bold, { color: theme.colors.accent }]} className="text-[10px]">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[fonts.medium, { color: theme.colors.textSoft }]}
          className="mt-0.5 text-[12px]">
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} />
    </Pressable>
  );
}

function Divider() {
  const theme = useAppTheme();

  return <View className="mx-4 h-px" style={{ backgroundColor: theme.colors.border }} />;
}

export function MenuPerfil({ userName }: ModalProps) {
  const theme = useAppTheme();

  return (
    <View className="overflow-hidden rounded-[28px]" style={{ backgroundColor: theme.colors.card }}>
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
