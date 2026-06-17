import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { auth } from '@/config/firebase';
import { api } from '@/services/api';
import {
  addReminderToCache,
  buildOptimisticReminder,
  replaceReminderInCache,
  restoreReminderCacheSnapshot,
  type ReminderCacheItem,
} from '@/services/reminderCache';
import {
  APP_DATA_REFETCH_INTERVAL_MS,
  pendingActionsQueryKey,
  refreshReminderAppData,
  reminderQueryKey,
} from '@/services/reminderQueries';
import { buscarTelefoneFirebase } from '@/utils/buscarTelefoneFirebase';

export type PendingActionPayload = {
  date: string;
  time: string;
  message: string;
};

export type PendingAction = {
  id: number;
  numero: string;
  type: 'confirm_reminder';
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  source: 'app' | 'whatsapp';
  payload: PendingActionPayload;
  created_at: string;
  expires_at: string;
};

async function buscarPendencias() {
  const numero = await buscarTelefoneFirebase();

  if (!numero) return [];

  const response = await api.get('/api/pendencias', {
    params: { numero },
  });

  return response.data
    .slice()
    .sort(
      (a: PendingAction, b: PendingAction) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

async function confirmarPendencia(id: number) {
  const numero = await buscarTelefoneFirebase();

  if (!numero) {
    throw new Error('Telefone nao encontrado');
  }

  const response = await api.post(`/api/pendencias/${id}/confirmar`, {
    numero,
  });

  return response.data as { lembrete?: ReminderCacheItem };
}

async function cancelarPendencia(id: number) {
  const numero = await buscarTelefoneFirebase();

  if (!numero) {
    throw new Error('Telefone nao encontrado');
  }

  const response = await api.post(`/api/pendencias/${id}/cancelar`, {
    numero,
  });

  return response.data;
}

function pendingActionCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function usePendingActions() {
  const user = auth.currentUser;
  const queryClient = useQueryClient();
  const pendingKey = pendingActionsQueryKey(user?.uid);
  const remindersKey = reminderQueryKey(user?.uid);

  const query = useQuery<PendingAction[]>({
    queryKey: pendingKey,
    queryFn: buscarPendencias,
    enabled: !!user?.uid,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: APP_DATA_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmarPendencia,
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: pendingKey }),
        queryClient.cancelQueries({ queryKey: remindersKey }),
      ]);

      const previousPending = queryClient.getQueryData<PendingAction[]>(pendingKey);
      const previousReminders = queryClient.getQueryData<ReminderCacheItem[]>(remindersKey);
      const pendingAction = previousPending?.find((action) => action.id === id);
      let optimisticReminderId: number | string | undefined;

      queryClient.setQueryData<PendingAction[]>(pendingKey, (old = []) =>
        old.filter((action) => action.id !== id)
      );

      if (pendingAction) {
        const optimisticReminder = buildOptimisticReminder(
          {
            date: pendingAction.payload.date,
            message: pendingAction.payload.message,
            repeatType: 'once',
            time: pendingAction.payload.time,
          },
          pendingActionCreatedAt(pendingAction.created_at)
        );
        optimisticReminderId = optimisticReminder.id;

        queryClient.setQueryData<ReminderCacheItem[]>(remindersKey, (old = []) =>
          addReminderToCache(old, optimisticReminder)
        );
      }

      return { optimisticReminderId, previousPending, previousReminders };
    },
    onError: (_error, _id, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(pendingKey, context.previousPending);
      }

      queryClient.setQueryData<ReminderCacheItem[]>(remindersKey, (old = []) =>
        restoreReminderCacheSnapshot(old, context?.previousReminders)
      );

      Toast.show({
        type: 'error',
        text1: 'Nao foi possivel confirmar',
        text2: 'Tente novamente em instantes.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
    onSuccess: async (response, _id, context) => {
      if (response.lembrete && context?.optimisticReminderId) {
        queryClient.setQueryData<ReminderCacheItem[]>(remindersKey, (old = []) =>
          replaceReminderInCache(old, context.optimisticReminderId!, response.lembrete!)
        );
      }

      await refreshReminderAppData(queryClient, user?.uid, {
        includePendingActions: true,
        includeReminders: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Lembrete confirmado',
        text2: 'Agora ele aparece na sua lista.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelarPendencia,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: pendingKey });

      const previousPending = queryClient.getQueryData<PendingAction[]>(pendingKey);

      queryClient.setQueryData<PendingAction[]>(pendingKey, (old = []) =>
        old.filter((action) => action.id !== id)
      );

      return { previousPending };
    },
    onError: (_error, _id, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(pendingKey, context.previousPending);
      }

      Toast.show({
        type: 'error',
        text1: 'Nao foi possivel cancelar',
        text2: 'Tente novamente em instantes.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
    onSuccess: async () => {
      await refreshReminderAppData(queryClient, user?.uid, {
        includeDashboard: false,
        includePendingActions: true,
        includeReminders: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Pendencia cancelada',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
  });

  return {
    pendingActions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    confirmPending: confirmMutation.mutateAsync,
    cancelPending: cancelMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    isCanceling: cancelMutation.isPending,
  };
}
