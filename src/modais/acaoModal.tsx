import {
  Bot,
  CalendarDays,
  Check,
  Clock3,
  MessageSquareText,
  Pencil,
  Repeat2,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

import {
  WEEKDAY_OPTIONS,
  formatReminderDateInput,
  formatReminderSchedule,
  formatReminderTimeInput,
  inputDateToIsoDate,
  isReminderDateValid,
  isReminderTimeValid,
  isoDateToInputDate,
  type ReminderRepeatType,
} from '@/services/reminderEdit';

type AcaoModalProps = {
  visible: boolean;
  message: string;
  time: string;
  date?: string;
  dataFormatada: string;
  repeatType: ReminderRepeatType;
  weekday?: number;
  isUpdating: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (payload: {
    date?: string;
    message: string;
    repeatType: ReminderRepeatType;
    time: string;
    weekday?: number;
  }) => Promise<void>;
};

const RECURRENCE_OPTIONS: { label: string; value: ReminderRepeatType }[] = [
  { label: 'Uma vez', value: 'once' },
  { label: 'Todo dia', value: 'daily' },
  { label: 'Toda semana', value: 'weekly' },
];

function AcaoModalComponent({
  visible,
  onClose,
  onDelete,
  onUpdate,
  message,
  time,
  date,
  dataFormatada,
  repeatType,
  weekday = 0,
  isUpdating,
}: AcaoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState(message);
  const [draftTime, setDraftTime] = useState(time);
  const [draftDate, setDraftDate] = useState(isoDateToInputDate(date));
  const [draftRepeatType, setDraftRepeatType] = useState<ReminderRepeatType>(repeatType);
  const [draftWeekday, setDraftWeekday] = useState(weekday);

  useEffect(() => {
    if (!visible) {
      setIsEditing(false);
      return;
    }

    setDraftMessage(message);
    setDraftTime(time);
    setDraftDate(isoDateToInputDate(date));
    setDraftRepeatType(repeatType);
    setDraftWeekday(weekday);
  }, [date, message, repeatType, time, visible, weekday]);

  const draftMessageTrimmed = draftMessage.trim();
  const timeIsValid = isReminderTimeValid(draftTime);
  const dateIsValid = draftRepeatType !== 'once' || isReminderDateValid(draftDate);
  const draftIsoDate = draftRepeatType === 'once' ? inputDateToIsoDate(draftDate) : undefined;
  const currentSummary = formatReminderSchedule({
    type: repeatType === 'once' ? undefined : repeatType,
    date,
    time,
    weekday,
  });
  const draftSummary = formatReminderSchedule({
    type: draftRepeatType === 'once' ? undefined : draftRepeatType,
    date: draftIsoDate ?? undefined,
    time: draftTime,
    weekday: draftWeekday,
  });

  const hasChanges = useMemo(
    () =>
      draftMessageTrimmed !== message.trim() ||
      draftTime !== time ||
      draftRepeatType !== repeatType ||
      draftWeekday !== weekday ||
      draftIsoDate !== date,
    [
      date,
      draftIsoDate,
      draftMessageTrimmed,
      draftRepeatType,
      draftTime,
      draftWeekday,
      message,
      repeatType,
      time,
      weekday,
    ]
  );
  const canSave =
    draftMessageTrimmed.length > 0 && timeIsValid && dateIsValid && hasChanges && !isUpdating;

  async function handleSave() {
    if (!canSave) return;

    await onUpdate({
      date: draftIsoDate ?? undefined,
      message: draftMessageTrimmed,
      repeatType: draftRepeatType,
      time: draftTime,
      weekday: draftRepeatType === 'weekly' ? draftWeekday : undefined,
    });

    setIsEditing(false);
  }

  function handleCancelEdit() {
    setDraftMessage(message);
    setDraftTime(time);
    setDraftDate(isoDateToInputDate(date));
    setDraftRepeatType(repeatType);
    setDraftWeekday(weekday);
    setIsEditing(false);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/45 px-5">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm">
          <View className="border-b border-slate-200 px-5 pb-4 pt-5">
            <View className="flex-row items-start justify-between">
              <View className="mr-3 flex-1 flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                  <Bot size={20} color="#128C7E" />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-extrabold tracking-wide text-slate-900">
                    {isEditing ? 'Editar lembrete' : 'Detalhes do lembrete'}
                  </Text>
                  {isEditing ? (
                    <Text className="mt-1 text-xs font-medium text-slate-500">
                      Ajuste quando lembrar e a mensagem.
                    </Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white">
                <X size={16} color="#475569" />
              </Pressable>
            </View>
          </View>

          <View className="gap-4 px-5 py-5">
            {isEditing ? (
              <View className="gap-4">
                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="mb-3 flex-row items-center">
                    <Repeat2 size={15} color="#128C7E" />
                    <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Recorrencia
                    </Text>
                  </View>

                  <View className="flex-row rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    {RECURRENCE_OPTIONS.map((option) => {
                      const selected = draftRepeatType === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setDraftRepeatType(option.value)}
                          className={`flex-1 items-center rounded-xl px-2 py-2.5 ${
                            selected ? 'bg-[#128C7E]' : 'bg-transparent'
                          }`}>
                          <Text
                            className={`text-[11px] font-bold ${
                              selected ? 'text-white' : 'text-slate-600'
                            }`}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {draftRepeatType === 'once' ? (
                    <View
                      className={`mt-3 rounded-xl border px-3 py-2.5 ${
                        draftDate.length === 10 && !dateIsValid
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}>
                      <View className="mb-1 flex-row items-center">
                        <CalendarDays size={14} color="#0284C7" />
                        <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          Data
                        </Text>
                      </View>

                      <TextInput
                        value={draftDate}
                        onChangeText={(value) => setDraftDate(formatReminderDateInput(value))}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        maxLength={10}
                        className="py-0 text-sm font-semibold text-slate-800"
                      />
                    </View>
                  ) : null}

                  {draftRepeatType === 'weekly' ? (
                    <View className="mt-3 flex-row flex-wrap">
                      {WEEKDAY_OPTIONS.map((option) => {
                        const selected = draftWeekday === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => setDraftWeekday(option.value)}
                            className={`mr-2 mt-2 rounded-full border px-3 py-2 ${
                              selected
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-slate-200 bg-slate-50'
                            }`}>
                            <Text
                              className={`text-xs font-bold ${
                                selected ? 'text-emerald-700' : 'text-slate-600'
                              }`}>
                              {option.shortLabel}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="mb-2 flex-row items-center">
                    <Clock3 size={15} color="#CA8A04" />
                    <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Horario
                    </Text>
                  </View>

                  <TextInput
                    value={draftTime}
                    onChangeText={(value) => setDraftTime(formatReminderTimeInput(value))}
                    placeholder="00:00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    maxLength={5}
                    className={`rounded-2xl border px-4 py-3.5 text-base font-semibold text-slate-900 ${
                      draftTime.length === 5 && !timeIsValid
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  />

                  {draftTime.length === 5 && !timeIsValid ? (
                    <Text className="mt-3 text-xs font-bold text-red-600">
                      Digite um horario entre 00:00 e 23:59.
                    </Text>
                  ) : null}
                  {draftDate.length === 10 && !dateIsValid ? (
                    <Text className="mt-3 text-xs font-bold text-red-600">
                      Digite uma data valida.
                    </Text>
                  ) : null}
                </View>

                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="mb-2 flex-row items-center">
                    <MessageSquareText size={15} color="#4F46E5" />
                    <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Mensagem
                    </Text>
                  </View>

                  <TextInput
                    value={draftMessage}
                    onChangeText={setDraftMessage}
                    placeholder="Ex.: beber agua"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-900"
                  />
                </View>

                <View className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Vai ficar
                  </Text>
                  <Text className="mt-1 text-sm font-semibold text-slate-800">{draftSummary}</Text>
                </View>
              </View>
            ) : (
              <>
                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="mb-2 flex-row items-center">
                    <MessageSquareText size={15} color="#4F46E5" />
                    <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Comando
                    </Text>
                  </View>
                  <Text className="text-base font-bold leading-6 text-slate-900">{message}</Text>
                </View>

                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="mr-2 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <View className="mb-1 flex-row items-center">
                        <CalendarDays size={14} color="#0284C7" />
                        <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          Quando
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-slate-800">
                        {repeatType === 'once' ? dataFormatada : currentSummary}
                      </Text>
                    </View>

                    <View className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <View className="mb-1 flex-row items-center">
                        <Clock3 size={14} color="#CA8A04" />
                        <Text className="ml-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          Horario
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-slate-800">{time}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {isEditing ? (
              <View className="mt-1 flex-row gap-3">
                <Pressable
                  onPress={handleCancelEdit}
                  disabled={isUpdating}
                  className="flex-1 items-center rounded-2xl border border-slate-300 bg-slate-100 py-3">
                  <Text className="text-sm font-bold text-slate-700">Cancelar</Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 ${
                    canSave ? 'bg-[#128C7E]' : 'bg-slate-300'
                  }`}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Check size={14} color={canSave ? '#FFFFFF' : '#64748b'} />
                  )}
                  <Text
                    className={`ml-2 text-sm font-bold ${
                      canSave ? 'text-white' : 'text-slate-600'
                    }`}>
                    Salvar
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-1 flex-row gap-3">
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="flex-1 flex-row items-center justify-center rounded-2xl bg-[#128C7E] py-3">
                  <Pencil size={14} color="#FFFFFF" />
                  <Text className="ml-2 text-sm font-bold text-white">Editar</Text>
                </Pressable>

                <Pressable
                  onPress={onDelete}
                  className="flex-1 flex-row items-center justify-center rounded-2xl bg-red-600 py-3">
                  <Trash2 size={14} color="#FFFFFF" />
                  <Text className="ml-2 text-sm font-bold text-white">Deletar</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const AcaoModal = React.memo(AcaoModalComponent);
