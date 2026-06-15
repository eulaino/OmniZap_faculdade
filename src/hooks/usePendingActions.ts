import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { auth } from '@/config/firebase';
import { api } from '@/services/api';
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
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
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

  return response.data;
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

export function usePendingActions() {
  const user = auth.currentUser;
  const queryClient = useQueryClient();

  const query = useQuery<PendingAction[]>({
    queryKey: ['pendencias', user?.uid],
    queryFn: buscarPendencias,
    enabled: !!user?.uid,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });

  const invalidateAppData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pendencias', user?.uid] }),
      queryClient.invalidateQueries({ queryKey: ['lembretes', user?.uid] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.uid] }),
    ]);
  };

  const confirmMutation = useMutation({
    mutationFn: confirmarPendencia,
    onSuccess: async () => {
      await invalidateAppData();

      Toast.show({
        type: 'success',
        text1: 'Lembrete confirmado',
        text2: 'Agora ele aparece na sua lista.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Nao foi possivel confirmar',
        text2: 'Tente novamente em instantes.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelarPendencia,
    onSuccess: async () => {
      await invalidateAppData();

      Toast.show({
        type: 'success',
        text1: 'Pendencia cancelada',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Nao foi possivel cancelar',
        text2: 'Tente novamente em instantes.',
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
