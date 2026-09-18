'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SITE_MAP, normalizeSiteMap, type SiteSection } from '../../lib/site-map';
import { DEFAULT_FAQ_ITEMS, normalizeFaqItems, type FaqItem } from '../../lib/faq';
import { ticketDates, buildSessionLabel, type TicketDate, type TicketSession } from '../../lib/schedule';
import { getHolidayName } from '../../lib/holidays';
import { DEFAULT_CONTENT, type ContentData } from '../../lib/content';

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
type AdminTab = 'reservations' | 'sitemap' | 'faq' | 'reports';

type Reservation = {
  id: number;
  name: string;
  phone: string;
  instagram: string;
  gender: string;
  session: string;
  level: string;
  party: string;
  companion_name: string;
  pass_type: string;
  status: ReservationStatus;
  source: string;
  created_at: string;
};

const statusLabels: Record<ReservationStatus, string> = {
  pending: '접수',
  confirmed: '확정',
  cancelled: '취소',
};

const statusOrder: ReservationStatus[] = ['pending', 'confirmed', 'cancelled'];

const adminTabs: { id: AdminTab; eyebrow: string; label: string; summary: string }[] = [
  {
    id: 'reservations',
    eyebrow: 'Reservation Desk',
    label: '예약관리 대시보드',
    summary: '예약 접수 현황과 참가자 상태를 확인합니다.',
  },
  {
    id: 'sitemap',
    eyebrow: 'Sitemap Editor',
    label: '사이트맵 관리',
    summary: '사이트 메뉴명과 섹션 노출 여부를 관리합니다.',
  },
  {
    id: 'faq',
    eyebrow: 'FAQ Editor',
    label: 'FAQ 관리',
    summary: '자주 묻는 질문을 추가·수정·관리합니다.',
  },
  {
    id: 'reports',
    eyebrow: 'Report Analysis',
    label: '리포트 분석 보고',
    summary: '예약 데이터와 브랜드 운영 기준을 요약합니다.',
  },
];

const passLabels: Record<string, string> = {
  single: '원데이',
  monthly: '월간',
};

