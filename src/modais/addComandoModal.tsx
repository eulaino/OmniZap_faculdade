import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { api } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { auth } from '@/config/firebase';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { dashboardQueryKey, reminderQueryKey } from '@/services/reminderQueries';


export type CommandModalProps = {
    visible: boolean;
    onClose: () => void;
};

type CriarLembreteParams = {
    horaTexto: string;
    textComando: string;
}

function aplicarMascaraHora(texto: string) {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    return `${numeros.slice(0, 2)}:${numeros.slice(2, 4)}`;
}

function horaValida(texto: string) {
    if (texto.length < 5) return false;
    const [hh, mm] = texto.split(':').map(Number);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

async function criarLembreteApi({ horaTexto, textComando }: CriarLembreteParams) {
    const numero = await AsyncStorage.getItem('user_phone');
    await api.post('/api/lembrete', {
        numero,
        mensagem: `lembrar ${horaTexto} ${textComando.trim()}`,
    });
}

function CommandModalComponent({ visible, onClose }: CommandModalProps) {
    const [textComando, setTextComando] = useState('');
    const [horaTexto, setHoraTexto] = useState('');
    const [focused, setFocused] = useState(false);
    const queryClient = useQueryClient();

    const user = auth.currentUser;

    const createMutation = useMutation({
        mutationFn: criarLembreteApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reminderQueryKey(user?.uid) });
            queryClient.invalidateQueries({ queryKey: dashboardQueryKey(user?.uid) });

            onClose();

            Toast.show({
                type: 'success',
                text1: 'Comando criado...',
                position: 'bottom',
                bottomOffset: 140,
            });
        },

        onError: () => {
            Toast.show({
                type: 'error',
                text1: 'Erro ao criar lembrete',
                text2: 'Tente novamente em alguns segundos.',
                position: 'bottom',
                bottomOffset: 140,
            });
        }
    })

    async function criarLembrete() {
        if (!podeEnviar) return;
        await createMutation.mutateAsync({
            horaTexto,
            textComando,
        })

    }

    useEffect(() => {
        if (!visible) {
            setTextComando('');
            setHoraTexto('');
            setFocused(false);
        }
    }, [visible]);

    const horaInvalida = horaTexto.length === 5 && !horaValida(horaTexto);
    const podeEnviar = textComando.trim().length > 0 && horaValida(horaTexto) && !createMutation.isPending;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAwareScrollView
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={80}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 24,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                }}
            >
                <Pressable className="absolute inset-0" onPress={onClose} />

                <View className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm">
                    <View className="border-b border-slate-200 px-5 pb-4 pt-5">
                        <View className="flex-row items-start justify-between">
                            <View className="mr-3 flex-1 flex-row items-center">
                                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                                    <Ionicons name="flash-outline" size={22} color="#128C7E" />
                                </View>

                                <View className="flex-1">
                                    <Text style={{ fontFamily: 'SofiaProBold' }} className="text-lg text-slate-900">
                                        Criar lembrete
                                    </Text>
                                    <Text style={{ fontFamily: 'SofiaProRegular' }} className="mt-1 text-xs text-slate-500">
                                        Cadastre um comando com horário.
                                    </Text>
                                </View>
                            </View>

                            <Pressable
                                onPress={onClose}
                                hitSlop={8}
                                className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white"
                            >
                                <Ionicons name="close" size={18} color="#475569" />
                            </Pressable>
                        </View>
                    </View>

                    <View className="gap-4 px-5 py-5">
                        <View className="rounded-2xl border border-slate-200 bg-white p-4">
                            <Text style={{ fontFamily: 'SofiaProRegular' }} className="mb-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                                Comando
                            </Text>

                            <TextInput
                                placeholder="Ex.: tomar café"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={textComando}
                                onChangeText={setTextComando}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900"
                            />
                        </View>

                        <View className="rounded-2xl border border-slate-200 bg-white p-4">
                            <Text style={{ fontFamily: 'SofiaProRegular' }} className="mb-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                                Horário
                            </Text>

                            <View
                                className={`flex-row items-center rounded-2xl border px-4 ${horaInvalida
                                    ? 'border-red-400 bg-red-50'
                                    : focused
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-200 bg-slate-50'
                                    }`}
                            >
                                <Ionicons name="time-outline" size={18} color="#128C7E" />

                                <TextInput
                                    placeholder="00:00"
                                    placeholderTextColor="#94a3b8"
                                    value={horaTexto}
                                    onChangeText={(text) => setHoraTexto(aplicarMascaraHora(text))}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    className="ml-2 flex-1 py-3.5 text-slate-900"
                                />
                            </View>

                            {horaInvalida ? (
                                <Text className="mt-2 text-xs font-semibold text-red-500">
                                    Horário inválido.
                                </Text>
                            ) : null}
                        </View>

                        <TouchableOpacity
                            onPress={criarLembrete}
                            activeOpacity={0.85}
                            disabled={!podeEnviar}
                            className={`mt-1 items-center rounded-2xl py-4 ${podeEnviar ? 'bg-[#128C7E]' : 'bg-slate-200'
                                }`}
                        >
                            <Text style={{ fontFamily: 'SofiaProBold' }} className="text-base text-white">
                                {createMutation.isPending ? 'Salvando...' : 'Salvar lembrete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </Modal>
    );
}

export const CommandModal = React.memo(CommandModalComponent);
