'use client';

import { FormEvent, useMemo, useState } from 'react';

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

type Reservation = {
  id: number;
  name: string;
  phone: string;
  session: string;
  level: string;
  party: string;
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

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const stats = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        label: statusLabels[status],
        count: reservations.filter((reservation) => reservation.status === status).length,
      })),
    [reservations]
  );

  async function loadReservations(nextPassword = password) {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reservations', {
        headers: { 'x-admin-password': nextPassword },
      });
      const data = (await response.json()) as { reservations?: Reservation[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? '예약자 목록을 불러오지 못했습니다.');
      }

      setReservations(data.reservations ?? []);
      setAuthorized(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약자 목록을 불러오지 못했습니다.');
      setAuthorized(false);
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
          <span>CM</span>
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
              <p className="eyebrow">Reservation Desk</p>
              <h1 id="admin-dashboard-title">예약자 관리</h1>
            </div>
            <button type="button" onClick={() => loadReservations()} disabled={loading}>
              새로고침
            </button>
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

          <div className="reservation-table-wrap">
            {reservations.length === 0 ? (
              <div className="admin-empty">
                <h2>아직 접수된 예약이 없습니다.</h2>
                <p>홈페이지 예약 폼으로 신청이 들어오면 이곳에 최신순으로 표시됩니다.</p>
              </div>
            ) : (
              <table className="reservation-table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>예약자</th>
                    <th>연락처</th>
                    <th>일정</th>
                    <th>수준/유형</th>
                    <th>접수일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <span className={`status-pill ${reservation.status}`}>{statusLabels[reservation.status]}</span>
                      </td>
                      <td>{reservation.name}</td>
                      <td>{reservation.phone}</td>
                      <td>{reservation.session}</td>
                      <td>
                        {reservation.level} / {reservation.party}
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
            )}
          </div>
          {message && <p className="error-message">{message}</p>}
        </section>
      )}
    </main>
  );
}