const colorSystem = [
  ['Pantone Black 6 C', 'Court Black', '#101820', '헤더, 푸터, 관리자 화면의 기본 배경'],
  ['Pantone 2627 C', 'Deep Court Purple', '#3C1053', '섹션 배경과 카드의 깊은 보랏빛 면'],
  ['Pantone 2685 C', 'Royal Violet', '#330072', '코트 그림자, 오버레이, 공간감'],
  ['Pantone 806 C', 'Neon Magenta', '#FF0090', '바닥 반사광과 하이라이트 라인'],
  ['Pantone 1788 C', 'Signal Red', '#EE2737', '예약 CTA, 조명 포인트, 핵심 강조'],
  ['Pantone 663 C', 'Mist White', '#E5DCEA', '본문 텍스트와 밝은 섹션 바탕'],
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [siteMap, setSiteMap] = useState<SiteSection[]>(DEFAULT_SITE_MAP);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [siteMapMessage, setSiteMapMessage] = useState('');
  const [faqItems, setFaqItems] = useState<FaqItem[]>(DEFAULT_FAQ_ITEMS);
  const [faqMessage, setFaqMessage] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => (ticketDates[0]?.id ?? '2026-09-01').slice(0, 7));
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(0);
  const [editViewport, setEditViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [blockHolidays, setBlockHolidays] = useState(DEFAULT_CONTENT.bookingSettings.blockHolidays);
  const [bookingSettingsMessage, setBookingSettingsMessage] = useState('');
  const editFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const updateNow = () => setNowTimestamp(Date.now());
    const initialTick = window.setTimeout(updateNow, 0);
    const timer = window.setInterval(updateNow, 60_000);

    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, []);

  function sendEditAuth() {
    editFrameRef.current?.contentWindow?.postMessage(
      { type: 'CM_ADMIN_AUTH', password },
      window.location.origin
    );
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'CM_EDIT_READY') {
        sendEditAuth();
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [password]);

  type CalendarCell = { iso: string; day: number };

  const calendarWeeks = useMemo<CalendarCell[][]>(() => {
    const [yearStr, monthStr] = calendarMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeekday = firstOfMonth.getDay();

    const cells: CalendarCell[] = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ iso: '', day: 0 });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
      cells.push({ iso, day });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ iso: '', day: 0 });
    }

    const weeks: CalendarCell[][] = [];

    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return weeks;
  }, [calendarMonth]);

  const selectedDate = useMemo<TicketDate | null>(
    () => ticketDates.find((date) => date.id === selectedDateId) ?? null,
    [selectedDateId]
  );

  const selectedSession = useMemo<TicketSession | null>(
    () => selectedDate?.sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedDate, selectedSessionId]
  );

  const selectedScheduleLabel = useMemo(
    () => (selectedDate && selectedSession ? buildSessionLabel(selectedDate, selectedSession) : null),
    [selectedDate, selectedSession]
  );

  const scheduleReservations = useMemo(
    () =>
      selectedScheduleLabel
        ? reservations.filter((reservation) => reservation.session === selectedScheduleLabel)
        : [],
    [reservations, selectedScheduleLabel]
  );

  const sessionReservationCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const reservation of reservations) {
      if (reservation.status === 'cancelled') continue;
      counts.set(reservation.session, (counts.get(reservation.session) ?? 0) + 1);
    }

    return counts;
  }, [reservations]);

  function getSessionParticipantCount(date: TicketDate, session: TicketSession) {
    return sessionReservationCounts.get(buildSessionLabel(date, session)) ?? 0;
  }

  function getSessionEndTime(date: TicketDate, session: TicketSession) {
    const endPart = session.time.split('-')[1]?.trim() ?? '';
    const [hourStr, minuteStr] = endPart.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const end = new Date(`${date.id}T00:00:00`);

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      end.setHours(hour, minute, 0, 0);
    }

    return end;
  }

  function isSessionPast(date: TicketDate, session: TicketSession) {
    return nowTimestamp > 0 && getSessionEndTime(date, session).getTime() < nowTimestamp;
  }

  function shiftCalendarMonth(delta: number) {
    const [yearStr, monthStr] = calendarMonth.split('-');
    const next = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  }

  function handleSelectCalendarDate(iso: string) {
    if (selectedDateId === iso) {
      setSelectedDateId(null);
      setSelectedSessionId(null);
      return;
    }

    setSelectedDateId(iso);
    setSelectedSessionId(null);
  }

  function handleSelectCalendarSession(sessionId: string) {
    setSelectedSessionId((current) => (current === sessionId ? null : sessionId));
  }

  const stats = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        label: statusLabels[status],
        count: reservations.filter((reservation) => reservation.status === status).length,
      })),
    [reservations]
  );

  const report = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter((reservation) => reservation.status === 'confirmed').length;
    const pending = reservations.filter((reservation) => reservation.status === 'pending').length;
    const cancelled = reservations.filter((reservation) => reservation.status === 'cancelled').length;
    const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;
    const cancelledRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

    const buildBreakdown = (key: keyof Pick<Reservation, 'pass_type' | 'level' | 'party' | 'session'>) => {
      const counts = reservations.reduce<Record<string, number>>((acc, reservation) => {
        const value = String(reservation[key] || '미입력');
        acc[value] = (acc[value] ?? 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts)
        .map(([label, count]) => ({
          label: key === 'pass_type' ? passLabels[label] ?? label : label,
          count,
          rate: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      total,
      confirmed,
      pending,
      cancelled,
      confirmedRate,
      pendingRate,
      cancelledRate,
      passBreakdown: buildBreakdown('pass_type'),
      levelBreakdown: buildBreakdown('level'),
      partyBreakdown: buildBreakdown('party'),
      sessionBreakdown: buildBreakdown('session').slice(0, 5),
    };
  }, [reservations]);

  async function loadReservations(nextPassword = password) {
    setLoading(true);
    setMessage('');
    setSiteMapMessage('');
    setFaqMessage('');

    try {
      const [reservationsResponse, siteMapResponse, faqResponse, contentResponse] = await Promise.all([
        fetch('/api/reservations', {
          headers: { 'x-admin-password': nextPassword },
        }),
        fetch('/api/site-map'),
        fetch('/api/faq'),
        fetch('/api/content'),
      ]);
      const data = (await reservationsResponse.json()) as { reservations?: Reservation[]; error?: string };
      const siteMapData = (await siteMapResponse.json()) as { sections?: SiteSection[]; error?: string };
      const faqData = (await faqResponse.json()) as { items?: FaqItem[]; error?: string };
      const contentData = (await contentResponse.json()) as { content?: Partial<ContentData>; error?: string };

      if (!reservationsResponse.ok) {
        throw new Error(data.error ?? '예약자 목록을 불러오지 못했습니다.');
      }

      if (!siteMapResponse.ok) {
        throw new Error(siteMapData.error ?? '사이트맵 설정을 불러오지 못했습니다.');
      }

      if (!faqResponse.ok) {
        throw new Error(faqData.error ?? 'FAQ 설정을 불러오지 못했습니다.');
      }

      setReservations(data.reservations ?? []);
      setSiteMap(normalizeSiteMap(siteMapData.sections));
      setFaqItems(normalizeFaqItems(faqData.items));
      if (contentResponse.ok && contentData.content?.bookingSettings) {
        setBlockHolidays(contentData.content.bookingSettings.blockHolidays);
      }
      setAuthorized(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약자 목록을 불러오지 못했습니다.');
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }

  function updateSiteSection(id: string, field: 'label' | 'title' | 'description' | 'visible', value: string | boolean) {
    setSiteMap((current) =>
      current.map((section) => (section.id === id ? { ...section, [field]: value } : section))
    );
  }

  async function saveBookingSettings(nextBlockHolidays: boolean) {
    const previous = blockHolidays;
    setBlockHolidays(nextBlockHolidays);
    setBookingSettingsMessage('');

    try {
      const response = await fetch('/api/content', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ key: 'bookingSettings', value: { blockHolidays: nextBlockHolidays } }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? '예약 설정을 저장하지 못했습니다.');
      }

      setBookingSettingsMessage(
        nextBlockHolidays ? '공휴일 예약을 차단합니다.' : '공휴일 예약을 허용합니다.'
      );
    } catch (error) {
      setBlockHolidays(previous);
      setBookingSettingsMessage(error instanceof Error ? error.message : '예약 설정을 저장하지 못했습니다.');
    }
  }

  async function saveSiteMap() {
    setLoading(true);
    setSiteMapMessage('');

    try {
      const response = await fetch('/api/site-map', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ sections: siteMap }),
      });
      const data = (await response.json()) as { sections?: SiteSection[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? '사이트맵 설정을 저장하지 못했습니다.');
      }

      setSiteMap(normalizeSiteMap(data.sections));
      setSiteMapMessage('사이트맵 설정이 저장되었습니다.');
    } catch (error) {
      setSiteMapMessage(error instanceof Error ? error.message : '사이트맵 설정을 저장하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function updateFaqField(id: string, field: 'question' | 'note', value: string) {
    setFaqItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function updateFaqVisible(id: string, visible: boolean) {
    setFaqItems((current) => current.map((item) => (item.id === id ? { ...item, visible } : item)));
  }

  function updateFaqAnswerText(id: string, text: string) {
    const answer = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setFaqItems((current) => current.map((item) => (item.id === id ? { ...item, answer } : item)));
  }

  function updateFaqBulletsText(id: string, text: string) {
    const bullets = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setFaqItems((current) =>
      current.map((item) => (item.id === id ? { ...item, bullets: bullets.length ? bullets : undefined } : item))
    );
  }

  function updateFaqTableHead(id: string, index: 0 | 1, value: string) {
    setFaqItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const head: [string, string] = item.table
          ? [item.table.head[0], item.table.head[1]]
          : ['', ''];
        head[index] = value;

        return { ...item, table: { head, rows: item.table?.rows ?? [] } };
      })
    );
  }

  function updateFaqTableRowsText(id: string, text: string) {
    const rows: [string, string][] = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [left, ...rest] = line.split('|');

        return [left?.trim() ?? '', rest.join('|').trim()] as [string, string];
      });

    setFaqItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const head = item.table?.head ?? ['', ''];

        return { ...item, table: { head, rows } };
      })
    );
  }

  function removeFaqTable(id: string) {
    setFaqItems((current) =>
      current.map((item) => (item.id === id ? { ...item, table: undefined } : item))
    );
  }

  function addFaqItem() {
    const id = `faq-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    setFaqItems((current) => [
      ...current,
      {
        id,
        question: '새 질문을 입력하세요',
        answer: [],
        visible: true,
        order: current.length + 1,
      },
    ]);
  }

  function removeFaqItem(id: string) {
    setFaqItems((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== id)));
  }

  function moveFaqItem(id: string, direction: -1 | 1) {
    setFaqItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const targetIndex = index + direction;

      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next;
    });
  }

  async function saveFaq() {
    setLoading(true);
    setFaqMessage('');

    try {
      const response = await fetch('/api/faq', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ items: faqItems }),
      });
      const data = (await response.json()) as { items?: FaqItem[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'FAQ 설정을 저장하지 못했습니다.');
      }

      setFaqItems(normalizeFaqItems(data.items));
      setFaqMessage('FAQ 설정이 저장되었습니다.');
    } catch (error) {
      setFaqMessage(error instanceof Error ? error.message : 'FAQ 설정을 저장하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadReservations(password);
  }

  async function updateStatus(id: number, status: ReservationStatus) {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id, status }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? '예약 상태를 변경하지 못했습니다.');
      }

      setReservations((current) =>
        current.map((reservation) => (reservation.id === id ? { ...reservation, status } : reservation))
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약 상태를 변경하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand-mark" href="/" aria-label="Circuitmate home">
          CIRCUITMATE
        </a>
        <a className="secondary-button" href="/">
          사이트로 돌아가기
        </a>
      </header>

      {!authorized ? (
        <section className="admin-auth-card" aria-labelledby="admin-login-title">
          <p className="eyebrow">Admin Only</p>
          <h1 id="admin-login-title">예약자 관리</h1>
          <p>관리자 비밀번호를 입력하면 예약 접수 현황과 참가자 상태를 확인할 수 있습니다.</p>
          <form onSubmit={handleLogin}>
            <label>
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="관리자 비밀번호"
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? '확인 중' : '접근하기'}
            </button>
          </form>
          {message && <p className="error-message">{message}</p>}
        </section>
      ) : (
        <section className="admin-dashboard" aria-labelledby="admin-dashboard-title">
          <div className="admin-title-row">
            <div>
              <p className="eyebrow">{adminTabs.find((tab) => tab.id === activeTab)?.eyebrow}</p>
              <h1 id="admin-dashboard-title">예약자 관리</h1>
            </div>
            <button type="button" onClick={() => loadReservations()} disabled={loading}>
              새로고침
            </button>
          </div>

          <nav className="admin-category-bar" aria-label="관리자 카테고리">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <small>{tab.summary}</small>
              </button>
            ))}
          </nav>

          {activeTab === 'reservations' && (
            <section className="admin-panel" aria-labelledby="reservation-dashboard-title">
              <div className="admin-section-head">
                <div>
                  <p className="eyebrow">Reservation Desk</p>
                  <h2 id="reservation-dashboard-title">예약관리 대시보드</h2>
                </div>
              </div>

              <div className="admin-stats">
                <article>
                  <span>전체</span>
                  <strong>{reservations.length}</strong>
                </article>
                {stats.map((item) => (
                  <article key={item.status}>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </article>
                ))}
              </div>

              <div className="admin-calendar">
                <div className="admin-calendar-head">
                  <button type="button" onClick={() => shiftCalendarMonth(-1)} aria-label="이전 달">
                    ‹
                  </button>
                  <strong>
                    {calendarMonth.slice(0, 4)}년 {Number(calendarMonth.slice(5, 7))}월
                  </strong>
                  <button type="button" onClick={() => shiftCalendarMonth(1)} aria-label="다음 달">
                    ›
                  </button>
                </div>

                <div className="admin-calendar-weekdays">
                  {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="admin-calendar-grid">
                  {calendarWeeks.map((week, weekIndex) => (
                    <div className="admin-calendar-row" key={weekIndex}>
                      {week.map((cell, cellIndex) => {
                        if (!cell.iso) {
                          return <div className="admin-calendar-cell is-empty" key={`empty-${weekIndex}-${cellIndex}`} />;
                        }

                        const ticketDate = ticketDates.find((date) => date.id === cell.iso);
                        const holidayName = getHolidayName(cell.iso);
                        const totalBooked = ticketDate
                          ? ticketDate.sessions.reduce(
                              (sum, session) => sum + getSessionParticipantCount(ticketDate, session),
                              0
                            )
                          : 0;
                        const allSessionsClosed = ticketDate
                          ? ticketDate.sessions.every((session) => isSessionPast(ticketDate, session))
                          : false;
                        const isSelected = selectedDateId === cell.iso;
                        const cellClassNames = ['admin-calendar-cell'];
                        if (ticketDate) cellClassNames.push('has-session');
                        if (holidayName) cellClassNames.push('is-holiday');
                        if (isSelected) cellClassNames.push('is-selected');
                        if (allSessionsClosed) cellClassNames.push('is-past');

                        return (
                          <button
                            type="button"
                            key={cell.iso}
                            className={cellClassNames.join(' ')}
                            onClick={() => ticketDate && handleSelectCalendarDate(cell.iso)}
                            disabled={!ticketDate}
                          >
                            <span className="admin-calendar-day">{cell.day}</span>
                            {holidayName && <span className="admin-calendar-holiday">{holidayName}</span>}
                            {ticketDate && (
                              <span className="admin-calendar-session-badge">
                                {allSessionsClosed
                                  ? '마감'
                                  : `세션 ${ticketDate.sessions.length}개 · ${totalBooked}명`}
                              </span>
                            )}
                            {ticketDate && holidayName && (
                              <span className="admin-calendar-conflict">⚠ 공휴일 겹침</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <p className="admin-calendar-legend">
                  <span className="legend-dot has-session" /> 세션 있음
                  <span className="legend-dot is-holiday" /> 공휴일
                  <span className="legend-dot is-empty" /> 세션 없음
                </p>

                <div className="admin-holiday-settings">
                  <label className="switch-row">
                    <input
                      type="checkbox"
                      checked={blockHolidays}
                      onChange={(event) => saveBookingSettings(event.target.checked)}
                    />
                    <span>공휴일 예약 차단 {blockHolidays ? '(사용 중 — 공휴일엔 예약 불가)' : '(꺼짐 — 공휴일에도 예약 가능)'}</span>
                  </label>
                  {bookingSettingsMessage && <p className="admin-holiday-settings-message">{bookingSettingsMessage}</p>}
                </div>
              </div>

              {selectedDate && (
                <div className="admin-calendar-sessions">
                  <div className="admin-calendar-sessions-head">
                    <strong>
                      {selectedDate.label} {selectedDate.day}
                    </strong>
                    <button
                      type="button"
                      className="admin-calendar-clear"
                      onClick={() => handleSelectCalendarDate(selectedDate.id)}
                    >
                      선택 해제
                    </button>
                  </div>
                  {getHolidayName(selectedDate.id) && (
                    <p className="admin-calendar-conflict-note">
                      ⚠ {getHolidayName(selectedDate.id)}과 겹치는 일정입니다. 기존 참가자 확인 후 일정 조정 여부를 결정해주세요.
                    </p>
                  )}
                  <div className="admin-calendar-session-list">
                    {selectedDate.sessions.map((session) => {
                      const closed = isSessionPast(selectedDate, session);
                      const participantCount = getSessionParticipantCount(selectedDate, session);
                      const buttonClassNames = [selectedSessionId === session.id ? 'active' : ''];
                      if (closed) buttonClassNames.push('is-past');

                      return (
                        <button
                          type="button"
                          key={session.id}
                          className={buttonClassNames.filter(Boolean).join(' ')}
                          onClick={() => handleSelectCalendarSession(session.id)}
                        >
                          <span>
                            {session.label} · {session.time}
                          </span>
                          <small>{closed ? '마감' : `${participantCount}명 신청`}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="reservation-table-wrap">
                <div className="reservation-table-head">
                  <h3>
                    {selectedScheduleLabel
                      ? `${selectedScheduleLabel} 참가자 (${scheduleReservations.length}명)`
                      : `전체 예약 (${reservations.length}건)`}
                  </h3>
                </div>
                {(() => {
                  const rows = selectedScheduleLabel ? scheduleReservations : reservations;

                  if (rows.length === 0) {
                    return (
                      <div className="admin-empty">
                        <h2>
                          {selectedScheduleLabel
                            ? '이 일정에 접수된 참가자가 없습니다.'
                            : '아직 접수된 예약이 없습니다.'}
                        </h2>
                        <p>
                          {selectedScheduleLabel
                            ? '다른 일정을 선택하거나 캘린더에서 다시 확인해보세요.'
                            : '홈페이지 예약 폼으로 신청이 들어오면 이곳에 최신순으로 표시됩니다.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <table className="reservation-table">
                      <thead>
                        <tr>
                          <th>상태</th>
                          <th>예약자</th>
                          <th>연락처</th>
                          <th>인스타</th>
                          <th>성별</th>
                          {!selectedScheduleLabel && <th>일정</th>}
                          <th>패스</th>
                          <th>수준</th>
                          <th>유형</th>
                          <th>접수일</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((reservation) => (
                          <tr key={reservation.id}>
                            <td>
                              <span className={`status-pill ${reservation.status}`}>
                                {statusLabels[reservation.status]}
                              </span>
                            </td>
                            <td>{reservation.name}</td>
                            <td>{reservation.phone}</td>
                            <td>{reservation.instagram || '-'}</td>
                            <td>{reservation.gender || '-'}</td>
                            {!selectedScheduleLabel && <td>{reservation.session}</td>}
                            <td>{passLabels[reservation.pass_type] ?? reservation.pass_type}</td>
                            <td>{reservation.level || '-'}</td>
                            <td>
                              {reservation.party || '-'}
                              {reservation.companion_name ? ` (${reservation.companion_name})` : ''}
                            </td>
                            <td>{new Date(reservation.created_at).toLocaleString('ko-KR')}</td>
                            <td>
                              <div className="status-actions">
                                {statusOrder.map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    className={reservation.status === status ? 'active' : ''}
                                    onClick={() => updateStatus(reservation.id, status)}
                                    disabled={loading || reservation.status === status}
                                  >
                                    {statusLabels[status]}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </section>
          )}

          {activeTab === 'sitemap' && (
            <section className="admin-panel admin-sitemap" aria-labelledby="admin-sitemap-title">
              <div className="admin-section-head">
                <div>
                  <p className="eyebrow">Sitemap Editor</p>
                  <h2 id="admin-sitemap-title">사이트맵 관리</h2>
                </div>
                <button type="button" onClick={saveSiteMap} disabled={loading}>
                  {loading ? '저장 중' : '변경 저장'}
                </button>
              </div>

              <div className="admin-live-editor">
                <div className="admin-section-head">
                  <div>
                    <p className="eyebrow">Live Editor</p>
                    <h2>실시간 편집 (WYSIWYG)</h2>
                    <p className="admin-live-editor-hint">
                      아래는 실제 사이트 화면입니다. 텍스트를 클릭해 바로 수정한 뒤 다른 곳을 클릭하면 자동으로 저장됩니다.
                    </p>
                  </div>
                  <div className="viewport-toggle" role="group" aria-label="미리보기 화면 크기">
                    <button
                      type="button"
                      className={editViewport === 'desktop' ? 'active' : ''}
                      onClick={() => setEditViewport('desktop')}
                    >
                      데스크탑
                    </button>
                    <button
                      type="button"
                      className={editViewport === 'mobile' ? 'active' : ''}
                      onClick={() => setEditViewport('mobile')}
                    >
                      모바일
                    </button>
                  </div>
                </div>
                <div className={`live-editor-frame-wrap ${editViewport}`}>
                  <iframe
                    ref={editFrameRef}
                    src="/?cm_edit=1"
                    title="서킷메이트 실시간 편집"
                    className="live-editor-frame"
                    onLoad={sendEditAuth}
                  />
                </div>
              </div>

              <div className="sitemap-editor">
                {siteMap.map((section) => (
                  <article key={section.id} className={section.visible ? 'is-visible' : 'is-hidden'}>
                    <div className="sitemap-card-head">
                      <strong>{section.href}</strong>
                      <label className="switch-row">
                        <input
                          type="checkbox"
                          checked={section.visible}
                          onChange={(event) => updateSiteSection(section.id, 'visible', event.target.checked)}
                        />
                        <span>{section.visible ? '노출' : '숨김'}</span>
                      </label>
                    </div>
                    <label>
                      메뉴명
                      <input
                        value={section.label}
                        onChange={(event) => updateSiteSection(section.id, 'label', event.target.value)}
                      />
                    </label>
                    <label>
                      섹션 제목
                      <input
                        value={section.title}
                        onChange={(event) => updateSiteSection(section.id, 'title', event.target.value)}
                      />
                    </label>
                    <label>
                      섹션 설명
                      <textarea
                        value={section.description}
                        onChange={(event) => updateSiteSection(section.id, 'description', event.target.value)}
                        rows={3}
                      />
                    </label>
                  </article>
                ))}
              </div>
              {siteMapMessage && <p className="success-message">{siteMapMessage}</p>}
            </section>
          )}

          {activeTab === 'faq' && (
            <section className="admin-panel admin-sitemap" aria-labelledby="admin-faq-title">
              <div className="admin-section-head">
                <div>
                  <p className="eyebrow">FAQ Editor</p>
                  <h2 id="admin-faq-title">FAQ 관리</h2>
                </div>
                <button type="button" onClick={saveFaq} disabled={loading}>
                  {loading ? '저장 중' : '변경 저장'}
                </button>
              </div>
              <div className="sitemap-editor faq-editor">
                {faqItems.map((item, index) => (
                  <article key={item.id} className={item.visible ? 'is-visible' : 'is-hidden'}>
                    <div className="sitemap-card-head">
                      <strong>{`Q${index + 1}`}</strong>
                      <div className="faq-card-actions">
                        <label className="switch-row">
                          <input
                            type="checkbox"
                            checked={item.visible}
                            onChange={(event) => updateFaqVisible(item.id, event.target.checked)}
                          />
                          <span>{item.visible ? '노출' : '숨김'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => moveFaqItem(item.id, -1)}
                          disabled={index === 0}
                          aria-label="위로 이동"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFaqItem(item.id, 1)}
                          disabled={index === faqItems.length - 1}
                          aria-label="아래로 이동"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(item.id)}
                          disabled={faqItems.length <= 1}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <label>
                      질문
                      <input
                        value={item.question}
                        onChange={(event) => updateFaqField(item.id, 'question', event.target.value)}
                      />
                    </label>
                    <label>
                      답변 (줄마다 한 문단)
                      <textarea
                        value={item.answer.join('\n')}
                        onChange={(event) => updateFaqAnswerText(item.id, event.target.value)}
                        rows={3}
                      />
                    </label>
                    <label>
                      목록 항목 (줄마다 한 항목, 선택)
                      <textarea
                        value={(item.bullets ?? []).join('\n')}
                        onChange={(event) => updateFaqBulletsText(item.id, event.target.value)}
                        rows={3}
                      />
                    </label>
                    <label>
                      참고 문구 (선택)
                      <input
                        value={item.note ?? ''}
                        onChange={(event) => updateFaqField(item.id, 'note', event.target.value)}
                      />
                    </label>
                    <div className="faq-table-editor">
                      <div className="admin-section-head">
                        <span>표 (선택 — 취소/환불 정책 등)</span>
                        {item.table && (
                          <button type="button" onClick={() => removeFaqTable(item.id)}>
                            표 삭제
                          </button>
                        )}
                      </div>
                      <div className="faq-table-head-inputs">
                        <input
                          placeholder="왼쪽 열 제목"
                          value={item.table?.head[0] ?? ''}
                          onChange={(event) => updateFaqTableHead(item.id, 0, event.target.value)}
                        />
                        <input
                          placeholder="오른쪽 열 제목"
                          value={item.table?.head[1] ?? ''}
                          onChange={(event) => updateFaqTableHead(item.id, 1, event.target.value)}
                        />
                      </div>
                      <label>
                        표 내용 (줄마다 &quot;왼쪽 | 오른쪽&quot;)
                        <textarea
                          value={(item.table?.rows ?? []).map(([left, right]) => `${left} | ${right}`).join('\n')}
                          onChange={(event) => updateFaqTableRowsText(item.id, event.target.value)}
                          rows={3}
                        />
                      </label>
                    </div>
                  </article>
                ))}
                <button type="button" className="faq-add-button" onClick={addFaqItem}>
                  + 새 질문 추가
                </button>
              </div>
              {faqMessage && <p className="success-message">{faqMessage}</p>}
            </section>
          )}

          {activeTab === 'reports' && (
            <section className="admin-panel admin-reports" aria-labelledby="admin-reports-title">
              <div className="admin-section-head">
                <div>
                  <p className="eyebrow">Report Analysis</p>
                  <h2 id="admin-reports-title">리포트 분석 보고</h2>
                </div>
              </div>

              <div className="report-grid">
                <article className="report-hero-card">
                  <span>확정 전환율</span>
                  <strong>{report.confirmedRate}%</strong>
                  <p>전체 {report.total}건 중 확정 {report.confirmed}건</p>
                  <div className="report-bar" aria-hidden="true">
                    <i style={{ width: `${report.confirmedRate}%` }} />
                  </div>
                </article>
                <article>
                  <span>접수 대기</span>
                  <strong>{report.pendingRate}%</strong>
                  <p>{report.pending}건이 확인을 기다리고 있습니다.</p>
                </article>
                <article>
                  <span>취소 비율</span>
                  <strong>{report.cancelledRate}%</strong>
                  <p>{report.cancelled}건 취소로 집계됩니다.</p>
                </article>
              </div>

              <div className="report-breakdowns">
                {[
                  ['패스 유형', report.passBreakdown],
                  ['운동 수준', report.levelBreakdown],
                  ['동반 유형', report.partyBreakdown],
                  ['인기 일정', report.sessionBreakdown],
                ].map(([title, items]) => (
                  <article key={title as string}>
                    <h3>{title as string}</h3>
                    {(items as { label: string; count: number; rate: number }[]).length === 0 ? (
                      <p className="report-empty">아직 분석할 예약 데이터가 없습니다.</p>
                    ) : (
                      <div className="report-list">
                        {(items as { label: string; count: number; rate: number }[]).map((item) => (
                          <div key={item.label}>
                            <div>
                              <span>{item.label}</span>
                              <strong>{item.count}건</strong>
                            </div>
                            <div className="report-bar" aria-hidden="true">
                              <i style={{ width: `${item.rate}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <section className="admin-palette" aria-labelledby="admin-palette-title">
                <div className="admin-section-head">
                  <p className="eyebrow">Brand System</p>
                  <h2 id="admin-palette-title">서킷메이트 컬러 팔레트</h2>
                </div>
                <div className="palette-panel" aria-label="서킷메이트 Pantone 컬러 시스템">
                  {colorSystem.map(([pantone, name, hex, usage]) => (
                    <article key={pantone}>
                      <span className="swatch" style={{ backgroundColor: hex }} />
                      <div>
                        <strong>{pantone}</strong>
                        <p>{name}</p>
                        <small>{usage}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}
          {message && <p className="error-message">{message}</p>}
        </section>
      )}
    </main>
  );
}
