import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { auth } from '@/config/firebase';
import { AcaoModal } from '@/modais/acaoModal';
import { api } from '@/services/api';
import {
  removeReminderFromCache,
  restoreReminderCacheSnapshot,
  updateReminderInCache,
  type ReminderCacheItem,
} from '@/services/reminderCache';
import {
  APP_DATA_REFETCH_INTERVAL_MS,
  refreshReminderAppData,
  reminderQueryKey,
} from '@/services/reminderQueries';
import {
  buildReminderUpdatePayload,
  formatReminderSchedule,
  isoDateToInputDate,
  normalizeReminderType,
  type ReminderRepeatType,
} from '@/services/reminderEdit';
import { buscarTelefoneFirebase } from '@/utils/buscarTelefoneFirebase';

type LembretesProps = ReminderCacheItem & {
  type?: string;
  date?: string;
  time?: string;
  weekday?: number;
  interval_value?: number;
  interval_unit?: string;
  created_at: any;
};

type AtualizarLembreteParams = {
  id: number | string;
  date?: string;
  message: string;
  repeatType: ReminderRepeatType;
  time: string;
  weekday?: number;
};

async function buscarLembretes() {
  const numero = await buscarTelefoneFirebase();

  const response = await api.get('/api/lembretes', {
    params: {
      numero,
    },
  });

  return response.data
    .slice()
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

async function removerLembrete(id: number | string) {
  const numero = await buscarTelefoneFirebase();

  await api.delete(`/api/lembretes/${id}`, {
    params: { numero },
  });
}

async function atualizarLembrete({
  id,
  date,
  message,
  repeatType,
  time,
  weekday,
}: AtualizarLembreteParams) {
  const numero = await buscarTelefoneFirebase();

  if (!numero) {
    throw new Error('Telefone nao encontrado');
  }

  await api.put(
    `/api/lembretes/${id}`,
    buildReminderUpdatePayload({
      numero,
      date,
      message,
      repeatType,
      time,
      weekday,
    })
  );
}

function ListaComandosComponent() {
  const [selectedItem, setSelectedItem] = useState<LembretesProps | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const user = auth.currentUser;
  const remindersKey = reminderQueryKey(user?.uid);

  const {
    data: lembretes = [],
    isLoading,
    isError,
  } = useQuery<LembretesProps[]>({
    queryKey: remindersKey,
    queryFn: buscarLembretes,
    enabled: !!user?.uid,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: APP_DATA_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  function abrirLembrete(item: LembretesProps) {
    setSelectedItem(item);
    setModalVisible(true);
  }

  const deleteMutation = useMutation({
    mutationFn: removerLembrete,
    onMutate: async (idRemovido) => {
      await queryClient.cancelQueries({ queryKey: remindersKey });
      const previousReminders = queryClient.getQueryData<LembretesProps[]>(remindersKey);

      queryClient.setQueryData<LembretesProps[]>(remindersKey, (old = []) =>
        removeReminderFromCache(old, idRemovido)
      );

      return { previousReminders };
    },
    onError: (_error, _idRemovido, context) => {
      queryClient.setQueryData<LembretesProps[]>(remindersKey, (old = []) =>
        restoreReminderCacheSnapshot(old, context?.previousReminders)
      );
    },
    onSuccess: async () => {
      await refreshReminderAppData(queryClient, user?.uid);
    },
  });

  const updateMutation = useMutation({
    mutationFn: atualizarLembrete,
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: remindersKey });
      const previousReminders = queryClient.getQueryData<LembretesProps[]>(remindersKey);

      queryClient.setQueryData<LembretesProps[]>(remindersKey, (old = []) =>
        updateReminderInCache(old, update)
      );

      return { previousReminders };
    },
    onError: (_error, _update, context) => {
      queryClient.setQueryData<LembretesProps[]>(remindersKey, (old = []) =>
        restoreReminderCacheSnapshot(old, context?.previousReminders)
      );
    },
    onSuccess: async () => {
      await refreshReminderAppData(queryClient, user?.uid);
    },
  });

  const fecharLembrete = useCallback(() => {
    setModalVisible(false);

    setTimeout(() => {
      setSelectedItem(null);
    }, 300);
  }, []);

  const deletarLembrete = useCallback(async () => {
    if (!selectedItem) return;

    try {
      await deleteMutation.mutateAsync(selectedItem.id);

      fecharLembrete();

      Toast.show({
        type: 'success',
        text1: 'Lembrete removido',
        position: 'bottom',
        bottomOffset: 140,
      });
    } catch (error) {
      console.log('Erro ao deletar lembrete:', error);

      Toast.show({
        type: 'error',
        text1: 'Erro ao remover lembrete',
        position: 'bottom',
        bottomOffset: 80,
      });
    }
  }, [selectedItem, fecharLembrete, deleteMutation]);

  const editarLembrete = useCallback(
    async ({
      date,
      message,
      repeatType,
      time,
      weekday,
    }: {
      date?: string;
      message: string;
      repeatType: ReminderRepeatType;
      time: string;
      weekday?: number;
    }) => {
      if (!selectedItem) {
        throw new Error('Lembrete nao selecionado');
      }

      try {
        await updateMutation.mutateAsync({
          id: selectedItem.id,
          date,
          message,
          repeatType,
          time,
          weekday,
        });

        Toast.show({
          type: 'success',
          text1: 'Lembrete atualizado',
          text2: 'As alteracoes foram salvas.',
          position: 'bottom',
          bottomOffset: 140,
        });

        fecharLembrete();
      } catch (error) {
        console.log('Erro ao editar lembrete:', error);

        Toast.show({
          type: 'error',
          text1: 'Nao foi possivel salvar',
          text2: 'Tente novamente em instantes.',
          position: 'bottom',
          bottomOffset: 80,
        });

        throw error;
      }
    },
    [fecharLembrete, selectedItem, updateMutation]
  );

  const selectedRepeatType = normalizeReminderType(selectedItem?.type);
  const dataLembreteFormatada = selectedItem?.date
    ? isoDateToInputDate(selectedItem.date)
    : 'Data nao definida';

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator size="small" color="#128C7E" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-7">
        <Text className="text-sm font-semibold text-red-700">Erro ao carregar lembretes</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {!lembretes.length ? (
        <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7">
          <Text className="text-sm font-semibold text-slate-700">Nenhum lembrete cadastrado</Text>
          <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
            Toque em Novo para criar seu primeiro aviso no WhatsApp.
          </Text>
        </View>
      ) : (
        lembretes.map((item) => (
          <Pressable
            key={item.id}
            className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 p-4"
            onPress={() => abrirLembrete(item)}>
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
              <Bot size={20} color="#128C7E" />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-3 text-base font-bold text-slate-900" numberOfLines={1}>
                  {item.message}
                </Text>

                <View className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Ativo
                  </Text>
                </View>
              </View>

              <Text className="mt-1 text-sm text-slate-500" numberOfLines={1}>
                {formatReminderSchedule(item)}
              </Text>
            </View>

            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        ))
      )}

      <AcaoModal
        visible={modalVisible}
        onClose={fecharLembrete}
        onDelete={deletarLembrete}
        message={selectedItem?.message?.trim() || 'Sem descricao'}
        time={selectedItem?.time?.trim() || 'Horario nao definido'}
        date={selectedItem?.date}
        dataFormatada={dataLembreteFormatada}
        repeatType={selectedRepeatType}
        weekday={selectedItem?.weekday}
        isUpdating={updateMutation.isPending}
        onUpdate={editarLembrete}
      />
    </View>
  );
}

export const ListaComandos = React.memo(ListaComandosComponent);
