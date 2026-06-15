import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { BellRing, CheckCircle2, Clock3, X } from 'lucide-react-native';

import type { PendingAction } from '@/hooks/usePendingActions';

type PendingActionModalProps = {
  visible: boolean;
  action: PendingAction | null;
  isConfirming: boolean;
  isCanceling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function formatarData(data?: string) {
  if (!data) return 'Data nao definida';

  const [ano, mes, dia] = data.split('-');
  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

export function PendingActionModal({
  visible,
  action,
  isConfirming,
  isCanceling,
  onConfirm,
  onCancel,
}: PendingActionModalProps) {
  const busy = isConfirming || isCanceling;
  const payload = action?.payload;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={busy ? undefined : onCancel}
    >
      <View className="flex-1 justify-end bg-black/45 px-4 pb-6">
        <View className="overflow-hidden rounded-[32px] border border-[#BFE7D8] bg-white">
          <View className="bg-[#0F7A6D] px-5 pb-5 pt-6">
            <View className="flex-row items-center justify-between">
              <View className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                  confirmacao do bot
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <BellRing size={20} color="#ECFDF5" />
              </View>
            </View>

            <Text className="mt-5 text-[28px] font-black leading-8 text-white">
              Voce quis criar este lembrete?
            </Text>

            <Text className="mt-2 text-sm leading-5 text-emerald-50">
              O bot entendeu quase tudo, mas precisa da sua confirmacao antes de salvar.
            </Text>
          </View>

          <View className="px-5 py-5">
            <View className="rounded-[26px] border border-[#DCEAE5] bg-[#F8FCFA] p-4">
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                  <Clock3 size={20} color="#128C7E" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold uppercase tracking-[0.14em] text-[#4B675E]">
                    horario detectado
                  </Text>

                  <Text className="mt-1 text-base font-black text-slate-900">
                    {formatarData(payload?.date)} as {payload?.time ?? '--:--'}
                  </Text>
                </View>
              </View>

              <View className="mt-4 rounded-[22px] border border-emerald-100 bg-white px-4 py-3">
                <Text className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  mensagem
                </Text>

                <Text className="mt-1 text-base font-bold leading-6 text-slate-900">
                  {payload?.message ?? 'Sem mensagem'}
                </Text>
              </View>
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                disabled={busy}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancelar pendencia"
                className={`flex-1 flex-row items-center justify-center rounded-[22px] border px-4 py-4 ${
                  busy ? 'border-slate-200 bg-slate-100' : 'border-slate-200 bg-white'
                }`}
              >
                {isCanceling ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <>
                    <X size={18} color="#64748b" />
                    <Text className="ml-2 text-sm font-black text-slate-600">Cancelar</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Confirmar lembrete"
                className={`flex-1 flex-row items-center justify-center rounded-[22px] px-4 py-4 ${
                  busy ? 'bg-emerald-300' : 'bg-[#128C7E]'
                }`}
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text className="ml-2 text-sm font-black text-white">Confirmar</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
