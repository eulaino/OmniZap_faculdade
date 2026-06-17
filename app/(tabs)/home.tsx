import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StatusBar, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebase';
import { ListaComandos, type ReminderListFilter } from '@/components/ListaLembretes';
import { PendingActionModal } from '@/components/PendingActionModal';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/useDashboard';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useFocusEffect } from 'expo-router';
import { useBotHealth } from '@/hooks/useBotHealth';
import { BotHealthBanner } from '@/components/BotHealthBanner';
import Toast from 'react-native-toast-message';

import { NotificationBellIcon } from '@/components/home/NotificationBellIcon';
import { getQuickDateOptions, type QuickDateOption } from '@/services/reminderEdit';
import { dashboardQueryKey, pendingActionsQueryKey } from '@/services/reminderQueries';

const homeFonts = {
  medium: { fontFamily: 'Inter_500Medium' },
  semibold: { fontFamily: 'Inter_600SemiBold' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

const surfaceShadow = {
  shadowColor: '#191622',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.055,
  shadowRadius: 20,
  elevation: 2,
};

const pageGradient = ['#FFFFFF', '#FBFFFD', '#F4FFF9', '#F7F3FF'] as const;

const filters: { label: string; value: ReminderListFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pontuais', value: 'once' },
  { label: 'Recorrentes', value: 'recurring' },
];

function formatMetric(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getDateSectionTitle(option?: QuickDateOption) {
  if (option?.label === 'Hoje') return 'Lembretes de hoje';
  if (option?.label === 'Amanha') return 'Lembretes de amanha';

  return `Lembretes de ${option?.weekdayLabel ?? 'dia'}`;
}

type DateOptionCardProps = {
  onPress: () => void;
  option: QuickDateOption;
  selected: boolean;
};

function DateOptionCard({ onPress, option, selected }: DateOptionCardProps) {
  const [day] = option.value.split('/');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.accessibilityLabel}
      className={`mr-3 h-[78px] w-[58px] items-center justify-center rounded-2xl ${
        selected ? 'bg-[#6135E8]' : 'bg-white'
      }`}
      style={selected ? undefined : surfaceShadow}>
      <Text
        style={homeFonts.medium}
        className={`text-[11px] ${selected ? 'text-white/80' : 'text-[#747887]'}`}>
        {option.label}
      </Text>
      <Text
        style={homeFonts.black}
        className={`mt-1 text-[18px] ${selected ? 'text-white' : 'text-[#24252C]'}`}>
        {day}
      </Text>
      <Text
        style={homeFonts.medium}
        className={`mt-0.5 text-[11px] ${selected ? 'text-white/75' : 'text-[#8B8D97]'}`}>
        {option.weekdayLabel}
      </Text>
    </Pressable>
  );
}

type FilterChipProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

function FilterChip({ label, onPress, selected }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}`}
      className={`mr-3 h-10 min-w-[86px] items-center justify-center rounded-xl px-4 ${
        selected ? 'bg-[#6135E8]' : 'bg-[#EEE7FF]'
      }`}>
      <Text
        style={homeFonts.bold}
        className={`text-[12px] ${selected ? 'text-white' : 'text-[#6135E8]'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type AgendaSummaryProps = {
  isFetching: boolean;
  totalNotifications: number;
  totalReminders: number;
};

function AgendaSummary({ isFetching, totalNotifications, totalReminders }: AgendaSummaryProps) {
  return (
    <View className="mt-6 rounded-2xl bg-white px-4 py-3" style={surfaceShadow}>
      <Text style={homeFonts.bold} className="text-[13px] text-[#24252C]">
        {formatMetric(totalReminders)} lembretes ativos
      </Text>
      <Text style={homeFonts.medium} className="mt-1 text-[12px] text-[#8B8D97]">
        {isFetching
          ? 'Atualizando dados do WhatsApp...'
          : `${formatMetric(totalNotifications)} avisos enviados pelo WhatsApp`}
      </Text>
    </View>
  );
}

export default function Home() {
  const user = auth.currentUser;
  const [userName, setUserName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const queryClient = useQueryClient();
  const { pendingActions, confirmPending, cancelPending, isConfirming, isCanceling } =
    usePendingActions();
  const pendingAction = pendingActions[0] ?? null;
  const dateOptions = useMemo(() => getQuickDateOptions(), []);
  const [selectedDate, setSelectedDate] = useState(() => getQuickDateOptions()[0]?.inputDate);
  const [selectedFilter, setSelectedFilter] = useState<ReminderListFilter>('all');

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
  const displayName = userName || user?.displayName || 'Voce';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'O';
  const hasAlert = botOffline || !!pendingAction || isError;
  const selectedDateOption = dateOptions.find((option) => option.inputDate === selectedDate);

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
          contentContainerClassName="px-6 pb-28 pt-5"
          showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#159DEA]">
              <Text style={homeFonts.black} className="text-[18px] text-white">
                {avatarLetter}
              </Text>
            </View>

            <View className="items-center">
              <Text style={homeFonts.black} className="text-[20px] leading-6 text-[#24252C]">
                Meus lembretes
              </Text>
              <Text style={homeFonts.medium} className="mt-1 text-[12px] text-[#8B8D97]">
                {displayName}
              </Text>
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

          <View className="mt-8">
            <Text style={homeFonts.bold} className="text-[13px] text-[#747887]">
              Escolha o dia
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 mt-3"
            contentContainerClassName="px-6">
            {dateOptions.map((option) => (
              <DateOptionCard
                key={option.inputDate}
                option={option}
                selected={selectedDate === option.inputDate}
                onPress={() => setSelectedDate(option.inputDate)}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 mt-5"
            contentContainerClassName="px-6">
            {filters.map((filterOption) => (
              <FilterChip
                key={filterOption.value}
                label={filterOption.label}
                selected={selectedFilter === filterOption.value}
                onPress={() => setSelectedFilter(filterOption.value)}
              />
            ))}
          </ScrollView>

          <AgendaSummary
            isFetching={isDashboardFetching}
            totalNotifications={totalNotifications}
            totalReminders={totalReminders}
          />

          <View className="mt-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={homeFonts.black} className="text-[19px] text-[#24252C]">
                {getDateSectionTitle(selectedDateOption)}
              </Text>
              <Text style={homeFonts.bold} className="text-[12px] text-[#8B8D97]">
                Toque para editar
              </Text>
            </View>
            <ListaComandos
              filter={selectedFilter}
              selectedDate={selectedDate}
              emptyTitle="Nenhum lembrete neste dia"
              emptyDescription="Escolha outra data ou crie um novo lembrete."
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
