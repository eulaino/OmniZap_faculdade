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
  replaceReminderInCache,
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
import { useAppTheme } from '@/theme/appTheme';
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

const panelShadow = {
  shadowColor: '#191622',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 3,
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

  const response = await api.post(
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

  return response.data?.lembrete as ReminderCacheItem | undefined;
}

export default function CriarComando() {
  const theme = useAppTheme();
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

      return { optimisticReminderId: optimisticReminder.id, previousReminders };
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
    onSuccess: (createdReminder, _draft, context) => {
      if (createdReminder && context?.optimisticReminderId) {
        queryClient.setQueryData<ReminderCacheItem[]>(reminderQueryKey(user?.uid), (old = []) =>
          replaceReminderInCache(old, context.optimisticReminderId, createdReminder)
        );
      }

      router.back();
      void refreshReminderAppData(queryClient, user?.uid, { includeReminders: false }).catch(
        (error) => {
          console.log('Erro ao atualizar dados apos criar lembrete:', error);
        }
      );

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
    <LinearGradient colors={theme.gradient} locations={[0, 0.38, 0.76, 1]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar backgroundColor={theme.colors.statusBar} barStyle={theme.statusBarStyle} />

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
                className="h-11 w-11 items-center justify-center">
                <BackButtonIcon size={24} />
              </Pressable>

              <Text
                style={{ fontFamily: 'Inter_900Black', color: theme.colors.text }}
                className="text-center text-[20px] leading-6">
                Novo lembrete
              </Text>

              <View className="h-11 w-11" />
            </View>

            <View className="mt-7">
              <Text
                style={{ fontFamily: 'Inter_900Black', color: theme.colors.text }}
                className="text-[31px] leading-9">
                O que voce quer lembrar?
              </Text>
              <Text
                style={{ fontFamily: 'Inter_400Regular', color: theme.colors.textMuted }}
                className="mt-3 text-[15px] leading-6">
                Crie um aviso simples e receba no WhatsApp no horario certo.
              </Text>
            </View>

            <View
              className="mt-6 rounded-[28px] p-5"
              style={[panelShadow, { backgroundColor: theme.colors.card }]}>
              <View>
                <Text
                  style={{ fontFamily: 'Inter_700Bold', color: theme.colors.text }}
                  className="text-[15px]">
                  Mensagem
                </Text>
                <View
                  className="mt-3 rounded-[22px] border px-4 py-1"
                  style={{
                    backgroundColor: comandoComHorario ? '#FFF1F2' : theme.colors.input,
                    borderColor: comandoComHorario
                      ? '#f87171'
                      : campoFocado === 'comando'
                        ? theme.colors.accent
                        : theme.colors.border,
                  }}>
                  <TextInput
                    placeholder="Ex.: tomar remedio"
                    placeholderTextColor={theme.colors.textSoft}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    value={textComando}
                    onChangeText={setTextComando}
                    onFocus={() => setCampoFocado('comando')}
                    onBlur={() =>
                      setCampoFocado((valorAtual) => (valorAtual === 'comando' ? null : valorAtual))
                    }
                    className="min-h-[54px] text-[16px]"
                    style={{ fontFamily: 'Inter_400Regular', color: theme.colors.text }}
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
                  style={{ fontFamily: 'Inter_700Bold', color: theme.colors.text }}
                  className="text-[15px]">
                  Frequencia
                </Text>
                <View
                  className="mt-3 flex-row rounded-[20px] p-1"
                  style={{ backgroundColor: theme.colors.cardMuted }}>
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
                          style={{
                            fontFamily: 'Inter_700Bold',
                            color: selected ? '#FFFFFF' : theme.colors.textMuted,
                          }}
                          className="text-[12px]">
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
                      style={{ fontFamily: 'Inter_700Bold', color: theme.colors.text }}
                      className="text-[15px]">
                      Data
                    </Text>
                    <Pressable
                      onPress={abrirCalendario}
                      accessibilityRole="button"
                      accessibilityLabel="Escolher data no calendario"
                      className="flex-row items-center rounded-full px-3 py-2"
                      style={{ backgroundColor: theme.colors.accentMuted }}>
                      <Ionicons
                        name="calendar-number-outline"
                        size={15}
                        color={theme.colors.accent}
                      />
                      <Text
                        style={{ fontFamily: 'Inter_700Bold', color: theme.colors.accent }}
                        className="ml-1.5 text-[12px]">
                        Calendario
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    className="mt-3 flex-row items-center rounded-[22px] border px-4"
                    style={{
                      backgroundColor: dataInvalida ? '#FFF1F2' : theme.colors.input,
                      borderColor: dataInvalida
                        ? '#f87171'
                        : campoFocado === 'data'
                          ? theme.colors.accent
                          : theme.colors.border,
                    }}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={dataInvalida ? '#ef4444' : theme.colors.primary}
                    />

                    <TextInput
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={theme.colors.textSoft}
                      value={dateTexto}
                      onChangeText={(text) => setDateTexto(formatReminderDateInput(text))}
                      onFocus={() => setCampoFocado('data')}
                      onBlur={() =>
                        setCampoFocado((valorAtual) => (valorAtual === 'data' ? null : valorAtual))
                      }
                      keyboardType="numeric"
                      maxLength={10}
                      style={{ fontFamily: 'Inter_400Regular', color: theme.colors.text }}
                      className="ml-2 flex-1 py-3.5 text-[15px]"
                    />

                    {selectedWeekdayLabel ? (
                      <View
                        className="rounded-full px-2.5 py-1.5"
                        style={{ backgroundColor: theme.colors.successMuted }}>
                        <Text
                          style={{ fontFamily: 'Inter_700Bold', color: theme.colors.success }}
                          className="text-[11px]">
                          {selectedWeekdayLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={{ fontFamily: 'Inter_400Regular', color: theme.colors.textSoft }}
                    className="mt-2 text-[12px]">
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
                          className="mr-2 mt-2 rounded-full px-4 py-2.5"
                          style={{
                            backgroundColor: selected
                              ? theme.colors.successMuted
                              : theme.colors.cardMuted,
                          }}>
                          <Text
                            style={{
                              fontFamily: 'Inter_700Bold',
                              color: selected ? theme.colors.success : theme.colors.textMuted,
                            }}
                            className="text-sm">
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
                    style={{ fontFamily: 'Inter_700Bold', color: theme.colors.text }}
                    className="text-[15px]">
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
                          className="mr-2 mt-2 rounded-full px-3.5 py-2.5"
                          style={{
                            backgroundColor: selected
                              ? theme.colors.successMuted
                              : theme.colors.cardMuted,
                          }}>
                          <Text
                            style={{
                              fontFamily: 'Inter_700Bold',
                              color: selected ? theme.colors.success : theme.colors.textMuted,
                            }}
                            className="text-sm">
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
                  style={{ fontFamily: 'Inter_700Bold', color: theme.colors.text }}
                  className="text-[15px]">
                  Horario
                </Text>

                <View
                  className="mt-3 flex-row items-center rounded-[22px] border px-4"
                  style={{
                    backgroundColor: horaInvalida ? '#FFF1F2' : theme.colors.input,
                    borderColor: horaInvalida
                      ? '#f87171'
                      : campoFocado === 'hora'
                        ? theme.colors.accent
                        : theme.colors.border,
                  }}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={horaInvalida ? '#ef4444' : theme.colors.primary}
                  />

                  <TextInput
                    placeholder="00:00"
                    placeholderTextColor={theme.colors.textSoft}
                    value={horaTexto}
                    onChangeText={(text) => setHoraTexto(formatReminderTimeInput(text))}
                    onFocus={() => setCampoFocado('hora')}
                    onBlur={() =>
                      setCampoFocado((valorAtual) => (valorAtual === 'hora' ? null : valorAtual))
                    }
                    keyboardType="numeric"
                    maxLength={5}
                    style={{ fontFamily: 'Inter_400Regular', color: theme.colors.text }}
                    className="ml-2 flex-1 py-3.5 text-[15px]"
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
                        className="mr-2 mt-2 rounded-full px-4 py-2.5"
                        style={{
                          backgroundColor: selecionado
                            ? theme.colors.successMuted
                            : theme.colors.cardMuted,
                        }}>
                        <Text
                          style={{
                            fontFamily: 'Inter_700Bold',
                            color: selecionado ? theme.colors.success : theme.colors.textMuted,
                          }}
                          className="text-sm">
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
