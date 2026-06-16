export type ReminderRepeatType = 'once' | 'daily' | 'weekly';

export type ReminderUpdateInput = {
  numero: string;
  repeatType?: ReminderRepeatType;
  date?: string;
  message: string;
  time: string;
  weekday?: number;
};

export type ReminderUpdatePayload = {
  numero: string;
  type?: ReminderRepeatType;
  date?: string;
  time: string;
  message: string;
  weekday?: number;
};

export type ReminderCreateInput = ReminderUpdateInput;
export type ReminderCreatePayload = ReminderUpdatePayload;

export type ReminderScheduleSummaryInput = {
  type?: string;
  date?: string;
  time?: string;
  weekday?: number;
  interval_value?: number;
  interval_unit?: string;
};

export type QuickDateOption = {
  accessibilityLabel: string;
  inputDate: string;
  label: string;
  value: string;
  weekdayLabel: string;
};

export type CalendarDayOption = {
  accessibilityLabel: string;
  day: string;
  inputDate: string;
  isCurrentMonth: boolean;
  isPast: boolean;
  key: string;
  weekdayLabel: string;
};

export const WEEKDAY_OPTIONS = [
  { label: 'Segunda', shortLabel: 'Seg', value: 0 },
  { label: 'Terca', shortLabel: 'Ter', value: 1 },
  { label: 'Quarta', shortLabel: 'Qua', value: 2 },
  { label: 'Quinta', shortLabel: 'Qui', value: 3 },
  { label: 'Sexta', shortLabel: 'Sex', value: 4 },
  { label: 'Sabado', shortLabel: 'Sab', value: 5 },
  { label: 'Domingo', shortLabel: 'Dom', value: 6 },
];

const DATE_SHORT_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DATE_LONG_WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terca-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sabado',
];
const DATE_LONG_MONTHS = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  return normalized;
}

export function formatReminderTimeInput(text: string) {
  const numbers = text.replace(/\D/g, '');

  if (numbers.length <= 2) return numbers;

  return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
}

export function isReminderTimeValid(text: string) {
  if (text.length < 5) return false;

  const [hh, mm] = text.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function formatReminderDateInput(text: string) {
  const numbers = text.replace(/\D/g, '');

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

export function isoDateToInputDate(date?: string) {
  if (!date) return '';

  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return '';

  return `${day}/${month}/${year}`;
}

export function inputDateToIsoDate(date: string) {
  const [day, month, year] = date.split('/');

  if (!day || !month || !year) return null;
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;

  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  const isValid =
    parsed.getFullYear() === Number(year) &&
    parsed.getMonth() === Number(month) - 1 &&
    parsed.getDate() === Number(day);

  if (!isValid) return null;

  return `${year}-${month}-${day}`;
}

export function inputDateToDate(date: string) {
  const [day, month, year] = date.split('/');

  if (!day || !month || !year) return null;
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;

  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  const isValid =
    parsed.getFullYear() === Number(year) &&
    parsed.getMonth() === Number(month) - 1 &&
    parsed.getDate() === Number(day);

  return isValid ? parsed : null;
}

export function isReminderDateValid(date: string) {
  return inputDateToIsoDate(date) !== null;
}

export function dateToInputDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

export function addDaysToInputDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return dateToInputDate(date);
}

export function getQuickDateOptions(baseDate = new Date()): QuickDateOption[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const inputDate = dateToInputDate(date);
    const label =
      index === 0 ? 'Hoje' : index === 1 ? 'Amanha' : DATE_SHORT_WEEKDAYS[date.getDay()];

    return {
      accessibilityLabel: `Selecionar ${DATE_SHORT_WEEKDAYS[date.getDay()]} ${inputDate}`,
      inputDate,
      label,
      value: `${day}/${month}`,
      weekdayLabel: DATE_SHORT_WEEKDAYS[date.getDay()],
    };
  });
}

export function getCalendarMonthTitle(monthDate: Date) {
  return `${DATE_LONG_MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
}

export function buildCalendarMonth(monthDate: Date, minDate = new Date()): CalendarDayOption[] {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  const minimum = startOfDay(minDate);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    const inputDate = dateToInputDate(date);

    return {
      accessibilityLabel: `Selecionar ${DATE_LONG_WEEKDAYS[date.getDay()]}, ${inputDate}`,
      day: String(date.getDate()),
      inputDate,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isPast: startOfDay(date) < minimum,
      key: inputDate,
      weekdayLabel: DATE_SHORT_WEEKDAYS[date.getDay()],
    };
  });
}

export function getInputDateWeekdayLabel(inputDate: string) {
  const date = inputDateToDate(inputDate);
  return date ? DATE_SHORT_WEEKDAYS[date.getDay()] : '';
}

export function formatInputDateLong(inputDate: string) {
  const date = inputDateToDate(inputDate);

  if (!date) return '';

  return `${DATE_LONG_WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${
    DATE_LONG_MONTHS[date.getMonth()]
  }`;
}

export function buildReminderUpdatePayload({
  numero,
  date,
  message,
  time,
  repeatType = 'once',
  weekday,
}: ReminderUpdateInput): ReminderUpdatePayload {
  const payload: ReminderUpdatePayload = {
    numero,
    time,
    message: message.trim(),
  };

  if (repeatType === 'daily') {
    payload.type = 'daily';
    return payload;
  }

  if (repeatType === 'weekly') {
    payload.type = 'weekly';
    payload.weekday = weekday;
    return payload;
  }

  payload.type = 'once';
  payload.date = date;
  return payload;
}

export function buildReminderCreatePayload(input: ReminderCreateInput): ReminderCreatePayload {
  return buildReminderUpdatePayload(input);
}

export function normalizeReminderType(type?: string): ReminderRepeatType {
  if (type === 'daily' || type === 'weekly') return type;

  return 'once';
}

export function formatReminderSchedule({
  type,
  date,
  time,
  weekday,
  interval_value,
  interval_unit,
}: ReminderScheduleSummaryInput) {
  if (type === 'daily') {
    return `Todos os dias as ${time ?? '--:--'}`;
  }

  if (type === 'weekly') {
    const weekdayLabel =
      WEEKDAY_OPTIONS.find((option) => option.value === weekday)?.label.toLowerCase() ?? 'semana';

    return `Toda ${weekdayLabel} as ${time ?? '--:--'}`;
  }

  if (type === 'intervalo' && interval_value && interval_unit) {
    return `A cada ${interval_value} ${interval_unit}`;
  }

  if (date && time) {
    return `${isoDateToInputDate(date)} as ${time}`;
  }

  return 'Horario nao definido';
}
