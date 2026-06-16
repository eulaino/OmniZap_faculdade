import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

type BotHealthBannerProps = {
  checkedAt?: string;
  isChecking: boolean;
  onTestConnection: () => void;
};

function formatCheckedAt(checkedAt?: string) {
  if (!checkedAt) return 'agora';

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(checkedAt).getTime()) / 1000));

  if (!Number.isFinite(seconds) || seconds < 5) return 'agora';
  if (seconds < 60) return `ha ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  return `ha ${minutes}min`;
}

export function BotHealthBanner({ checkedAt, isChecking, onTestConnection }: BotHealthBannerProps) {
  return (
    <View className="border-b border-red-200 bg-red-50 px-4 py-3">
      <View className="flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-red-200 bg-white">
          <AlertTriangle size={18} color="#dc2626" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black text-red-800">Bot offline</Text>
          <Text className="mt-0.5 text-xs font-medium leading-5 text-red-700">
            Tentando reconectar. Ultima checagem {formatCheckedAt(checkedAt)}.
          </Text>
        </View>

        <Pressable
          onPress={onTestConnection}
          disabled={isChecking}
          accessibilityRole="button"
          accessibilityLabel="Testar conexao do bot"
          accessibilityState={{ disabled: isChecking, busy: isChecking }}
          className={`ml-3 h-10 flex-row items-center justify-center rounded-2xl px-3 ${
            isChecking ? 'bg-red-200' : 'bg-red-600'
          }`}>
          {isChecking ? (
            <ActivityIndicator size="small" color="#991b1b" />
          ) : (
            <RefreshCw size={15} color="#ffffff" />
          )}

          <Text
            className={`ml-1.5 text-xs font-black ${isChecking ? 'text-red-900' : 'text-white'}`}>
            Testar conexao
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
