import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Atmosphere } from '@/components/ui/Atmosphere';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { api } from '@/services/api';
import { auth } from '@/config/firebase';
import {
  addReminderToCache,
  buildOptimisticReminder,
  restoreReminderCacheSnapshot,
  type ReminderCacheItem,
} from '@/services/reminderCache';
import { refreshReminderAppData, reminderQueryKey } from '@/services/reminderQueries';
import {
  WEEKDAY_OPTIONS,
  addDaysToInputDate,
  buildCalendarMonth,
  buildReminderCreatePayload,
  formatInputDateLong,
  formatReminderDateInput,
  formatReminderTimeInput,
  getCalendarMonthTitle,
  getInputDateWeekdayLabel,
  inputDateToDate,
  inputDateToIsoDate,
  isReminderDateValid,
  isReminderTimeValid,
  type ReminderRepeatType,
} from '@/services/reminderEdit';
import { buscarTelefoneFirebase } from '@/utils/buscarTelefoneFirebase';

type CriarLembreteParams = {
  dateTexto: string;
  horaTexto: string;
  repeatType: ReminderRepeatType;
  textComando: string;
  weekday: number;
};

const HORARIOS_RAPIDOS = ['08:00', '12:00', '18:00', '21:00'];
const RECURRENCE_OPTIONS: { label: string; value: ReminderRepeatType }[] = [
  { label: 'Uma vez', value: 'once' },
  { label: 'Todo dia', value: 'daily' },
  { label: 'Toda semana', value: 'weekly' },
];
const QUICK_DATE_SHORTCUTS = [
  { label: 'Hoje', days: 0 },
  { label: 'Amanha', days: 1 },
  { label: '+7 dias', days: 7 },
];

function mensagemTemHorario(texto: string) {
  return /\b(?:[01]?\d|2[0-3])(?::[0-5]\d|h(?:[0-5]\d)?)\b/i.test(texto);
}

async function criarLembreteApi({
  dateTexto,
  horaTexto,
  repeatType,
  textComando,
  weekday,
}: CriarLembreteParams) {
  const numero = await buscarTelefoneFirebase();
  const isoDate = repeatType === 'once' ? inputDateToIsoDate(dateTexto) : undefined;

  if (!numero) {
    throw new Error('Telefone nao encontrado');
  }

  if (repeatType === 'once' && !isoDate) {
    throw new Error('Data invalida');
  }

  await api.post(
    '/api/lembrete',
    buildReminderCreatePayload({
      numero,
      repeatType,
      date: isoDate ?? undefined,
      time: horaTexto,
      message: textComando,
      weekday,
    })
  );
}

