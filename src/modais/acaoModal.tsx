import {
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
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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

type FieldLabelProps = {
  icon: React.ReactNode;
  label: string;
};

type InfoItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

const RECURRENCE_OPTIONS: { label: string; value: ReminderRepeatType }[] = [
  { label: 'Uma vez', value: 'once' },
  { label: 'Todo dia', value: 'daily' },
  { label: 'Toda semana', value: 'weekly' },
];

const fonts = {
  regular: { fontFamily: 'Inter_400Regular' },
  medium: { fontFamily: 'Inter_500Medium' },
  bold: { fontFamily: 'Inter_700Bold' },
  black: { fontFamily: 'Inter_900Black' },
};

const sheetShadow = {
  shadowColor: '#191622',
  shadowOffset: { width: 0, height: -10 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 10,
};

function FieldLabel({ icon, label }: FieldLabelProps) {
  return (
    <View className="mb-2.5 flex-row items-center">
      {icon}
      <Text
        style={fonts.bold}
        className="ml-2 text-[12px] uppercase tracking-[0.12em] text-[#747887]">
        {label}
      </Text>
    </View>
  );
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center">
        {icon}
        <Text style={fonts.bold} className="ml-2 text-[11px] text-[#8B8D97]">
          {label}
        </Text>
      </View>
      <Text style={fonts.bold} className="mt-1 text-[14px] leading-5 text-[#24252C]">
        {value}
      </Text>
    </View>
  );
}

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
  const { height } = useWindowDimensions();
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
  const currentSchedule = repeatType === 'once' ? dataFormatada : currentSummary;

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

    try {
      await onUpdate({
        date: draftIsoDate ?? undefined,
        message: draftMessageTrimmed,
        repeatType: draftRepeatType,
        time: draftTime,
        weekday: draftRepeatType === 'weekly' ? draftWeekday : undefined,
      });

      setIsEditing(false);
    } catch {
      // Toast is shown by the caller; keep edit form open so user can retry.
    }
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          style={[sheetShadow, { maxHeight: Math.round(height * 0.88) }]}
          className="overflow-hidden rounded-t-[30px] bg-white">
          <View className="items-center pb-2 pt-3">
            <View className="h-1.5 w-11 rounded-full bg-[#D8DEE4]" />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-4 pt-1">
            <View className="mr-3 flex-1">
              <Text style={fonts.black} className="text-[21px] leading-7 text-[#24252C]">
                {isEditing ? 'Editar lembrete' : 'Lembrete'}
              </Text>
              <Text style={fonts.medium} className="mt-0.5 text-[13px] text-[#8B8D97]">
                {isEditing ? 'Ajuste o aviso antes de salvar.' : 'Enviado pelo WhatsApp.'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7]">
              <X size={18} color="#747887" />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={72}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}>
            {isEditing ? (
              <View>
                <View className="rounded-[24px] bg-[#F7F8FB] p-4">
                  <FieldLabel icon={<Repeat2 size={15} color="#6135E8" />} label="Frequencia" />
                  <View className="flex-row rounded-[18px] bg-white p-1">
                    {RECURRENCE_OPTIONS.map((option) => {
                      const selected = draftRepeatType === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setDraftRepeatType(option.value)}
                          accessibilityRole="button"
                          accessibilityLabel={`Selecionar ${option.label}`}
                          className={`flex-1 items-center rounded-[14px] px-2 py-2.5 ${
                            selected ? 'bg-[#6135E8]' : 'bg-transparent'
                          }`}>
                          <Text
                            style={fonts.bold}
                            className={`text-[12px] ${selected ? 'text-white' : 'text-[#747887]'}`}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {draftRepeatType === 'once' ? (
                    <View className="mt-4">
                      <FieldLabel icon={<CalendarDays size={15} color="#128C7E" />} label="Data" />
                      <TextInput
                        value={draftDate}
                        onChangeText={(value) => setDraftDate(formatReminderDateInput(value))}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#9CA0AA"
                        keyboardType="numeric"
                        maxLength={10}
                        cursorColor="#128C7E"
                        selectionColor="#128C7E"
                        style={fonts.medium}
                        className={`rounded-[18px] border bg-white px-4 py-3 text-[15px] text-[#24252C] ${
                          draftDate.length === 10 && !dateIsValid
                            ? 'border-red-300'
                            : 'border-[#E6E8EE]'
                        }`}
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
                            accessibilityRole="button"
                            accessibilityLabel={`Selecionar ${option.label}`}
                            className={`mr-2 mt-2 rounded-full px-3.5 py-2 ${
                              selected ? 'bg-[#E7F8F1]' : 'bg-white'
                            }`}>
                            <Text
                              style={fonts.bold}
                              className={`text-[13px] ${
                                selected ? 'text-[#128C7E]' : 'text-[#747887]'
                              }`}>
                              {option.shortLabel}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  <View className="mt-4">
                    <FieldLabel icon={<Clock3 size={15} color="#128C7E" />} label="Horario" />
                    <TextInput
                      value={draftTime}
                      onChangeText={(value) => setDraftTime(formatReminderTimeInput(value))}
                      placeholder="00:00"
                      placeholderTextColor="#9CA0AA"
                      keyboardType="numeric"
                      maxLength={5}
                      cursorColor="#128C7E"
                      selectionColor="#128C7E"
                      style={fonts.bold}
                      className={`rounded-[18px] border bg-white px-4 py-3 text-[16px] text-[#24252C] ${
                        draftTime.length === 5 && !timeIsValid
                          ? 'border-red-300'
                          : 'border-[#E6E8EE]'
                      }`}
                    />
                  </View>

                  <View className="mt-4">
                    <FieldLabel
                      icon={<MessageSquareText size={15} color="#6135E8" />}
                      label="Mensagem"
                    />
                    <TextInput
                      value={draftMessage}
                      onChangeText={setDraftMessage}
                      placeholder="Ex.: tomar remedio"
                      placeholderTextColor="#9CA0AA"
                      autoCapitalize="sentences"
                      autoCorrect={false}
                      multiline
                      cursorColor="#128C7E"
                      selectionColor="#128C7E"
                      style={[fonts.medium, { textAlignVertical: 'top' }]}
                      className="min-h-[78px] rounded-[18px] border border-[#E6E8EE] bg-white px-4 py-3 text-[15px] leading-6 text-[#24252C]"
                    />
                  </View>
                </View>

                {draftTime.length === 5 && !timeIsValid ? (
                  <Text style={fonts.bold} className="mt-3 text-[12px] text-red-500">
                    Digite um horario entre 00:00 e 23:59.
                  </Text>
                ) : null}
                {draftDate.length === 10 && !dateIsValid ? (
                  <Text style={fonts.bold} className="mt-3 text-[12px] text-red-500">
                    Digite uma data valida.
                  </Text>
                ) : null}

                <View className="mt-4 rounded-[20px] bg-[#F2FFF8] px-4 py-3">
                  <Text style={fonts.medium} className="text-[13px] leading-5 text-[#4B675E]">
                    {draftSummary}
                  </Text>
                </View>

                <View className="mt-4 flex-row gap-3">
                  <Pressable
                    onPress={handleCancelEdit}
                    disabled={isUpdating}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar edicao"
                    className="h-[52px] flex-1 items-center justify-center rounded-[18px] border border-[#E1E5EB] bg-white">
                    <Text style={fonts.bold} className="text-[14px] text-[#747887]">
                      Cancelar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    disabled={!canSave}
                    accessibilityRole="button"
                    accessibilityLabel="Salvar lembrete"
                    className={`h-[52px] flex-1 flex-row items-center justify-center rounded-[18px] ${
                      canSave ? 'bg-[#128C7E]' : 'bg-[#DCE2E8]'
                    }`}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Check size={16} color={canSave ? '#FFFFFF' : '#8B8D97'} />
                    )}
                    <Text
                      style={fonts.black}
                      className={`ml-2 text-[14px] ${canSave ? 'text-white' : 'text-[#8B8D97]'}`}>
                      Salvar
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <View className="rounded-[24px] bg-[#F7F8FB] p-4">
                  <FieldLabel
                    icon={<MessageSquareText size={15} color="#6135E8" />}
                    label="Mensagem"
                  />
                  <Text style={fonts.black} className="text-[20px] leading-7 text-[#24252C]">
                    {message}
                  </Text>

                  <View className="my-4 h-px bg-[#E6E8EE]" />

                  <View className="flex-row gap-4">
                    <InfoItem
                      icon={<CalendarDays size={15} color="#128C7E" />}
                      label="Quando"
                      value={currentSchedule}
                    />
                    <InfoItem
                      icon={<Clock3 size={15} color="#6135E8" />}
                      label="Horario"
                      value={time}
                    />
                  </View>
                </View>

                <View className="mt-4 gap-3">
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Editar lembrete"
                    className="h-14 flex-row items-center justify-center rounded-[20px] bg-[#128C7E]">
                    <Pencil size={16} color="#FFFFFF" />
                    <Text style={fonts.black} className="ml-2 text-[15px] text-white">
                      Editar lembrete
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={onDelete}
                    accessibilityRole="button"
                    accessibilityLabel="Excluir lembrete"
                    className="h-[52px] flex-row items-center justify-center rounded-[20px] bg-red-50">
                    <Trash2 size={16} color="#E11D48" />
                    <Text style={fonts.bold} className="ml-2 text-[14px] text-red-600">
                      Excluir
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const AcaoModal = React.memo(AcaoModalComponent);
