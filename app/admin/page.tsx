'use client';

import { FormEvent, useMemo, useState } from 'react';
import { DEFAULT_SITE_MAP, normalizeSiteMap, type SiteSection } from '../../lib/site-map';

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
type AdminTab = 'reservations' | 'sitemap' | 'reports';

type Reservation = {
  id: number;
  name: string;
  phone: string;
  session: string;
  level: string;
  party: string;
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

    try {
      const [reservationsResponse, siteMapResponse] = await Promise.all([
        fetch('/api/reservations', {
          headers: { 'x-admin-password': nextPassword },
        }),
        fetch('/api/site-map'),
      ]);
      const data = (await reservationsResponse.json()) as { reservations?: Reservation[]; error?: string };
      const siteMapData = (await siteMapResponse.json()) as { sections?: SiteSection[]; error?: string };

      if (!reservationsResponse.ok) {
        throw new Error(data.error ?? '예약자 목록을 불러오지 못했습니다.');
      }

      if (!siteMapResponse.ok) {
        throw new Error(siteMapData.error ?? '사이트맵 설정을 불러오지 못했습니다.');
      }

      setReservations(data.reservations ?? []);
      setSiteMap(normalizeSiteMap(siteMapData.sections));
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
                        <th>패스</th>
                        <th>수준/유형</th>
                        <th>접수일</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td>
                            <span className={`status-pill ${reservation.status}`}>
                              {statusLabels[reservation.status]}
                            </span>
                          </td>
                          <td>{reservation.name}</td>
                          <td>{reservation.phone}</td>
                          <td>{reservation.session}</td>
                          <td>{passLabels[reservation.pass_type] ?? reservation.pass_type}</td>
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