export default function CriarComando() {
  const [textComando, setTextComando] = useState('');
  const [horaTexto, setHoraTexto] = useState('');
  const [dateTexto, setDateTexto] = useState(addDaysToInputDate(0));
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('once');
  const [weekday, setWeekday] = useState(0);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(inputDateToDate(dateTexto) ?? new Date());
  const [campoFocado, setCampoFocado] = useState<'comando' | 'data' | 'hora' | null>(null);
  const queryClient = useQueryClient();
  const user = auth.currentUser;
  const selectedDate = inputDateToDate(dateTexto) ?? new Date();
  const selectedWeekdayLabel = getInputDateWeekdayLabel(dateTexto);
  const selectedDateSummary = formatInputDateLong(dateTexto);
  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);
  const calendarDays = buildCalendarMonth(calendarMonth, minimumDate);
  const calendarMonthTitle = getCalendarMonthTitle(calendarMonth);

  const createMutation = useMutation({
    mutationFn: criarLembreteApi,
    onMutate: async (draft) => {
      const remindersKey = reminderQueryKey(user?.uid);

      await queryClient.cancelQueries({ queryKey: remindersKey });
      const previousReminders = queryClient.getQueryData<ReminderCacheItem[]>(remindersKey);
      const optimisticReminder = buildOptimisticReminder({
        date:
          draft.repeatType === 'once'
            ? (inputDateToIsoDate(draft.dateTexto) ?? undefined)
            : undefined,
        message: draft.textComando,
        repeatType: draft.repeatType,
        time: draft.horaTexto,
        weekday: draft.repeatType === 'weekly' ? draft.weekday : undefined,
      });

      queryClient.setQueryData<ReminderCacheItem[]>(remindersKey, (old = []) =>
        addReminderToCache(old, optimisticReminder)
      );

      return { previousReminders };
    },
    onError: (_error, _draft, context) => {
      queryClient.setQueryData<ReminderCacheItem[]>(reminderQueryKey(user?.uid), (old = []) =>
        restoreReminderCacheSnapshot(old, context?.previousReminders)
      );

      Toast.show({
        type: 'error',
        text1: 'Nao foi possivel salvar',
        text2: 'Tente novamente em instantes.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
    onSuccess: () => {
      router.back();
      void refreshReminderAppData(queryClient, user?.uid).catch((error) => {
        console.log('Erro ao atualizar lembretes apos criar:', error);
      });

      Toast.show({
        type: 'success',
        text1: 'Lembrete criado',
        text2: 'Seu lembrete foi salvo com sucesso.',
        position: 'bottom',
        bottomOffset: 140,
      });
    },
  });

  const comandoPreenchido = textComando.trim();
  const comandoComHorario = mensagemTemHorario(comandoPreenchido);
  const dataInvalida =
    repeatType === 'once' && dateTexto.length === 10 && !isReminderDateValid(dateTexto);
  const dataValida = repeatType !== 'once' || isReminderDateValid(dateTexto);
  const horaInvalida = horaTexto.length === 5 && !isReminderTimeValid(horaTexto);
  const podeEnviar =
    comandoPreenchido.length > 0 &&
    !comandoComHorario &&
    dataValida &&
    isReminderTimeValid(horaTexto) &&
    !createMutation.isPending;

  async function criarLembrete() {
    if (comandoComHorario) {
      Toast.show({
        type: 'error',
        text1: 'Horario duplicado',
        text2: 'Coloque o horario apenas no campo de horario.',
        position: 'bottom',
        bottomOffset: 140,
      });
      return;
    }

    if (!podeEnviar) return;

    await createMutation.mutateAsync({
      dateTexto,
      horaTexto,
      repeatType,
      textComando,
      weekday,
    });
  }

  function abrirCalendario() {
    setCampoFocado(null);
    setCalendarMonth(selectedDate);
    setCalendarVisible(true);
  }

  function mudarMesCalendario(delta: number) {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
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
        }}>
        <Atmosphere className="w-full max-w-[440px] self-center">
          <View className="overflow-hidden rounded-[32px] border border-[#D8E8E1] bg-white px-5 py-5">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Voltar para a tela anterior"
                className="h-12 w-12 items-center justify-center rounded-2xl border border-[#DCEAE5] bg-[#F3FBF7]">
                <Ionicons name="chevron-back" size={20} color="#0f172a" />
              </Pressable>

              <View className="rounded-full border border-[#D8E8E1] bg-[#F8FCFA] px-3 py-1.5">
                <Text
                  style={{ fontFamily: 'Inter_700Bold' }}
                  className="text-[10px] uppercase tracking-[0.16em] text-[#4B675E]">
                  novo lembrete
                </Text>
              </View>
            </View>

            <View className="mt-5">
              <Eyebrow>automacao</Eyebrow>

              <Text
                style={{ fontFamily: 'Inter_700Bold' }}
                className="mt-3 text-[32px] leading-9 text-slate-900">
                Criar lembrete
              </Text>

              <Text
                style={{ fontFamily: 'Inter_400Regular' }}
                className="mt-3 text-[15px] leading-6 text-slate-500">
                Escolha quando lembrar e o que o bot deve enviar.
              </Text>
            </View>
          </View>

          <SurfaceCard className="mt-5 border-[#D8E8E1] px-0 py-0">
            <View className="px-5 pb-5 pt-5">
              <View className="rounded-[26px] border border-[#E7F0EB] bg-[#FCFDFC] p-4">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F1FAF6]">
                    <Ionicons name="repeat-outline" size={18} color="#128C7E" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-base text-slate-900">
                      Quando lembrar
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row rounded-[22px] border border-[#E2ECE7] bg-white p-1">
                  {RECURRENCE_OPTIONS.map((option) => {
                    const selected = repeatType === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setRepeatType(option.value)}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar ${option.label}`}
                        className={`flex-1 items-center rounded-[18px] px-2 py-3 ${
                          selected ? 'bg-[#128C7E]' : 'bg-transparent'
                        }`}>
                        <Text
                          style={{ fontFamily: 'Inter_700Bold' }}
                          className={`text-xs ${selected ? 'text-white' : 'text-slate-600'}`}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {repeatType === 'once' ? (
                  <View className="mt-4">
                    <View
                      className={`flex-row items-center rounded-[24px] border px-4 ${
                        dataInvalida
                          ? 'border-red-400 bg-red-50'
                          : campoFocado === 'data'
                            ? 'border-emerald-500 bg-white'
                            : 'border-[#E2ECE7] bg-white'
                      }`}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={dataInvalida ? '#ef4444' : '#128C7E'}
                      />

                      <TextInput
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#94a3b8"
                        value={dateTexto}
                        onChangeText={(text) => setDateTexto(formatReminderDateInput(text))}
                        onFocus={() => setCampoFocado('data')}
                        onBlur={() =>
                          setCampoFocado((valorAtual) =>
                            valorAtual === 'data' ? null : valorAtual
                          )
                        }
                        keyboardType="numeric"
                        maxLength={10}
                        style={{ fontFamily: 'Inter_400Regular' }}
                        className="ml-2 flex-1 py-3.5 text-[15px] text-slate-900"
                      />

                      {selectedWeekdayLabel ? (
                        <View className="rounded-full border border-[#D8E8E1] bg-[#F8FCFA] px-2.5 py-1.5">
                          <Text
                            style={{ fontFamily: 'Inter_700Bold' }}
                            className="text-[11px] text-[#4B675E]">
                            {selectedWeekdayLabel}
                          </Text>
                        </View>
                      ) : null}

                      <Pressable
                        onPress={abrirCalendario}
                        accessibilityRole="button"
                        accessibilityLabel="Escolher data no calendario"
                        className="ml-2 flex-row items-center rounded-full bg-[#F1FAF6] px-3 py-2">
                        <Ionicons name="calendar-number-outline" size={15} color="#128C7E" />
                        <Text
                          style={{ fontFamily: 'Inter_700Bold' }}
                          className="ml-1.5 text-xs text-[#128C7E]">
                          Calendario
                        </Text>
                      </Pressable>
                    </View>

                    <Text
                      style={{ fontFamily: 'Inter_400Regular' }}
                      className="mt-3 text-xs text-slate-500">
                      {selectedDateSummary
                        ? `Selecionado: ${selectedDateSummary}`
                        : 'Digite uma data ou escolha no calendario.'}
                    </Text>

                    <View className="mt-3 flex-row flex-wrap">
                      {QUICK_DATE_SHORTCUTS.map((option) => {
                        const inputDate = addDaysToInputDate(option.days);
                        const selected = dateTexto === inputDate;
                        const shortcutWeekday = getInputDateWeekdayLabel(inputDate);

                        return (
                          <Pressable
                            key={option.label}
                            onPress={() => setDateTexto(inputDate)}
                            accessibilityRole="button"
                            accessibilityLabel={`Selecionar ${option.label}`}
                            className={`mr-2 mt-2 rounded-full border px-4 py-2.5 ${
                              selected
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-[#E2ECE7] bg-white'
                            }`}>
                            <Text
                              style={{ fontFamily: 'Inter_700Bold' }}
                              className={`text-center text-sm ${
                                selected ? 'text-emerald-700' : 'text-slate-700'
                              }`}>
                              {option.label}
                            </Text>
                            <Text
                              style={{ fontFamily: 'Inter_400Regular' }}
                              className={`mt-0.5 text-center text-[11px] ${
                                selected ? 'text-emerald-700' : 'text-slate-500'
                              }`}>
                              {shortcutWeekday}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {calendarVisible ? (
                      <Modal
                        visible={calendarVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setCalendarVisible(false)}>
                        <View className="flex-1 justify-center bg-black/45 px-5">
                          <Pressable
                            className="absolute inset-0"
                            onPress={() => setCalendarVisible(false)}
                          />

                          <View className="overflow-hidden rounded-[28px] border border-[#D8E8E1] bg-white">
                            <View className="border-b border-[#E7F0EB] px-5 py-4">
                              <Text
                                style={{ fontFamily: 'Inter_700Bold' }}
                                className="text-base text-slate-900">
                                Escolher data
                              </Text>
                              <Text
                                style={{ fontFamily: 'Inter_400Regular' }}
                                className="mt-1 text-xs text-slate-500">
                                Selecione quando o bot deve lembrar.
                              </Text>
                            </View>

                            <View className="px-5 py-4">
                              <View className="mb-4 flex-row items-center justify-between">
                                <Pressable
                                  onPress={() => mudarMesCalendario(-1)}
                                  accessibilityRole="button"
                                  accessibilityLabel="Mes anterior"
                                  className="h-10 w-10 items-center justify-center rounded-full border border-[#E2ECE7] bg-[#F8FCFA]">
                                  <Ionicons name="chevron-back" size={18} color="#475569" />
                                </Pressable>

                                <Text
                                  style={{ fontFamily: 'Inter_700Bold' }}
                                  className="text-base capitalize text-slate-900">
                                  {calendarMonthTitle}
                                </Text>

                                <Pressable
                                  onPress={() => mudarMesCalendario(1)}
                                  accessibilityRole="button"
                                  accessibilityLabel="Proximo mes"
                                  className="h-10 w-10 items-center justify-center rounded-full border border-[#E2ECE7] bg-[#F8FCFA]">
                                  <Ionicons name="chevron-forward" size={18} color="#475569" />
                                </Pressable>
                              </View>

                              <View className="mb-2 flex-row">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                                  <Text
                                    key={day}
                                    style={{ fontFamily: 'Inter_700Bold' }}
                                    className="flex-1 text-center text-[11px] text-slate-500">
                                    {day}
                                  </Text>
                                ))}
                              </View>

                              <View className="flex-row flex-wrap">
                                {calendarDays.map((day) => {
                                  const selected = dateTexto === day.inputDate;
                                  const disabled = day.isPast;

                                  return (
                                    <Pressable
                                      key={day.key}
                                      onPress={() => {
                                        if (disabled) return;
                                        setDateTexto(day.inputDate);
                                      }}
                                      disabled={disabled}
                                      accessibilityRole="button"
                                      accessibilityLabel={day.accessibilityLabel}
                                      className="w-[14.285%] p-1">
                                      <View
                                        className={`aspect-square items-center justify-center rounded-2xl ${
                                          selected
                                            ? 'bg-[#128C7E]'
                                            : disabled
                                              ? 'bg-slate-100'
                                              : 'bg-white'
                                        }`}>
                                        <Text
                                          style={{ fontFamily: 'Inter_700Bold' }}
                                          className={`text-sm ${
                                            selected
                                              ? 'text-white'
                                              : disabled
                                                ? 'text-slate-300'
                                                : day.isCurrentMonth
                                                  ? 'text-slate-800'
                                                  : 'text-slate-300'
                                          }`}>
                                          {day.day}
                                        </Text>
                                        <Text
                                          style={{ fontFamily: 'Inter_400Regular' }}
                                          className={`mt-0.5 text-[9px] ${
                                            selected
                                              ? 'text-white'
                                              : disabled
                                                ? 'text-slate-300'
                                                : 'text-slate-400'
                                          }`}>
                                          {day.weekdayLabel}
                                        </Text>
                                      </View>
                                    </Pressable>
                                  );
                                })}
                              </View>

                              {selectedDateSummary ? (
                                <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                  <Text
                                    style={{ fontFamily: 'Inter_700Bold' }}
                                    className="text-sm text-slate-900">
                                    {selectedDateSummary}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <View className="flex-row gap-3 border-t border-[#E7F0EB] px-5 py-4">
                              <Pressable
                                onPress={() => setCalendarVisible(false)}
                                accessibilityRole="button"
                                accessibilityLabel="Cancelar escolha de data"
                                className="flex-1 items-center rounded-2xl border border-slate-300 bg-slate-100 py-3">
                                <Text
                                  style={{ fontFamily: 'Inter_700Bold' }}
                                  className="text-sm text-slate-700">
                                  Cancelar
                                </Text>
                              </Pressable>

                              <Pressable
                                onPress={() => setCalendarVisible(false)}
                                accessibilityRole="button"
                                accessibilityLabel="Concluir escolha de data"
                                className="flex-1 items-center rounded-2xl bg-[#128C7E] py-3">
                                <Text
                                  style={{ fontFamily: 'Inter_700Bold' }}
                                  className="text-sm text-white">
                                  Concluir
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      </Modal>
                    ) : null}

                    {dataInvalida ? (
                      <Text
                        style={{ fontFamily: 'Inter_700Bold' }}
                        className="mt-3 text-xs text-red-500">
                        Digite uma data valida.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {repeatType === 'weekly' ? (
                  <View className="mt-4 flex-row flex-wrap">
                    {WEEKDAY_OPTIONS.map((option) => {
                      const selected = weekday === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setWeekday(option.value)}
                          accessibilityRole="button"
                          accessibilityLabel={`Selecionar ${option.label}`}
                          className={`mr-2 mt-2 rounded-full border px-3.5 py-2.5 ${
                            selected
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-[#E2ECE7] bg-white'
                          }`}>
                          <Text
                            style={{ fontFamily: 'Inter_700Bold' }}
                            className={`text-sm ${selected ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {option.shortLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View className="mt-4 rounded-[26px] border border-[#E7F0EB] bg-[#FCFDFC] p-4">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F1FAF6]">
                    <Ionicons name="alarm-outline" size={18} color="#128C7E" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-base text-slate-900">
                      Horario
                    </Text>
                  </View>
                </View>

                <View
                  className={`mt-4 flex-row items-center rounded-[24px] border px-4 ${
                    horaInvalida
                      ? 'border-red-400 bg-red-50'
                      : campoFocado === 'hora'
                        ? 'border-emerald-500 bg-white'
                        : 'border-[#E2ECE7] bg-white'
                  }`}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={horaInvalida ? '#ef4444' : '#128C7E'}
                  />

                  <TextInput
                    placeholder="00:00"
                    placeholderTextColor="#94a3b8"
                    value={horaTexto}
                    onChangeText={(text) => setHoraTexto(formatReminderTimeInput(text))}
                    onFocus={() => setCampoFocado('hora')}
                    onBlur={() =>
                      setCampoFocado((valorAtual) => (valorAtual === 'hora' ? null : valorAtual))
                    }
                    keyboardType="numeric"
                    maxLength={5}
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="ml-2 flex-1 py-3.5 text-[15px] text-slate-900"
                  />
                </View>

                <View className="mt-4 flex-row flex-wrap">
                  {HORARIOS_RAPIDOS.map((horario) => {
                    const selecionado = horaTexto === horario;

                    return (
                      <Pressable
                        key={horario}
                        onPress={() => setHoraTexto(horario)}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar horario ${horario}`}
                        className={`mr-2 mt-2 rounded-full border px-4 py-2.5 ${
                          selecionado
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-[#E2ECE7] bg-white'
                        }`}>
                        <Text
                          style={{ fontFamily: 'Inter_700Bold' }}
                          className={`text-base ${selecionado ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {horario}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {horaInvalida ? (
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="mt-3 text-xs text-red-500">
                    Digite um horario valido entre 00:00 e 23:59.
                  </Text>
                ) : null}
              </View>

              <View className="mt-4 rounded-[26px] border border-[#E7F0EB] bg-[#FCFDFC] p-4">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#F1FAF6]">
                    <Ionicons name="chatbox-ellipses-outline" size={18} color="#128C7E" />
                  </View>

                  <View className="ml-3 flex-1">
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-base text-slate-900">
                      O que lembrar
                    </Text>
                  </View>
                </View>

                <View
                  className={`mt-4 rounded-[24px] border px-4 py-1 ${
                    comandoComHorario
                      ? 'border-red-400 bg-red-50'
                      : campoFocado === 'comando'
                        ? 'border-emerald-500 bg-white'
                        : 'border-[#E2ECE7] bg-white'
                  }`}>
                  <TextInput
                    placeholder="Ex.: beber agua"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={textComando}
                    onChangeText={setTextComando}
                    onFocus={() => setCampoFocado('comando')}
                    onBlur={() =>
                      setCampoFocado((valorAtual) => (valorAtual === 'comando' ? null : valorAtual))
                    }
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="py-3.5 text-[15px] text-slate-900"
                  />
                </View>

                {comandoComHorario ? (
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="mt-3 text-xs text-red-500">
                    Remova o horario da mensagem. Use apenas o campo Horario.
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={criarLembrete}
                disabled={!podeEnviar}
                accessibilityRole="button"
                accessibilityLabel="Salvar lembrete"
                className={`mt-5 items-center rounded-[22px] py-4 ${
                  podeEnviar ? 'bg-[#128C7E]' : 'bg-slate-200'
                }`}>
                <Text
                  style={{ fontFamily: 'Inter_700Bold' }}
                  className={`text-base ${podeEnviar ? 'text-white' : 'text-slate-500'}`}>
                  {createMutation.isPending ? 'Salvando...' : 'Criar lembrete'}
                </Text>
              </Pressable>
            </View>
          </SurfaceCard>
        </Atmosphere>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
