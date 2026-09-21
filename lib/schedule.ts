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
export const TICKET_PRICE = '23,000\uc6d0';

/** How many upcoming Saturdays stay open for booking at once (~1 month). */
const SCHEDULE_WEEKS_AHEAD = 4;

const SESSION_TEMPLATE = [
  { label: '\uc138\uc158 1', time: '18:00-19:30' },
  { label: '\uc138\uc158 2', time: '20:00-21:30' },
] as const;

/**
 * Returns today's date as a YYYY-MM-DD string in the Asia/Seoul timezone,
 * matching the `id` format used by ticketDates entries.
 */
export function getTodayIsoDate(referenceDate: Date = new Date()): string {
  return referenceDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function addDaysToIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getIsoWeekday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function formatKoreanDateLabel(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}\uc6d4 ${d}\uc77c`;
}

function buildTicketDate(iso: string): TicketDate {
  return {
    id: iso,
    label: formatKoreanDateLabel(iso),
    day: '\ud1a0',
    sessions: SESSION_TEMPLATE.map((session) => ({
      id: `${iso}-${session.time.slice(0, 2)}00`,
      label: session.label,
      time: session.time,
      booked: 0,
    })),
  };
}

/**
 * Generates the next `weeksAhead` Saturday session slots starting from the
 * next upcoming Saturday (today counts if it's a Saturday). This is the
 * rolling booking calendar: as soon as a Saturday passes, it drops out of
 * this list on the next page load and the next Saturday automatically
 * appears in its place, always keeping the same number of weeks open — no
 * manual date entry needed. Booked counts start at 0 here; the real
 * numbers come live from /api/session-counts (see getSessionBooked in
 * app/page.tsx).
 */
export function generateTicketDates(
  referenceDate: Date = new Date(),
  weeksAhead: number = SCHEDULE_WEEKS_AHEAD,
): TicketDate[] {
  const todayIso = getTodayIsoDate(referenceDate);

  let cursor = todayIso;
  while (getIsoWeekday(cursor) !== 6) {
    cursor = addDaysToIso(cursor, 1);
  }

  const dates: TicketDate[] = [];
  for (let i = 0; i < weeksAhead; i += 1) {
    dates.push(buildTicketDate(cursor));
    cursor = addDaysToIso(cursor, 7);
  }
  return dates;
}

/**
 * The live rolling schedule window (ascending, soonest first), regenerated
 * on every page load so it always reflects "today" in KST.
 */
export const ticketDates: TicketDate[] = generateTicketDates();

/**
 * A date is "past" the day after it occurs (KST) — the event day itself
 * still counts as upcoming/bookable.
 */
export function isDatePast(dateId: string, referenceDate: Date = new Date()): boolean {
  return dateId < getTodayIsoDate(referenceDate);
}

/**
 * Ticket dates that haven't passed yet, sorted with the nearest (soonest)
 * date first for display in the booking UI.
 */
export function getUpcomingTicketDates(referenceDate: Date = new Date()): TicketDate[] {
  const todayIso = getTodayIsoDate(referenceDate);
  return ticketDates
    .filter((date) => date.id >= todayIso)
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function buildSessionLabel(
  date: Pick<TicketDate, 'label' | 'day'>,
  session: Pick<TicketSession, 'label' | 'time'>
) {
  return `${date.label} ${date.day} ${session.label} ${session.time}`;
}
