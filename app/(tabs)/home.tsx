import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebase';
import { useFonts } from 'expo-font';
import { HeaderListComando } from '@/components/HeaderListComando';
import { ListaComandos } from '@/components/ListaLembretes';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';
import { PendingActionModal } from '@/components/PendingActionModal';
import { Atmosphere } from '@/components/ui/Atmosphere';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/useDashboard';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useFocusEffect } from 'expo-router';
import { useBotHealth } from '@/hooks/useBotHealth';
import { BotHealthBanner } from '@/components/BotHealthBanner';
import Toast from 'react-native-toast-message';
import { dashboardQueryKey, pendingActionsQueryKey } from '@/services/reminderQueries';

export default function Home() {
  const [fontsLoaded] = useFonts({
    SofiaProBold: require('../../assets/fonts/SofiaProBold.otf'),
    SofiaProRegular: require('../../assets/fonts/SofiaProRegular.otf'),
  });

  const user = auth.currentUser;
  const [userName, setUserName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const queryClient = useQueryClient();
  const { pendingActions, confirmPending, cancelPending, isConfirming, isCanceling } =
    usePendingActions();
  const pendingAction = pendingActions[0] ?? null;

  const descriptionText = userName
    ? `${userName}, acompanhe seus indicadores e mantenha os comandos organizados.`
    : 'Acompanhe seus indicadores e mantenha os comandos organizados.';

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

  const statusServer = botOffline
    ? 'Bot offline'
    : isCheckingBotHealth
      ? 'Verificando bot'
      : isError
        ? 'API instavel'
        : 'Bot conectado';
  const statusBg = isError
    ? 'bg-red-500'
    : botOffline
      ? 'bg-red-500'
      : isCheckingBotHealth || isDashboardFetching
        ? 'bg-slate-500'
        : 'bg-green-500';

  /*   const atualizarLista = useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, []); */

  if (!fontsLoaded || loadingName || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EAF7F1]">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#EAF7F1]" edges={['top']}>
      <StatusBar backgroundColor="#EAF7F1" barStyle="dark-content" />
      <Header status={statusServer} statusBg={statusBg} />
      {botOffline ? (
        <BotHealthBanner
          checkedAt={botHealth?.checkedAt}
          isChecking={isCheckingBotHealth}
          onTestConnection={handleTestBotConnection}
        />
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-5"
        showsVerticalScrollIndicator={false}>
        <Atmosphere>
          <SurfaceCard>
            <Eyebrow>painel diario</Eyebrow>

            <Text className="mt-2 text-3xl font-black leading-9 text-slate-900">
              Controle da sua operacao
            </Text>

            <Text className="mt-2 text-sm leading-5 text-slate-500">{descriptionText}</Text>

            <Dashboard
              totalComandos={data?.total_comandos ?? 0}
              totalAtendimentos={data?.total_atendimentos ?? 0}
            />
          </SurfaceCard>

          <SurfaceCard className="mt-4">
            <Eyebrow className="mb-3">automacao</Eyebrow>

            <HeaderListComando />
            <ListaComandos />
          </SurfaceCard>
        </Atmosphere>
      </ScrollView>
      {/* <CommandModal
        visible={modalVisible}
        onClose={handleCloseModal}
      /> */}
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
  );
}
