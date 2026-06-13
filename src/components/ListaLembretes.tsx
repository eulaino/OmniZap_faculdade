import React, { useCallback, useState } from 'react';
import { api } from '@/services/api';
import { TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import {
  Bot,
  ChevronRight,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AcaoModal } from '@/modais/acaoModal';
import { buscarTelefoneFirebase } from '@/utils/buscarTelefoneFirebase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/config/firebase';


type LembretesProps = {
  id: number | string;
  message: string;
  date: string;
  time?: string;
  created_at: any;
};


function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}


async function buscarLembretes() {
  const numero = await buscarTelefoneFirebase();


  const response = await api.get('/api/lembretes', {
    params: {
      numero,
    },
  });


  // console.log('LEMBRETES:', response.data);
  return response.data
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

async function removerLembrete(id: number | string) {
  const numero = await buscarTelefoneFirebase();

  await api.delete(`/api/lembretes/${id}`, {
    params: { numero },
  });
}


function ListaComandosComponent() {
  /*   const [lembretes, setLembretes] = useState<LembretesProps>([]); */
  const [selectedItem, setSelectedItem] = useState<LembretesProps | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const user = auth.currentUser;

  const {
    data: lembretes = [],
    isLoading,
    isError,
  } = useQuery<LembretesProps[]>({
    queryKey: ['lembretes', user?.uid],
    queryFn: buscarLembretes,
    enabled: !!user?.uid,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,

  })

  function abrirLembrete(item: LembretesProps) {
    setSelectedItem(item);
    setModalVisible(true);
  }

  const deleteMutation = useMutation({
    mutationFn: removerLembrete,
    onSuccess: async (_, idRemovido) => {
      queryClient.setQueryData<LembretesProps[]>(
        ['lembretes', user?.uid],
        (old = []) => old.filter((item) => item.id !== idRemovido)
      );

      await queryClient.refetchQueries({
        queryKey: ['dashboard', user?.uid],
      });
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

  const dataLembreteFormatada = selectedItem?.date ? formatarData(selectedItem.date) : 'Data nao definida';

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
        <Text className="text-sm font-semibold text-red-700">
          Erro ao carregar comandos
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {!lembretes.length ? (
        <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7">
          <Text className="text-sm font-semibold text-slate-700">
            Nenhum comando cadastrado
          </Text>
          <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
            Toque em Novo para criar o primeiro gatilho.
          </Text>
        </View>
      ) : (
        lembretes.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.70}
            className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 p-4"
            onPress={() => abrirLembrete(item)}
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
              <Bot size={20} color="#128C7E" />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className="flex-1 pr-3 text-base font-bold text-slate-900"
                  numberOfLines={1}
                >
                  {item.message}
                </Text>

                <View className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Ativo
                  </Text>
                </View>
              </View>

              <Text className="mt-1 text-sm text-slate-500" numberOfLines={1}>
                {formatarData(item.date)} às {item.time}
              </Text>
            </View>

            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))
      )}

      {/* Modal de lembretes */}
      <AcaoModal
        visible={modalVisible}
        onClose={fecharLembrete}
        onDelete={deletarLembrete}
        message={selectedItem?.message?.trim() || "Sem descricao"}
        time={selectedItem?.time?.trim() || "Horario nao definido"}
        dataFormatada={dataLembreteFormatada}
      />
      {/* Fim modal de Lembretes */}
    </View>
  );
}

export const ListaComandos = React.memo(ListaComandosComponent);
