import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Atmosphere } from '@/components/ui/Atmosphere';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { api } from '@/services/api';
import { buscarTelefoneFirebase } from '@/utils/buscarTelefoneFirebase';

type CriarLembreteParams = {
    horaTexto: string;
    textComando: string;
};

const HORARIOS_RAPIDOS = ['08:00', '12:00', '18:00', '21:00'];

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
    const numero = await buscarTelefoneFirebase();

    await api.post('/api/lembrete', {
        numero,
        mensagem: `lembrar ${horaTexto} ${textComando.trim()}`,
    });
}

export default function CriarComando() {
    const [fontsLoaded] = useFonts({
        SofiaProBold: require('../assets/fonts/SofiaProBold.otf'),
        SofiaProRegular: require('../assets/fonts/SofiaProRegular.otf'),
    });
    const [textComando, setTextComando] = useState('');
    const [horaTexto, setHoraTexto] = useState('');
    const [campoFocado, setCampoFocado] = useState<'comando' | 'hora' | null>(null);

    const createMutation = useMutation({
        mutationFn: criarLembreteApi,
        onSuccess: () => {

            router.back();

            Toast.show({
                type: 'success',
                text1: 'Lembrete criado',
                text2: 'Seu lembrete foi salvo com sucesso.',
                position: 'bottom',
                bottomOffset: 140,
            });
        },
        onError: () => {
            Toast.show({
                type: 'error',
                text1: 'Nao foi possivel salvar',
                text2: 'Tente novamente em instantes.',
                position: 'bottom',
                bottomOffset: 140,
            });
        },
    });

    const comandoPreenchido = textComando.trim();
    const horaInvalida = horaTexto.length === 5 && !horaValida(horaTexto);
    const podeEnviar =
        comandoPreenchido.length > 0 &&
        horaValida(horaTexto) &&
        !createMutation.isPending;

    async function criarLembrete() {
        if (!podeEnviar) return;

        await createMutation.mutateAsync({
            horaTexto,
            textComando,
        });
    }

    function selecionarHorarioRapido(horario: string) {
        setHoraTexto(horario);
    }

    if (!fontsLoaded) {
        return (
            <View className="flex-1 items-center justify-center bg-[#EAF7F1]">
                <ActivityIndicator size="large" color="#128C7E" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#EAF7F1]" edges={['top']}>
            <StatusBar backgroundColor="#EAF7F1" barStyle="dark-content" />

            <KeyboardAwareScrollView
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={80}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    paddingBottom: 48,
                }}
            >
                <Atmosphere className="w-full max-w-[440px] self-center">
                    <View className="overflow-hidden rounded-[32px] border border-[#D8E8E1] bg-white px-5 py-5">
                        <View className="flex-row items-center justify-between">
                            <Pressable
                                onPress={() => router.back()}
                                accessibilityRole="button"
                                accessibilityLabel="Voltar para a tela anterior"
                                className="h-12 w-12 items-center justify-center rounded-2xl border border-[#DCEAE5] bg-[#F3FBF7]"
                            >
                                <Ionicons name="chevron-back" size={20} color="#0f172a" />
                            </Pressable>

                            <View className="rounded-full border border-[#D8E8E1] bg-[#F8FCFA] px-3 py-1.5">
                                <Text
                                    style={{ fontFamily: 'SofiaProBold' }}
                                    className="text-[10px] uppercase tracking-[0.16em] text-[#4B675E]"
                                >
                                    novo lembrete
                                </Text>
                            </View>
                        </View>

                        <View className="mt-5">
                            <Eyebrow>automacao</Eyebrow>

                            <Text
                                style={{ fontFamily: 'SofiaProBold' }}
                                className="mt-3 text-[32px] leading-9 text-slate-900"
                            >
                                Criar lembrete
                            </Text>

                            <Text
                                style={{ fontFamily: 'SofiaProRegular' }}
                                className="mt-3 text-[15px] leading-6 text-slate-500"
                            >
                                Defina o que lembrar e escolha o melhor horario.
                            </Text>
                        </View>
                    </View>

                    <SurfaceCard className="mt-5 border-[#D8E8E1] px-0 py-0">
                        <View className="px-5 pb-5 pt-5">
                            <View className="rounded-[26px] border border-[#E7F0EB] bg-[#FCFDFC] p-4">
                                <View className="flex-row items-center">
                                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F1FAF6]">
                                        <Ionicons
                                            name="chatbox-ellipses-outline"
                                            size={18}
                                            color="#128C7E"
                                        />
                                    </View>

                                    <View className="ml-3 flex-1">
                                        <Text
                                            style={{ fontFamily: 'SofiaProBold' }}
                                            className="text-base text-slate-900"
                                        >
                                            O que lembrar
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    className={`mt-4 rounded-[24px] border px-4 py-1 ${campoFocado === 'comando'
                                        ? 'border-emerald-500 bg-white'
                                        : 'border-[#E2ECE7] bg-white'
                                        }`}
                                >
                                    <TextInput
                                        placeholder="Ex.: beber agua"
                                        placeholderTextColor="#94a3b8"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={textComando}
                                        onChangeText={setTextComando}
                                        onFocus={() => setCampoFocado('comando')}
                                        onBlur={() =>
                                            setCampoFocado((valorAtual) =>
                                                valorAtual === 'comando' ? null : valorAtual,
                                            )
                                        }
                                        style={{ fontFamily: 'SofiaProRegular' }}
                                        className="py-3.5 text-[15px] text-slate-900"
                                    />
                                </View>
                            </View>

                            <View className="mt-4 rounded-[26px] border border-[#E7F0EB] bg-[#FCFDFC] p-4">
                                <View className="flex-row items-center">
                                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F1FAF6]">
                                        <Ionicons name="alarm-outline" size={18} color="#128C7E" />
                                    </View>

                                    <View className="ml-3 flex-1">
                                        <Text
                                            style={{ fontFamily: 'SofiaProBold' }}
                                            className="text-base text-slate-900"
                                        >
                                            Horario do lembrete
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    className={`mt-4 flex-row items-center rounded-[24px] border px-4 ${horaInvalida
                                        ? 'border-red-400 bg-red-50'
                                        : campoFocado === 'hora'
                                            ? 'border-emerald-500 bg-white'
                                            : 'border-[#E2ECE7] bg-white'
                                        }`}
                                >
                                    <Ionicons
                                        name="time-outline"
                                        size={18}
                                        color={horaInvalida ? '#ef4444' : '#128C7E'}
                                    />

                                    <TextInput
                                        placeholder="00:00"
                                        placeholderTextColor="#94a3b8"
                                        value={horaTexto}
                                        onChangeText={(text) => setHoraTexto(aplicarMascaraHora(text))}
                                        onFocus={() => setCampoFocado('hora')}
                                        onBlur={() =>
                                            setCampoFocado((valorAtual) =>
                                                valorAtual === 'hora' ? null : valorAtual,
                                            )
                                        }
                                        keyboardType="numeric"
                                        maxLength={5}
                                        style={{ fontFamily: 'SofiaProRegular' }}
                                        className="ml-2 flex-1 py-3.5 text-[15px] text-slate-900"
                                    />
                                </View>

                                <View className="mt-4 flex-row flex-wrap">
                                    {HORARIOS_RAPIDOS.map((horario) => {
                                        const selecionado = horaTexto === horario;

                                        return (
                                            <Pressable
                                                key={horario}
                                                onPress={() => selecionarHorarioRapido(horario)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Selecionar horario ${horario}`}
                                                className={`mr-2 mt-2 rounded-full border px-4 py-2.5 ${selecionado
                                                    ? 'border-emerald-200 bg-emerald-50'
                                                    : 'border-[#E2ECE7] bg-white'
                                                    }`}
                                            >
                                                <Text
                                                    style={{ fontFamily: 'SofiaProBold' }}
                                                    className={`text-base ${selecionado
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-700'
                                                        }`}
                                                >
                                                    {horario}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text
                                    style={{ fontFamily: 'SofiaProRegular' }}
                                    className="mt-3 text-xs text-slate-500"
                                >
                                    Escolha um horario sugerido para preencher mais rapido.
                                </Text>

                                {horaInvalida ? (
                                    <Text
                                        style={{ fontFamily: 'SofiaProBold' }}
                                        className="mt-3 text-xs text-red-500"
                                    >
                                        Digite um horario valido entre 00:00 e 23:59.
                                    </Text>
                                ) : null}
                            </View>

                            <TouchableOpacity
                                onPress={criarLembrete}
                                activeOpacity={0.9}
                                disabled={!podeEnviar}
                                accessibilityRole="button"
                                accessibilityLabel="Salvar lembrete"
                                className={`mt-5 items-center rounded-[22px] py-4 ${podeEnviar ? 'bg-[#128C7E]' : 'bg-slate-200'
                                    }`}
                            >
                                <Text
                                    style={{ fontFamily: 'SofiaProBold' }}
                                    className={`text-base ${podeEnviar ? 'text-white' : 'text-slate-500'
                                        }`}
                                >
                                    {createMutation.isPending ? 'Salvando...' : 'Criar lembrete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </SurfaceCard>
                </Atmosphere>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
