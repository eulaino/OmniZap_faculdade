import React from 'react';
import { MessageSquare, Users } from 'lucide-react-native';
import { View, Text } from 'react-native';

type DashboardProps = {
  totalComandos: number;
  totalAtendimentos: number;
};

function formatMetric(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function DashboardComponent({ totalComandos, totalAtendimentos }: DashboardProps) {
  return (
    <View className="mt-5 flex-row gap-3">
      <View className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <Users size={20} color="#128C7E" />
        </View>

        <Text className="mt-3 text-2xl font-black text-slate-900">
          {formatMetric(totalAtendimentos)}
        </Text>

        <Text className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Atendimentos
        </Text>
      </View>

      <View className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50">
          <MessageSquare size={20} color="#0284C7" />
        </View>

        <Text className="mt-3 text-2xl font-black text-slate-900">
          {formatMetric(totalComandos)}
        </Text>

        <Text className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Lembretes
        </Text>
      </View>
    </View>
  );
}

export const Dashboard = React.memo(DashboardComponent);