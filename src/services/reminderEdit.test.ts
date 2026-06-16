import {
  buildReminderCreatePayload,
  buildReminderUpdatePayload,
  buildCalendarMonth,
  formatInputDateLong,
  formatReminderDateInput,
  formatReminderSchedule,
  formatReminderTimeInput,
  getCalendarMonthTitle,
  getQuickDateOptions,
  getInputDateWeekdayLabel,
  inputDateToDate,
  inputDateToIsoDate,
  isReminderTimeValid,
} from './reminderEdit';

const maskedTime = formatReminderTimeInput('1830');
if (maskedTime !== '18:30') {
  throw new Error(`Expected masked time 18:30, got ${maskedTime}`);
}

if (!isReminderTimeValid('23:59')) {
  throw new Error('Expected 23:59 to be valid');
}

if (isReminderTimeValid('24:00')) {
  throw new Error('Expected 24:00 to be invalid');
}

const maskedDate = formatReminderDateInput('16062026');
if (maskedDate !== '16/06/2026') {
  throw new Error(`Expected masked date 16/06/2026, got ${maskedDate}`);
}

const isoDate = inputDateToIsoDate('16/06/2026');
if (isoDate !== '2026-06-16') {
  throw new Error(`Expected ISO date 2026-06-16, got ${isoDate}`);
}

if (inputDateToIsoDate('31/02/2026') !== null) {
  throw new Error('Expected invalid date to return null');
}

const localDate = inputDateToDate('25/06/2026');
if (!localDate) {
  throw new Error('Expected 25/06/2026 to become a local Date');
}

if (localDate.getFullYear() !== 2026 || localDate.getMonth() !== 5 || localDate.getDate() !== 25) {
  throw new Error(`Expected local date 25/06/2026, got ${localDate.toISOString()}`);
}

const weekdayLabel = getInputDateWeekdayLabel('25/06/2026');
if (weekdayLabel !== 'Qui') {
  throw new Error(`Expected weekday label Qui for 25/06/2026, got ${weekdayLabel}`);
}

const longDate = formatInputDateLong('25/06/2026');
if (longDate !== 'quinta-feira, 25 de junho') {
  throw new Error(`Expected long selected date, got ${longDate}`);
}

const quickDates = getQuickDateOptions(new Date(2026, 5, 16));
if (quickDates.length !== 7) {
  throw new Error(`Expected 7 quick date options, got ${quickDates.length}`);
}

if (quickDates[0].label !== 'Hoje' || quickDates[0].inputDate !== '16/06/2026') {
  throw new Error(`Expected first quick date to be Hoje 16/06/2026, got ${quickDates[0].label}`);
}

if (quickDates[1].label !== 'Amanha' || quickDates[1].inputDate !== '17/06/2026') {
  throw new Error(`Expected second quick date to be Amanha 17/06/2026, got ${quickDates[1].label}`);
}

if (quickDates[6].inputDate !== '22/06/2026') {
  throw new Error(`Expected seventh quick date to be 22/06/2026, got ${quickDates[6].inputDate}`);
}

if (quickDates[6].weekdayLabel !== 'Seg') {
  throw new Error(`Expected seventh quick date weekday Seg, got ${quickDates[6].weekdayLabel}`);
}

const calendarTitle = getCalendarMonthTitle(new Date(2026, 5, 1));
if (calendarTitle !== 'junho 2026') {
  throw new Error(`Expected calendar title junho 2026, got ${calendarTitle}`);
}

const calendarDays = buildCalendarMonth(new Date(2026, 5, 1), new Date(2026, 5, 16));
if (calendarDays.length !== 42) {
  throw new Error(`Expected 42 calendar cells, got ${calendarDays.length}`);
}

const june25 = calendarDays.find((day) => day.inputDate === '25/06/2026');
if (!june25 || june25.weekdayLabel !== 'Qui') {
  throw new Error(`Expected 25/06/2026 to be Qui, got ${june25?.weekdayLabel}`);
}

const june15 = calendarDays.find((day) => day.inputDate === '15/06/2026');
if (!june15?.isPast) {
  throw new Error('Expected 15/06/2026 to be blocked as past');
}

const payload = buildReminderUpdatePayload({
  numero: '5521999999999',
  date: '2099-01-01',
  message: '  beber agua  ',
  time: '08:00',
});

if (payload.numero !== '5521999999999') {
  throw new Error('Expected numero to be preserved');
}

if (payload.date !== '2099-01-01') {
  throw new Error(`Expected date to be preserved, got ${payload.date}`);
}

if (payload.time !== '08:00') {
  throw new Error(`Expected time to be preserved, got ${payload.time}`);
}

if (payload.message !== 'beber agua') {
  throw new Error(`Expected normalized update message, got ${payload.message}`);
}

const dailyPayload = buildReminderCreatePayload({
  numero: '5521999999999',
  repeatType: 'daily',
  message: '  tomar agua  ',
  time: '09:00',
});

if (dailyPayload.type !== 'daily') {
  throw new Error(`Expected daily payload type, got ${dailyPayload.type}`);
}

if ('date' in dailyPayload) {
  throw new Error('Expected daily payload without date');
}

const weeklyPayload = buildReminderCreatePayload({
  numero: '5521999999999',
  repeatType: 'weekly',
  message: 'revisar tarefas',
  time: '07:15',
  weekday: 2,
});

if (weeklyPayload.weekday !== 2) {
  throw new Error(`Expected weekly weekday 2, got ${weeklyPayload.weekday}`);
}

const weeklySummary = formatReminderSchedule({
  type: 'weekly',
  weekday: 2,
  time: '07:15',
});

if (weeklySummary !== 'Toda quarta as 07:15') {
  throw new Error(`Expected weekly summary, got ${weeklySummary}`);
}
