import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StatusBar, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebase';
import { ListaComandos } from '@/components/ListaLembretes';
import { PendingActionModal } from '@/components/PendingActionModal';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/useDashboard';
import { usePendingActions } from '@/hooks/usePendingActions';
import { router, useFocusEffect } from 'expo-router';
import { useBotHealth } from '@/hooks/useBotHealth';
import { BotHealthBanner } from '@/components/BotHealthBanner';
import Toast from 'react-native-toast-message';
import { CalendarDays, MessageSquareText, Plus, SendHorizonal } from 'lucide-react-native';

import { NotificationBellIcon } from '@/components/home/NotificationBellIcon';
import { dashboardQueryKey, pendingActionsQueryKey } from '@/services/reminderQueries';

const homeFonts = {
  medium: { fontFamily: 'Inter_500Medium' },
  semibold: { fontFamily: 'Inter_600SemiBold' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

const softCardShadow = {
  shadowColor: '#0F3D35',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
};

const surfaceShadow = {
  shadowColor: '#191622',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.055,
  shadowRadius: 20,
  elevation: 2,
};

const pageGradient = ['#FFFFFF', '#FBFFFD', '#F4FFF9', '#F7F3FF'] as const;

function formatMetric(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 82;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <View className="h-[82px] w-[82px] items-center justify-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#7DCEBE"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={homeFonts.black} className="absolute text-[15px] text-white">
        {progress}%
      </Text>
    </View>
  );
}

type MiniReminderCardProps = {
  title: string;
  label: string;
  value: number;
  tint: 'mint' | 'teal';
};

function MiniReminderCard({ title, label, value, tint }: MiniReminderCardProps) {
  const isMint = tint === 'mint';

  return (
    <View
      style={softCardShadow}
      className={`mr-4 w-[174px] rounded-2xl border border-white/80 p-4 ${
        isMint ? 'bg-[#E7F8F1]' : 'bg-[#E4F6F3]'
      }`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text style={homeFonts.medium} className="text-[12px] text-[#747887]">
            {label}
          </Text>
          <Text style={homeFonts.bold} className="mt-2 text-[15px] leading-5 text-[#24252C]">
            {title}
          </Text>
        </View>

        <View
          className={`h-8 w-8 items-center justify-center rounded-xl ${
            isMint ? 'bg-[#CFF1E4]' : 'bg-[#C9EEE8]'
          }`}>
          {isMint ? (
            <MessageSquareText size={16} color="#128C7E" />
          ) : (
            <SendHorizonal size={16} color="#0F766E" />
          )}
        </View>
      </View>

      <View className="mt-5 h-1.5 overflow-hidden rounded-full bg-white">
        <View
          className={`h-full rounded-full ${isMint ? 'bg-[#128C7E]' : 'bg-[#25D366]'}`}
          style={{ width: `${Math.min(100, Math.max(12, value * 12))}%` }}
        />
      </View>
    </View>
  );
}

type SummaryGroupCardProps = {
  title: string;
  subtitle: string;
  percent: number;
  tone: 'pink' | 'purple' | 'orange';
};

function SummaryGroupCard({ title, subtitle, percent, tone }: SummaryGroupCardProps) {
  const toneStyles = {
    pink: {
      iconBg: 'bg-[#FFE4F3]',
      icon: '#EC4899',
      ring: '#F472B6',
    },
    purple: {
      iconBg: 'bg-[#EEE7FF]',
      icon: '#7C3AED',
      ring: '#8B5CF6',
    },
    orange: {
      iconBg: 'bg-[#FFE8D8]',
      icon: '#FB7A35',
      ring: '#FB7A35',
    },
  }[tone];

  return (
    <View style={surfaceShadow} className="mb-3 flex-row items-center rounded-2xl bg-white p-4">
      <View
        className={`mr-4 h-11 w-11 items-center justify-center rounded-xl ${toneStyles.iconBg}`}>
        <CalendarDays size={19} color={toneStyles.icon} />
      </View>

      <View className="flex-1">
        <Text style={homeFonts.bold} className="text-[15px] text-[#24252C]">
          {title}
        </Text>
        <Text style={homeFonts.medium} className="mt-1 text-[11px] text-[#8B8D97]">
          {subtitle}
        </Text>
      </View>

      <View
        className="h-[54px] w-[54px] items-center justify-center rounded-full border-[3px] bg-white"
        style={{ borderColor: toneStyles.ring }}>
        <Text style={homeFonts.bold} className="text-[12px] text-[#24252C]">
          {percent}%
        </Text>
      </View>
    </View>
  );
}

export default function Home() {
  const user = auth.currentUser;
  const [userName, setUserName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const navigatingRef = useRef(false);
  const queryClient = useQueryClient();
  const { pendingActions, confirmPending, cancelPending, isConfirming, isCanceling } =
    usePendingActions();
  const pendingAction = pendingActions[0] ?? null;

  useEffect(() => {
    async function buscarNome() {
      if (!user) {
        setLoadingName(false);
        return;
      }
      try {
        const snapshot = await get(ref(database, `users/${user.uid}/name`));
        if (snapshot.exists()) {
          const val = snapshot.val();
          setUserName(val.name ?? '');
        }
      } catch (error) {
        console.log('Erro ao buscar nome:', error);
      } finally {
        setLoadingName(false);
      }
    }
    buscarNome();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;

      queryClient.invalidateQueries({
        queryKey: dashboardQueryKey(user.uid),
      });

      queryClient.invalidateQueries({
        queryKey: pendingActionsQueryKey(user.uid),
      });
    }, [queryClient, user?.uid])
  );

  const { data, isLoading, isFetching: isDashboardFetching, isError } = useDashboard();
  const {
    data: botHealth,
    isFetching: isCheckingBotHealth,
    refetch: refetchBotHealth,
  } = useBotHealth();

  const botOffline = botHealth?.state === 'offline';
  const totalReminders = data?.total_comandos ?? 0;
  const totalNotifications = data?.total_atendimentos ?? 0;
  const progress = totalReminders > 0 ? Math.min(95, Math.max(35, totalNotifications * 8)) : 0;
  const displayName = userName || user?.displayName || 'Voce';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'O';
  const hasAlert = botOffline || !!pendingAction || isError;

  const handleCreateReminder = useCallback(() => {
    if (navigatingRef.current) return;

    navigatingRef.current = true;
    router.push('/criar-comando');

    setTimeout(() => {
      navigatingRef.current = false;
    }, 700);
  }, []);

  const handleTestBotConnection = useCallback(async () => {
    const result = await refetchBotHealth();
    const state = result.data?.state ?? 'offline';

    Toast.show({
      type: state === 'online' ? 'success' : 'error',
      text1: state === 'online' ? 'Bot conectado' : 'Bot offline',
      text2: state === 'online' ? 'Conexao restabelecida.' : 'Ainda nao foi possivel conectar.',
      position: 'bottom',
      bottomOffset: 140,
    });
  }, [refetchBotHealth]);

  if (loadingName || isLoading) {
    return (
      <LinearGradient colors={pageGradient} locations={[0, 0.35, 0.72, 1]} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6135E8" />
        </View>
      </LinearGradient>
    );
  }

  if (!user) return null;

  return (
    <LinearGradient colors={pageGradient} locations={[0, 0.35, 0.72, 1]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

        {botOffline ? (
          <BotHealthBanner
            checkedAt={botHealth?.checkedAt}
            isChecking={isCheckingBotHealth}
            onTestConnection={handleTestBotConnection}
          />
        ) : null}

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-8 pt-5"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-[#159DEA]">
                <Text style={homeFonts.black} className="text-[20px] text-white">
                  {avatarLetter}
                </Text>
              </View>

              <View>
                <Text style={homeFonts.medium} className="text-[13px] text-[#24252C]">
                  Ola!
                </Text>
                <Text style={homeFonts.black} className="mt-1 text-[18px] text-[#24252C]">
                  {displayName}
                </Text>
              </View>
            </View>

            <Pressable
              style={surfaceShadow}
              className="relative h-11 w-11 items-center justify-center rounded-2xl bg-white"
              accessibilityRole="button"
              accessibilityLabel="Notificacoes">
              <NotificationBellIcon size={24} />
              {hasAlert ? (
                <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#6135E8]" />
              ) : null}
            </Pressable>
          </View>

          <View className="mt-7 overflow-hidden rounded-[22px] bg-[#6135E8] px-5 py-5">
            <View className="absolute -right-12 top-6 h-5 w-44 rotate-[-18deg] rounded-full bg-white/10" />
            <View className="absolute -right-8 top-16 h-5 w-36 rotate-[-18deg] rounded-full bg-white/10" />

            <View className="flex-row items-center justify-between">
              <View className="max-w-[185px]">
                <Text style={homeFonts.bold} className="text-[16px] leading-6 text-white">
                  Seus lembretes chegam direto no WhatsApp.
                </Text>

                <Pressable
                  onPress={handleCreateReminder}
                  className="mt-6 h-12 w-[128px] items-center justify-center rounded-xl bg-white/90"
                  accessibilityRole="button"
                  accessibilityLabel="Criar novo lembrete">
                  <Text style={homeFonts.black} className="text-[14px] text-[#6135E8]">
                    Novo lembrete
                  </Text>
                </Pressable>
              </View>

              <CircularProgress progress={progress} />
            </View>
          </View>

          <View className="mt-7 flex-row items-center">
            <Text style={homeFonts.black} className="text-[19px] text-[#24252C]">
              Resumo
            </Text>
            <View className="ml-2 rounded-full bg-[#EEE7FF] px-2 py-0.5">
              <Text style={homeFonts.bold} className="text-[11px] text-[#6135E8]">
                {formatMetric(totalReminders + totalNotifications)}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 mt-4"
            contentContainerClassName="px-6">
            <MiniReminderCard
              title="Lembretes cadastrados"
              label="Ativos no app"
              value={totalReminders}
              tint="mint"
            />
            <MiniReminderCard
              title="Avisos enviados"
              label={isDashboardFetching ? 'Atualizando' : 'WhatsApp'}
              value={totalNotifications}
              tint="teal"
            />
          </ScrollView>

          <View className="mt-7">
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={homeFonts.black} className="text-[19px] text-[#24252C]">
                Meus lembretes
              </Text>
              <Text style={homeFonts.bold} className="text-[12px] text-[#8B8D97]">
                Toque para editar
              </Text>
            </View>
            <ListaComandos />
          </View>

          <View className="mt-7 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text style={homeFonts.black} className="text-[19px] text-[#24252C]">
                Grupos de lembretes
              </Text>
              <View className="ml-2 rounded-full bg-[#EEE7FF] px-2 py-0.5">
                <Text style={homeFonts.bold} className="text-[11px] text-[#6135E8]">
                  3
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateReminder}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#6135E8]"
              accessibilityRole="button"
              accessibilityLabel="Novo lembrete">
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="mt-4">
            <SummaryGroupCard
              title="Hoje"
              subtitle="Lembretes para nao esquecer"
              percent={Math.min(99, Math.max(0, progress))}
              tone="pink"
            />
            <SummaryGroupCard
              title="Recorrentes"
              subtitle="Rotinas que voltam sozinhas"
              percent={totalReminders > 0 ? 52 : 0}
              tone="purple"
            />
            <SummaryGroupCard
              title="WhatsApp"
              subtitle="Avisos entregues por mensagem"
              percent={totalNotifications > 0 ? 87 : 0}
              tone="orange"
            />
          </View>
        </ScrollView>

        <PendingActionModal
          visible={!!pendingAction}
          action={pendingAction}
          isConfirming={isConfirming}
          isCanceling={isCanceling}
          onConfirm={() => {
            if (pendingAction) {
              void confirmPending(pendingAction.id);
            }
          }}
          onCancel={() => {
            if (pendingAction) {
              void cancelPending(pendingAction.id);
            }
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
