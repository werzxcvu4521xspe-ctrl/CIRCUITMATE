export type TicketSession = {
  id: string;
  label: string;
  time: string;
  booked: number;
};

export type TicketDate = {
  id: string;
  label: string;
  day: string;
  sessions: TicketSession[];
};

export const MIN_PARTICIPANTS = 10;
export const MAX_PARTICIPANTS = 20;
export const TICKET_PRICE = '23,000원';

export const ticketDates: TicketDate[] = [
  {
    id: '2026-09-26',
    label: '9월 26일',
    day: '토',
    sessions: [
      { id: '2026-09-26-1800', label: '세션 1', time: '18:00-19:30', booked: 6 },
      { id: '2026-09-26-2000', label: '세션 2', time: '20:00-21:30', booked: 18 },
    ],
  },
  {
    id: '2026-10-03',
    label: '10월 3일',
    day: '토',
    sessions: [
      { id: '2026-10-03-1800', label: '세션 1', time: '18:00-19:30', booked: 4 },
      { id: '2026-10-03-2000', label: '세션 2', time: '20:00-21:30', booked: 10 },
    ],
  },
  {
    id: '2026-10-10',
    label: '10월 10일',
    day: '토',
    sessions: [
      { id: '2026-10-10-1800', label: '세션 1', time: '18:00-19:30', booked: 5 },
      { id: '2026-10-10-2000', label: '세션 2', time: '20:00-21:30', booked: 12 },
    ],
  },
  {
    id: '2026-10-17',
    label: '10월 17일',
    day: '토',
    sessions: [
      { id: '2026-10-17-1800', label: '세션 1', time: '18:00-19:30', booked: 2 },
      { id: '2026-10-17-2000', label: '세션 2', time: '20:00-21:30', booked: 5 },
    ],
  },
];

/**
 * Returns today's date as a YYYY-MM-DD string in the Asia/Seoul timezone,
 * matching the `id` format used by ticketDates entries.
 */
export function getTodayIsoDate(referenceDate: Date = new Date()): string {
  return referenceDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

/**
 * A date is "past" the day after it occurs (KST) — the event day itself
 * still counts as upcoming/bookable.
 */
export function isDatePast(dateId: string, referenceDate: Date = new Date()): boolean {
  return dateId < getTodayIsoDate(referenceDate);
}

/**
 * Ticket dates that haven't passed yet, sorted with the newest (furthest
 * out) date first. Past dates automatically drop off this list as the
 * calendar moves forward — no manual removal needed. New dates still need
 * to be appended to `ticketDates` above as they're scheduled.
 */
export function getUpcomingTicketDates(referenceDate: Date = new Date()): TicketDate[] {
  const todayIso = getTodayIsoDate(referenceDate);
  return ticketDates
    .filter((date) => date.id >= todayIso)
    .slice()
    .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

export function buildSessionLabel(
  date: Pick<TicketDate, 'label' | 'day'>,
  session: Pick<TicketSession, 'label' | 'time'>
) {
  return `${date.label} ${date.day} ${session.label} ${session.time}`;
}
