import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { BackButtonIcon } from '@/components/icons/BackButtonIcon';
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

const pageGradient = ['#FFFFFF', '#FBFFFD', '#F3FFF8', '#F7F3FF'] as const;

const panelShadow = {
  shadowColor: '#191622',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 3,
};

const controlShadow = {
  shadowColor: '#0F3D35',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.045,
  shadowRadius: 16,
  elevation: 1,
};

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
    <LinearGradient colors={pageGradient} locations={[0, 0.38, 0.76, 1]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

        <KeyboardAwareScrollView
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={90}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: 34,
          }}>
          <View className="w-full max-w-[440px] self-center">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                className="h-11 w-11 items-center justify-center rounded-2xl bg-white"
                style={controlShadow}>
                <BackButtonIcon size={24} />
              </Pressable>

              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[13px] text-[#747887]">
                Novo lembrete
              </Text>

              <View className="h-11 w-11" />
            </View>

            <View className="mt-7">
              <Text
                style={{ fontFamily: 'Inter_900Black' }}
                className="text-[31px] leading-9 text-[#24252C]">
                O que voce quer lembrar?
              </Text>
              <Text
                style={{ fontFamily: 'Inter_400Regular' }}
                className="mt-3 text-[15px] leading-6 text-[#747887]">
                Crie um aviso simples e receba no WhatsApp no horario certo.
              </Text>
            </View>

            <View className="mt-6 rounded-[28px] bg-white p-5" style={panelShadow}>
              <View>
                <Text
                  style={{ fontFamily: 'Inter_700Bold' }}
                  className="text-[15px] text-[#24252C]">
                  Mensagem
                </Text>
                <View
                  className={`mt-3 rounded-[22px] border px-4 py-1 ${
                    comandoComHorario
                      ? 'border-red-400 bg-red-50'
                      : campoFocado === 'comando'
                        ? 'border-[#6135E8] bg-white'
                        : 'border-[#E6E8EE] bg-[#FBFCFD]'
                  }`}>
                  <TextInput
                    placeholder="Ex.: tomar remedio"
                    placeholderTextColor="#9CA0AA"
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    value={textComando}
                    onChangeText={setTextComando}
                    onFocus={() => setCampoFocado('comando')}
                    onBlur={() =>
                      setCampoFocado((valorAtual) => (valorAtual === 'comando' ? null : valorAtual))
                    }
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="min-h-[54px] text-[16px] text-[#24252C]"
                  />
                </View>

                {comandoComHorario ? (
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="mt-2 text-xs text-red-500">
                    Deixe o horario apenas no campo Horario.
                  </Text>
                ) : null}
              </View>

              <View className="mt-6">
                <Text
                  style={{ fontFamily: 'Inter_700Bold' }}
                  className="text-[15px] text-[#24252C]">
                  Frequencia
                </Text>
                <View className="mt-3 flex-row rounded-[20px] bg-[#F2F4F7] p-1">
                  {RECURRENCE_OPTIONS.map((option) => {
                    const selected = repeatType === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setRepeatType(option.value)}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar ${option.label}`}
                        className={`flex-1 items-center rounded-[16px] px-2 py-3 ${
                          selected ? 'bg-[#6135E8]' : 'bg-transparent'
                        }`}>
                        <Text
                          style={{ fontFamily: 'Inter_700Bold' }}
                          className={`text-[12px] ${selected ? 'text-white' : 'text-[#747887]'}`}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {repeatType === 'once' ? (
                <View className="mt-6">
                  <View className="flex-row items-center justify-between">
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-[15px] text-[#24252C]">
                      Data
                    </Text>
                    <Pressable
                      onPress={abrirCalendario}
                      accessibilityRole="button"
                      accessibilityLabel="Escolher data no calendario"
                      className="flex-row items-center rounded-full bg-[#EEE7FF] px-3 py-2">
                      <Ionicons name="calendar-number-outline" size={15} color="#6135E8" />
                      <Text
                        style={{ fontFamily: 'Inter_700Bold' }}
                        className="ml-1.5 text-[12px] text-[#6135E8]">
                        Calendario
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    className={`mt-3 flex-row items-center rounded-[22px] border px-4 ${
                      dataInvalida
                        ? 'border-red-400 bg-red-50'
                        : campoFocado === 'data'
                          ? 'border-[#6135E8] bg-white'
                          : 'border-[#E6E8EE] bg-[#FBFCFD]'
                    }`}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={dataInvalida ? '#ef4444' : '#128C7E'}
                    />

                    <TextInput
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#9CA0AA"
                      value={dateTexto}
                      onChangeText={(text) => setDateTexto(formatReminderDateInput(text))}
                      onFocus={() => setCampoFocado('data')}
                      onBlur={() =>
                        setCampoFocado((valorAtual) => (valorAtual === 'data' ? null : valorAtual))
                      }
                      keyboardType="numeric"
                      maxLength={10}
                      style={{ fontFamily: 'Inter_400Regular' }}
                      className="ml-2 flex-1 py-3.5 text-[15px] text-[#24252C]"
                    />

                    {selectedWeekdayLabel ? (
                      <View className="rounded-full bg-[#E7F8F1] px-2.5 py-1.5">
                        <Text
                          style={{ fontFamily: 'Inter_700Bold' }}
                          className="text-[11px] text-[#128C7E]">
                          {selectedWeekdayLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="mt-2 text-[12px] text-[#8B8D97]">
                    {selectedDateSummary || 'Digite uma data ou escolha no calendario.'}
                  </Text>

                  <View className="mt-2 flex-row flex-wrap">
                    {QUICK_DATE_SHORTCUTS.map((option) => {
                      const inputDate = addDaysToInputDate(option.days);
                      const selected = dateTexto === inputDate;

                      return (
                        <Pressable
                          key={option.label}
                          onPress={() => setDateTexto(inputDate)}
                          accessibilityRole="button"
                          accessibilityLabel={`Selecionar ${option.label}`}
                          className={`mr-2 mt-2 rounded-full px-4 py-2.5 ${
                            selected ? 'bg-[#E7F8F1]' : 'bg-[#F2F4F7]'
                          }`}>
                          <Text
                            style={{ fontFamily: 'Inter_700Bold' }}
                            className={`text-sm ${selected ? 'text-[#128C7E]' : 'text-[#747887]'}`}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {dataInvalida ? (
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="mt-2 text-xs text-red-500">
                      Digite uma data valida.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {repeatType === 'weekly' ? (
                <View className="mt-6">
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="text-[15px] text-[#24252C]">
                    Dia da semana
                  </Text>
                  <View className="mt-2 flex-row flex-wrap">
                    {WEEKDAY_OPTIONS.map((option) => {
                      const selected = weekday === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setWeekday(option.value)}
                          accessibilityRole="button"
                          accessibilityLabel={`Selecionar ${option.label}`}
                          className={`mr-2 mt-2 rounded-full px-3.5 py-2.5 ${
                            selected ? 'bg-[#E7F8F1]' : 'bg-[#F2F4F7]'
                          }`}>
                          <Text
                            style={{ fontFamily: 'Inter_700Bold' }}
                            className={`text-sm ${selected ? 'text-[#128C7E]' : 'text-[#747887]'}`}>
                            {option.shortLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View className="mt-6">
                <Text
                  style={{ fontFamily: 'Inter_700Bold' }}
                  className="text-[15px] text-[#24252C]">
                  Horario
                </Text>

                <View
                  className={`mt-3 flex-row items-center rounded-[22px] border px-4 ${
                    horaInvalida
                      ? 'border-red-400 bg-red-50'
                      : campoFocado === 'hora'
                        ? 'border-[#6135E8] bg-white'
                        : 'border-[#E6E8EE] bg-[#FBFCFD]'
                  }`}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={horaInvalida ? '#ef4444' : '#128C7E'}
                  />

                  <TextInput
                    placeholder="00:00"
                    placeholderTextColor="#9CA0AA"
                    value={horaTexto}
                    onChangeText={(text) => setHoraTexto(formatReminderTimeInput(text))}
                    onFocus={() => setCampoFocado('hora')}
                    onBlur={() =>
                      setCampoFocado((valorAtual) => (valorAtual === 'hora' ? null : valorAtual))
                    }
                    keyboardType="numeric"
                    maxLength={5}
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="ml-2 flex-1 py-3.5 text-[15px] text-[#24252C]"
                  />
                </View>

                <View className="mt-2 flex-row flex-wrap">
                  {HORARIOS_RAPIDOS.map((horario) => {
                    const selecionado = horaTexto === horario;

                    return (
                      <Pressable
                        key={horario}
                        onPress={() => setHoraTexto(horario)}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar horario ${horario}`}
                        className={`mr-2 mt-2 rounded-full px-4 py-2.5 ${
                          selecionado ? 'bg-[#E7F8F1]' : 'bg-[#F2F4F7]'
                        }`}>
                        <Text
                          style={{ fontFamily: 'Inter_700Bold' }}
                          className={`text-sm ${selecionado ? 'text-[#128C7E]' : 'text-[#747887]'}`}>
                          {horario}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {horaInvalida ? (
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="mt-2 text-xs text-red-500">
                    Digite um horario valido entre 00:00 e 23:59.
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={criarLembrete}
                disabled={!podeEnviar}
                accessibilityRole="button"
                accessibilityLabel="Salvar lembrete"
                className={`mt-7 h-[56px] items-center justify-center rounded-[20px] ${
                  podeEnviar ? 'bg-[#6135E8]' : 'bg-[#E6E8EE]'
                }`}>
                <Text
                  style={{ fontFamily: 'Inter_900Black' }}
                  className={`text-[15px] ${podeEnviar ? 'text-white' : 'text-[#8B8D97]'}`}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar lembrete'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {calendarVisible ? (
          <Modal
            visible={calendarVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCalendarVisible(false)}>
            <View className="flex-1 justify-center bg-black/45 px-5">
              <Pressable className="absolute inset-0" onPress={() => setCalendarVisible(false)} />

              <View className="overflow-hidden rounded-[28px] bg-white" style={panelShadow}>
                <View className="border-b border-[#E7F0EB] px-5 py-4">
                  <Text
                    style={{ fontFamily: 'Inter_700Bold' }}
                    className="text-base text-[#24252C]">
                    Escolher data
                  </Text>
                  <Text
                    style={{ fontFamily: 'Inter_400Regular' }}
                    className="mt-1 text-xs text-[#747887]">
                    Selecione quando quer receber o lembrete.
                  </Text>
                </View>

                <View className="px-5 py-4">
                  <View className="mb-4 flex-row items-center justify-between">
                    <Pressable
                      onPress={() => mudarMesCalendario(-1)}
                      accessibilityRole="button"
                      accessibilityLabel="Mes anterior"
                      className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7]">
                      <Ionicons name="chevron-back" size={18} color="#475569" />
                    </Pressable>

                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-base capitalize text-[#24252C]">
                      {calendarMonthTitle}
                    </Text>

                    <Pressable
                      onPress={() => mudarMesCalendario(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Proximo mes"
                      className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7]">
                      <Ionicons name="chevron-forward" size={18} color="#475569" />
                    </Pressable>
                  </View>

                  <View className="mb-2 flex-row">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                      <Text
                        key={day}
                        style={{ fontFamily: 'Inter_700Bold' }}
                        className="flex-1 text-center text-[11px] text-[#8B8D97]">
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
                              selected ? 'bg-[#6135E8]' : disabled ? 'bg-[#F2F4F7]' : 'bg-white'
                            }`}>
                            <Text
                              style={{ fontFamily: 'Inter_700Bold' }}
                              className={`text-sm ${
                                selected
                                  ? 'text-white'
                                  : disabled
                                    ? 'text-slate-300'
                                    : day.isCurrentMonth
                                      ? 'text-[#24252C]'
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
                                    : 'text-[#8B8D97]'
                              }`}>
                              {day.weekdayLabel}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {selectedDateSummary ? (
                    <View className="mt-4 rounded-2xl bg-[#E7F8F1] px-4 py-3">
                      <Text
                        style={{ fontFamily: 'Inter_700Bold' }}
                        className="text-sm text-[#24252C]">
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
                    className="flex-1 items-center rounded-2xl bg-[#F2F4F7] py-3">
                    <Text
                      style={{ fontFamily: 'Inter_700Bold' }}
                      className="text-sm text-[#747887]">
                      Cancelar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setCalendarVisible(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Concluir escolha de data"
                    className="flex-1 items-center rounded-2xl bg-[#6135E8] py-3">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-white">
                      Concluir
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}
