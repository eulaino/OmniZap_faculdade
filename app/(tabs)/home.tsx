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
import { useAppTheme } from '@/theme/appTheme';

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

const filters: { label: string; value: ReminderListFilter }[] = [
  { label: 'Tudo', value: 'all' },
  { label: 'Pontuais', value: 'once' },
  { label: 'Recorrentes', value: 'recurring' },
];

function formatMetric(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getDateSectionTitle(option?: QuickDateOption) {
  if (!option) return 'Todos os lembretes';
  if (option?.label === 'Hoje') return 'Lembretes de hoje';
  if (option?.label === 'Amanha') return 'Lembretes de amanha';

  return `Lembretes de ${option?.weekdayLabel ?? 'dia'}`;
}

type AllDateCardProps = {
  onPress: () => void;
  selected: boolean;
};

function AllDateCard({ onPress, selected }: AllDateCardProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Mostrar todos os lembretes"
      className="mr-3 h-[78px] w-[72px] items-center justify-center rounded-2xl"
      style={[
        selected ? undefined : surfaceShadow,
        { backgroundColor: selected ? theme.colors.accent : theme.colors.card },
      ]}>
      <Text
        style={[homeFonts.medium, { color: selected ? '#FFFFFFCC' : theme.colors.textMuted }]}
        className="text-[11px]">
        Ver
      </Text>
      <Text
        style={[homeFonts.black, { color: selected ? '#FFFFFF' : theme.colors.text }]}
        className="mt-1 text-[16px]">
        Todos
      </Text>
      <Text
        style={[homeFonts.medium, { color: selected ? '#FFFFFFBF' : theme.colors.textSoft }]}
        className="mt-0.5 text-[11px]">
        geral
      </Text>
    </Pressable>
  );
}

type DateOptionCardProps = {
  onPress: () => void;
  option: QuickDateOption;
  selected: boolean;
};

function DateOptionCard({ onPress, option, selected }: DateOptionCardProps) {
  const theme = useAppTheme();
  const [day] = option.value.split('/');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.accessibilityLabel}
      className="mr-3 h-[78px] w-[58px] items-center justify-center rounded-2xl"
      style={[
        selected ? undefined : surfaceShadow,
        { backgroundColor: selected ? theme.colors.accent : theme.colors.card },
      ]}>
      <Text
        style={[homeFonts.medium, { color: selected ? '#FFFFFFCC' : theme.colors.textMuted }]}
        className="text-[11px]">
        {option.label}
      </Text>
      <Text
        style={[homeFonts.black, { color: selected ? '#FFFFFF' : theme.colors.text }]}
        className="mt-1 text-[18px]">
        {day}
      </Text>
      <Text
        style={[homeFonts.medium, { color: selected ? '#FFFFFFBF' : theme.colors.textSoft }]}
        className="mt-0.5 text-[11px]">
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
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}`}
      className="mr-3 h-10 min-w-[86px] items-center justify-center rounded-xl px-4"
      style={{ backgroundColor: selected ? theme.colors.accent : theme.colors.accentMuted }}>
      <Text
        style={[homeFonts.bold, { color: selected ? '#FFFFFF' : theme.colors.accent }]}
        className="text-[12px]">
        {label}
      </Text>
    </Pressable>
  );
}

type AgendaSummaryProps = {
  isFetching: boolean;
  totalPendingConfirmations: number;
  totalReminders: number;
};

function formatPendingConfirmationLabel(total: number) {
  return `${formatMetric(total)} ${total === 1 ? 'lembrete' : 'lembretes'} aguardando confirmacao no WhatsApp`;
}

function AgendaSummary({
  isFetching,
  totalPendingConfirmations,
  totalReminders,
}: AgendaSummaryProps) {
  const theme = useAppTheme();

  return (
    <View
      className="mt-6 rounded-2xl px-4 py-3"
      style={[surfaceShadow, { backgroundColor: theme.colors.card }]}>
      <Text style={[homeFonts.bold, { color: theme.colors.text }]} className="text-[13px]">
        {formatMetric(totalReminders)} lembretes ativos
      </Text>
      <Text
        style={[homeFonts.medium, { color: theme.colors.textSoft }]}
        className="mt-1 text-[12px]">
        {isFetching
          ? 'Atualizando dados do WhatsApp...'
          : formatPendingConfirmationLabel(totalPendingConfirmations)}
      </Text>
    </View>
  );
}

export default function Home() {
  const theme = useAppTheme();
  const user = auth.currentUser;
  const [userName, setUserName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const queryClient = useQueryClient();
  const { pendingActions, confirmPending, cancelPending, isConfirming, isCanceling } =
    usePendingActions();
  const pendingAction = pendingActions[0] ?? null;
  const dateOptions = useMemo(() => getQuickDateOptions(), []);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    () => getQuickDateOptions()[0]?.inputDate
  );
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
  const totalPendingConfirmations = data?.total_aguardando_confirmacao ?? 0;
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
      <LinearGradient colors={theme.gradient} locations={[0, 0.35, 0.72, 1]} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </LinearGradient>
    );
  }

  if (!user) return null;

  return (
    <LinearGradient colors={theme.gradient} locations={[0, 0.35, 0.72, 1]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar backgroundColor={theme.colors.statusBar} barStyle={theme.statusBarStyle} />

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
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.colors.secondary }}>
              <Text style={homeFonts.black} className="text-[18px] text-white">
                {avatarLetter}
              </Text>
            </View>

            <View className="items-center">
              <Text
                style={[homeFonts.black, { color: theme.colors.text }]}
                className="text-[20px] leading-6">
                Meus lembretes
              </Text>
              <Text
                style={[homeFonts.medium, { color: theme.colors.textSoft }]}
                className="mt-1 text-[12px]">
                {displayName}
              </Text>
            </View>

            <Pressable
              style={[surfaceShadow, { backgroundColor: theme.colors.card }]}
              className="relative h-11 w-11 items-center justify-center rounded-2xl"
              accessibilityRole="button"
              accessibilityLabel="Notificacoes">
              <NotificationBellIcon size={24} color={theme.colors.text} />
              {hasAlert ? (
                <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#6135E8]" />
              ) : null}
            </Pressable>
          </View>

          <View className="mt-8">
            <Text
              style={[homeFonts.bold, { color: theme.colors.textMuted }]}
              className="text-[13px]">
              Escolha o dia
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 mt-3"
            contentContainerClassName="px-6">
            <AllDateCard selected={!selectedDate} onPress={() => setSelectedDate(undefined)} />
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
            totalPendingConfirmations={totalPendingConfirmations}
            totalReminders={totalReminders}
          />

          <View className="mt-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={[homeFonts.black, { color: theme.colors.text }]} className="text-[19px]">
                {getDateSectionTitle(selectedDateOption)}
              </Text>
              <Text
                style={[homeFonts.bold, { color: theme.colors.textSoft }]}
                className="text-[12px]">
                Toque para editar
              </Text>
            </View>
            <ListaComandos
              filter={selectedFilter}
              selectedDate={selectedDate}
              emptyTitle={selectedDate ? 'Nenhum lembrete neste dia' : 'Nenhum lembrete cadastrado'}
              emptyDescription={
                selectedDate
                  ? 'Escolha outra data ou crie um novo lembrete.'
                  : 'Crie seu primeiro lembrete para receber no WhatsApp.'
              }
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
