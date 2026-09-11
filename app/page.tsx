'use client';

import { CSSProperties, FormEvent, MouseEvent, useMemo, useState } from 'react';

const navItems = [
  ['01. Home', '#home'],
  ['02. Brand', '#brand'],
  ['03. Program', '#program'],
  ['04. Recovery', '#recovery'],
  ['05. Awards', '#awards'],
  ['06. Booking', '#booking'],
  ['07. Location & FAQ', '#location'],
];

const highlights = [
  ['1인 참가 비율', '83%'],
  ['부상 방지 전문 코치', 'On-Site'],
  ['클린 바', '100% Non-Alcohol'],
];

const badgeLoop = [
  'Night Court',
  'Circuit Training',
  'Wellness Recovery',
  'Social Relay',
  'Purple Lights',
  'Team Energy',
  'Healthy Exchange',
];

const keyFigures = [
  ['01', '180+', '누적 참가자'],
  ['02', '83%', '1인 참가 비율'],
  ['03', '6', '서킷 종목'],
  ['04', '4', '어워즈 부문'],
  ['05', '150', '분 세션'],
  ['06', '2', '패스 선택지'],
];

const previewCards = [
  ['Warm-up', '관절 가동성, 호흡, 코트 적응'],
  ['Main Circuit', '하체, 코어, 파워, 밸런스 6스테이션'],
  ['Team Relay', '순발력 코트 터치 게임과 대형 이어달리기'],
];

const socialProof = [
  ['@mate_min', '처음 와도 팀 미션 덕분에 어색함이 금방 풀렸어요.'],
  ['@courtjun', '테니스 코트 조명과 서킷 루틴 조합이 진짜 새로웠습니다.'],
  ['@recover_y', '운동 후 리커버리 테이블까지 있어서 모임 완성도가 높았어요.'],
];

const selectedMoments = [
  ['Opening Rally', '웰컴 드링크와 팀 배정이 시작되는 입장 장면'],
  ['Station Heat', '보랏빛 조명 아래 이어지는 6스테이션 전신 서킷'],
  ['Relay Peak', '응원과 기록이 동시에 터지는 팀 이어달리기'],
  ['Recovery Table', '치킨 샌드위치, 과일컵, 전해질 드링크로 마무리'],
];

const timeline = [
  ['19:00', '입장 & 체크인', '컨디션 확인, 팀 배정, 웰컴 드링크'],
  ['19:20', '다이내믹 웜업', '관절 가동성과 코트 적응을 위한 리듬 워밍업'],
  ['19:40', '메인 서킷', '6개 스테이션을 순환하며 전신 트레이닝'],
  ['20:45', '미니게임 & 릴레이', '순발력 코트 터치와 팀 이어달리기'],
  ['21:10', '리커버리 & 어워즈', 'F&B, 수상, 포토 리뷰, 다음 세션 안내'],
];

const stations = [
  {
    key: 'lunge',
    title: '런지 트위스트',
    cue: '무릎은 발끝 방향, 회전은 흉추에서 시작',
    effect: '하체 안정성과 회전 코어를 동시에 깨웁니다.',
  },
  {
    key: 'burpee',
    title: '버피 점프',
    cue: '착지는 부드럽게, 점프 전 복부 긴장 유지',
    effect: '짧은 시간 심박과 전신 파워를 끌어올립니다.',
  },
  {
    key: 'press',
    title: '덤벨 푸쉬 프레스',
    cue: '다리 반동을 어깨까지 연결하고 허리는 꺾지 않기',
    effect: '상체 추진력과 코어 연결성을 강화합니다.',
  },
  {
    key: 'plank',
    title: '플랭크 볼 탭',
    cue: '골반 흔들림을 줄이고 손끝은 가볍게 터치',
    effect: '밸런스와 코어 지구력을 선명하게 만듭니다.',
  },
];

const recoveryItems = [
  ['Protein', '치킨 샌드위치', '훈련 뒤 필요한 단백질을 부담 없이 채우는 시그니처 리커버리 메뉴.'],
  ['Vitamin', '5종 과일컵', '수분감 있는 제철 과일로 비타민과 당을 빠르게 보충합니다.'],
  ['Hydrate', '전해질 드링크', '땀 배출 후 밸런스를 회복하도록 돕는 라이트 드링크.'],
];

const wellnessGuide = [
  ['운동 후 20분', '단백질과 수분을 먼저 채우고 가벼운 대화를 이어갑니다.'],
  ['회복 루틴', '종아리, 둔근, 어깨를 순서대로 풀어 다음날 피로를 줄입니다.'],
  ['매너 가이드', '팀원 속도에 맞추고, 서로의 기록보다 완주를 먼저 응원합니다.'],
];

const valueStack = [
  ['단발 참여', '이번 주 가능한 회차만 결제'],
  ['손해 제로', '못 나오는 주에는 결제 0원'],
  ['루틴 고정', '월간 패스는 회당 단가 절감'],
  ['유연 운영', '잔여 횟수 이월 또는 스케줄 변경'],
];

const passOptions = [
  {
    value: 'single',
    eyebrow: 'Single Pass',
    title: '원데이 온디맨드 패스',
    price: '39,000원',
    note: '회차별 결제',
    desc: '최소 인원이 모이면 호스트가 세션을 오픈하는 1회성 패스입니다. 가능한 날만 신청하고, 못 나오는 주에는 결제 부담이 없습니다.',
  },
  {
    value: 'monthly',
    eyebrow: 'Optional Monthly Pass',
    title: '핏 인베스트먼트 먼슬리 패스',
    price: '월 정기 패스',
    note: '가격 별도 안내',
    desc: '매주 꾸준히 참석해 갓생 루틴을 고정하고 싶은 참가자를 위한 선택형 구독 패스입니다. 원데이보다 합리적인 회당 단가와 이월/일정 변경 옵션을 제공합니다.',
  },
];

const operationDetails = [
  ['입장 데스크', '참가자 전원에게 팀 컬러 손목 밴드를 배부하고, 혼자 온 참가자도 자연스럽게 해당 컬러 구역으로 이동합니다.'],
  ['서킷 스테이션', '각 스테이션마다 초급 / 중급 / 고급 3단계 난이도 픽토그램 보드를 거치합니다.'],
  ['리커버리 전환', '메인 릴레이 종료 즉시 조명을 앰버-퍼플 톤으로 전환하고, 쿨다운 BGM과 함께 쿨링 물티슈 및 전해질 음료를 지급한 뒤 과일 바를 오픈합니다.'],
];

const awards = [
  ['허슬상', '끝까지 밀어붙인 에너지와 성실한 태도를 기념합니다.'],
  ['베스트 드레서', '코트 조명 아래 가장 선명한 에슬레저 룩을 선정합니다.'],
  ['분위기 메이커', '팀의 긴장을 풀고 모두의 몰입을 끌어올린 참가자에게.'],
  ['챔피언', '미니게임과 릴레이를 종합해 그날의 팀 퍼포먼스를 축하합니다.'],
];

const sessions = ['9월 21일 토 19:00', '9월 28일 토 19:00', '10월 5일 토 19:00'];

const faqs = [
  [
    '운동을 잘 못하거나 체력이 약한데 따라갈 수 있을까요?',
    "절대 무게나 횟수로 경쟁하지 않습니다. 서킷메이트는 '1분 동안 내 호흡에 맞춰 움직이는 자율 인터벌 방식'입니다. 모든 스테이션에 초심자를 위한 대체 동작(스케일링) 가이드와 전문 코치가 상주하므로 부상 걱정 없이 안전하게 자신의 페이스대로 즐기실 수 있습니다.",
  ],
  [
    '혼자 신청해도 어색하거나 겉돌지 않을까요?',
    "참가자의 83%가 혼자 신청합니다. 입장 즉시 컬러 밴드로 5인 1조 팀이 자동 매칭되며, 메인 운동 전 15분간 진행되는 '순발력 미니게임'을 통해 자연스럽게 하이파이브하며 팀원이 됩니다.",
  ],
  [
    '일반적인 친목 모임이나 가벼운 헌팅 포차 분위기인가요?',
    "아닙니다. 서킷메이트는 과도한 음주가 없는 100% 클린 웰니스 스포츠 파티입니다. 분 단위로 설계된 고강도 인터벌 서킷과 팀 릴레이, 신선한 생과일 케이터링 바와 4대 어워즈로 구성되어 '진짜 운동과 건강한 에너지'에 몰입합니다.",
  ],
  [
    '땀 흘리고 화장이 지워져서 사진 찍기 민망할까 봐 걱정돼요.',
    '운동 종료 직후 땀을 식히고 매무새를 정돈할 수 있는 10분간의 리프레시 & 과일 케이터링 타임이 주어집니다. 시상식과 포토타임은 땀방울마저 탄탄하고 감각적으로 연출되는 전용 보랏빛 무드 조명 아래에서 진행됩니다.',
  ],
  [
    '참가비 대비 프로그램 구성이 아깝지 않을까요?',
    '원데이 온디맨드 패스는 가능한 회차만 결제하는 구조라 못 나오는 주의 손해가 없습니다. 꾸준히 루틴을 만들고 싶다면 회당 단가를 낮춘 선택형 월간 패스로 전환할 수 있습니다.',
  ],
];

export default function Home() {
  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [selectedSession, setSelectedSession] = useState(sessions[0]);
  const [bookingSent, setBookingSent] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSending, setBookingSending] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 18 });
  const nextSessionLabel = useMemo(() => selectedSession.split(' ')[0] + ' ' + selectedSession.split(' ')[1], [selectedSession]);

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const isQuickBooking = formData.has('quickName');
    const payload = {
      session: selectedSession,
      name: String(formData.get(isQuickBooking ? 'quickName' : 'name') ?? ''),
      phone: String(formData.get(isQuickBooking ? 'quickPhone' : 'phone') ?? ''),
      level: String(formData.get(isQuickBooking ? 'quickLevel' : 'level') ?? ''),
      party: String(formData.get(isQuickBooking ? 'quickParty' : 'party') ?? ''),
      passType: String(formData.get(isQuickBooking ? 'quickPassType' : 'passType') ?? 'single'),
      source: isQuickBooking ? 'quick' : 'booking',
    };

    setBookingSending(true);
    setBookingError('');
    setBookingSent(false);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? '예약 접수에 실패했습니다.');
      }

      form.reset();
      setBookingSent(true);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : '예약 접수에 실패했습니다.');
    } finally {
      setBookingSending(false);
    }
  }

  function handlePointer(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  return (
    <main
      id="home"
      onMouseMove={handlePointer}
      style={
        {
          '--spotlight-x': `${spotlight.x}%`,
          '--spotlight-y': `${spotlight.y}%`,
        } as CSSProperties
      }
    >
      <header className="site-header">
        <a className="brand-mark" href="#home" aria-label="Circuitmate home">
          <span>CM</span>
          CIRCUITMATE
        </a>
        <nav aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <button className="header-cta" type="button" onClick={() => setBookingOpen(true)}>
          세션 예약
        </button>
      </header>

      <section className="hero section-block">
        <img src="/circuitmate-hero.png" alt="보랏빛 실내 테니스 코트 서킷 트레이닝" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">01. Home</p>
          <h1>CIRCUITMATE</h1>
          <p className="hero-copy">땀 흘린 뒤 찾아오는 가장 건강한 교류</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => setBookingOpen(true)}>
              세션 예약하기
            </button>
            <a className="secondary-button" href="#program">
              프로그램 미리보기
            </a>
          </div>
          <div className="trust-bar" aria-label="서킷메이트 신뢰 지표">
            {highlights.map(([label, value]) => (
              <span key={label}>
                <strong>{value}</strong>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="ticker-section" aria-label="서킷메이트 핵심 무드">
        <div className="ticker-track">
          {[...badgeLoop, ...badgeLoop].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <button className="floating-cta" type="button" onClick={() => setBookingOpen(true)}>
        예약하기
      </button>

      <section className="section highlight-section" aria-label="세션 하이라이트">
        <div className="section-heading compact">
          <p className="eyebrow">1.2 Session Highlight</p>
          <h2>안전하고 깨끗한 웰니스 스포츠 파티라는 약속</h2>
        </div>
        <div className="metric-grid">
          {highlights.map(([value, label]) => (
            <article key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section figures-section">
        <div className="section-heading compact">
          <p className="eyebrow">Key Figures</p>
          <h2>한 번의 밤을 숫자로 읽으면, 운영 흐름이 더 선명해집니다.</h2>
        </div>
        <div className="figures-grid">
          {keyFigures.map(([index, value, label]) => (
            <article key={label}>
              <span>{index}</span>
              <strong>{value}</strong>
              <p>{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section preview-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">1.3 Program Preview</p>
            <h2>웜업부터 메인 서킷, 팀 릴레이까지 가로로 훑어보기</h2>
          </div>
          <p>각 단계는 운동 설명, 핵심 큐잉, 팀 인터랙션이 자연스럽게 이어지도록 구성했습니다.</p>
        </div>
        <div className="horizontal-cards">
          {previewCards.map(([title, desc]) => (
            <article key={title}>
              <span>{title}</span>
              <h3>{desc}</h3>
            </article>
          ))}
        </div>
        <div className="social-grid" aria-label="참가자 현장 스케치와 포토 리뷰">
          {socialProof.map(([name, text]) => (
            <article key={name}>
              <div className="photo-tile" />
              <strong>{name}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section selected-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Selected Moments</p>
            <h2>프레임 단위로 기억되는 네 개의 장면</h2>
          </div>
          <p>레퍼런스의 프로젝트 카드 흐름처럼, 세션을 하나의 스포츠 필름 시퀀스로 보여줍니다.</p>
        </div>
        <div className="moment-grid">
          {selectedMoments.map(([title, desc], index) => (
            <article key={title} className="moment-card">
              <div className="moment-media">
                <img src="/circuitmate-hero.png" alt="" />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="brand" className="section brand-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">02. Brand</p>
            <h2>건강한 땀과 진정성 있는 교류를 만드는 나이트 웰니스 커뮤니티</h2>
          </div>
          <p>서킷메이트는 운동을 매개로 낯선 사람들이 서로의 에너지를 안전하게 나누는 새로운 스포츠 소셜 문화를 지향합니다.</p>
        </div>
        <div className="story-panel">
          <article>
            <span>Mission</span>
            <p>건강한 몰입, 절제된 분위기, 회복의 시간을 통해 일회성 파티보다 오래 남는 연결을 만듭니다.</p>
          </article>
          <article>
            <span>Community</span>
            <p>개인의 기록보다 팀의 완주와 응원을 우선하는 웰니스 소셜링 규칙을 운영합니다.</p>
          </article>
          <article>
            <span>Space</span>
            <p>실내테니스팡의 보랏빛 코트와 조명은 야간 운동의 선명한 무드를 브랜드 자산으로 만듭니다.</p>
          </article>
        </div>
      </section>

      <section id="program" className="section program-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">03. Program</p>
            <h2>19:00-21:30 상세 타임라인과 종목별 가이드</h2>
          </div>
          <p>시간표는 세로형 스텝으로 읽히고, 종목은 탭으로 전환하며 동작 요약과 핵심 큐잉을 빠르게 확인합니다.</p>
        </div>
        <div className="program-layout">
          <div className="vertical-timeline">
            {timeline.map(([time, title, desc]) => (
              <article key={time}>
                <time>{time}</time>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="station-guide">
            <div className="cue-banner">
              남과 비교하지 마세요. 1분 동안 내 숨소리에 집중하는 것이 유일한 룰입니다.
            </div>
            <div className="tab-list" role="tablist" aria-label="서킷 종목 가이드">
              {stations.map((station) => (
                <button
                  key={station.key}
                  type="button"
                  className={selectedStation.key === station.key ? 'active' : ''}
                  onClick={() => setSelectedStation(station)}
                >
                  {station.title}
                </button>
              ))}
            </div>
            <article className="station-detail">
              <div className="loop-gif" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>동작 요약</p>
              <h3>{selectedStation.title}</h3>
              <dl>
                <div>
                  <dt>핵심 큐잉</dt>
                  <dd>{selectedStation.cue}</dd>
                </div>
                <div>
                  <dt>효과</dt>
                  <dd>{selectedStation.effect}</dd>
                </div>
              </dl>
            </article>
          </div>
        </div>
        <div className="mini-game-card">
          <span>3.3 Mini Game & Relay</span>
          <h3>순발력 코트 터치 게임과 코트 대형 이어달리기</h3>
          <p>팀원 간 사인을 맞추며 코트 라인을 터치하고, 마지막 릴레이에서 자연스럽게 응원과 사진이 만들어집니다.</p>
        </div>
      </section>

      <section id="recovery" className="section recovery-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">04. Recovery</p>
            <h2>리커버리 테이블과 운동 후 회복 가이드</h2>
          </div>
          <p>카드형 메뉴 소개와 텍스트 기반 웰니스 가이드로 운동 뒤 필요한 선택을 명확하게 보여줍니다.</p>
        </div>
        <div className="recovery-grid">
          {recoveryItems.map(([tag, title, desc]) => (
            <article key={title}>
              <span>{tag}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        <div className="guide-grid">
          {wellnessGuide.map(([title, desc]) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section value-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Business Model</p>
            <h2>필요한 날만 결제하거나, 루틴으로 투자하거나</h2>
          </div>
          <p>서킷메이트는 단발 참여의 부담 없는 진입과 꾸준한 참석을 위한 선택형 월간 패스를 함께 운영합니다.</p>
        </div>
        <div className="value-card">
          <div className="pass-grid">
            {passOptions.map((pass) => (
              <article key={pass.value} className={pass.value === 'single' ? 'pass-card featured' : 'pass-card'}>
                <span>{pass.eyebrow}</span>
                <h3>{pass.title}</h3>
                <strong>{pass.price}</strong>
                <small>{pass.note}</small>
                <p>{pass.desc}</p>
              </article>
            ))}
          </div>
          <div className="earlybird-box">
            <span>Pricing Logic</span>
            <strong>0% 손해 구조</strong>
            <p>원데이는 신청한 회차만 결제하고, 월간 패스는 꾸준한 참가자에게 더 낮은 회당 단가와 유연한 일정 변경을 제공합니다.</p>
            <div className="value-list compact">
              {valueStack.map(([item, desc]) => (
                <div key={item}>
                  <span>{item}</span>
                  <strong>{desc}</strong>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setBookingOpen(true)}>
              패스 선택하고 예약
            </button>
          </div>
        </div>
      </section>

      <section id="awards" className="section awards-section">
        <div className="section-heading">
          <p className="eyebrow">05. Awards</p>
          <h2>시상식의 취지와 유쾌한 분위기를 전하는 네 가지 부문</h2>
        </div>
        <div className="awards-slider" aria-label="서킷메이트 어워즈 부문">
          {awards.map(([title, desc]) => (
            <article key={title}>
              <div className="award-icon" aria-hidden="true">{title.slice(0, 1)}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="booking" className="section booking-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">06. Booking</p>
            <h2>일정 선택부터 결제 확인까지 한 번에</h2>
          </div>
          <p>날짜/시간 선택, 잔여 티켓 확인, 신청 폼, 체크리스트 동의, 결제 안내를 단계별로 배치했습니다.</p>
        </div>
        <div className="booking-layout">
          <aside className="slot-panel">
            <h3>6.1 일정 선택</h3>
            <div className="slot-list" role="listbox" aria-label="세션 일정">
              {sessions.map((session) => (
                <button
                  key={session}
                  type="button"
                  className={selectedSession === session ? 'active' : ''}
                  onClick={() => setSelectedSession(session)}
                >
                  <span>{session}</span>
                  <strong>잔여 12석</strong>
                </button>
              ))}
            </div>
            <div className="ticket-box">
              <span>선택 일정</span>
              <strong>{nextSessionLabel} 세션</strong>
              <p>원데이 올패스 티켓 39,000원</p>
            </div>
          </aside>
          <form onSubmit={handleBooking} className="form-card">
            <h3>6.2 신청 폼 작성</h3>
            <div className="form-row">
              <label>
                성함
                <input name="name" placeholder="홍길동" required />
              </label>
              <label>
                연락처
                <input name="phone" placeholder="010-0000-0000" required />
              </label>
            </div>
            <div className="form-row">
              <label>
                운동 수준
                <select name="level" defaultValue="intro">
                  <option value="intro">입문자</option>
                  <option value="experienced">경험자</option>
                </select>
              </label>
              <label>
                동반인 및 팀 배정
                <select name="party" defaultValue="solo">
                  <option value="solo">개인 신청</option>
                  <option value="with-friend">동반인 있음</option>
                  <option value="team">팀 단위 신청</option>
                </select>
              </label>
            </div>
            <label>
              패스 선택
              <select name="passType" defaultValue="single">
                {passOptions.map((pass) => (
                  <option key={pass.value} value={pass.value}>
                    {pass.title}
                  </option>
                ))}
              </select>
            </label>
            <h3>6.3 체크리스트 동의</h3>
            <label className="checkbox-row">
              <input type="checkbox" required />
              실내 운동화, 운동복, 텀블러 준비를 확인했습니다.
            </label>
            <label className="checkbox-row">
              <input type="checkbox" required />
              환불 규정과 세션 운영 정책에 동의합니다.
            </label>
            <div className="payment-box">
              <h3>6.4 결제 및 확인</h3>
              <p>원데이 패스는 회차별 결제로, 월간 패스는 잔여 횟수 이월과 일정 변경 옵션 안내 후 확정됩니다.</p>
            </div>
            <button type="submit" disabled={bookingSending}>
              {bookingSending ? '접수 중' : '결제 안내 받기'}
            </button>
            {bookingSent && <p className="success-message">예약 신청이 접수되었습니다. 결제 안내와 확정 알림을 보내드릴게요.</p>}
            {bookingError && <p className="error-message">{bookingError}</p>}
          </form>
        </div>
      </section>

      <section id="location" className="section location-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">07. Location & FAQ</p>
            <h2>공간 아이덴티티, 오시는 길, 자주 묻는 질문</h2>
          </div>
          <p>실내테니스팡의 보랏빛 코트 무드와 시설 안내, 네이버 지도 연동을 고려한 길찾기 구성을 담았습니다.</p>
        </div>
        <div className="location-layout">
          <article className="space-gallery">
            <h3>7.1 공간 아이덴티티</h3>
            <p>코트 조명, 탄성 바닥, 탈의실과 정수기 등 편의시설을 사전 안내해 첫 방문의 불안을 줄입니다.</p>
            <div className="gallery-strip">
              <span>COURT</span>
              <span>LIGHT</span>
              <span>RECOVERY</span>
            </div>
          </article>
          <article className="map-panel">
            <h3>7.2 오시는 길</h3>
            <div className="map-mock" aria-label="네이버 지도 영역 목업">
              <span>NAVER MAP</span>
            </div>
            <p>상세 주소, 길찾기 링크, 대중교통 및 주차 지원 가이드를 배치할 수 있습니다.</p>
          </article>
        </div>
        <div className="operation-manual">
          <div className="section-heading compact">
            <p className="eyebrow">Operation Detail</p>
            <h2>혼자 와도 자연스럽고, 초보도 안전하게 움직이는 현장 운영</h2>
          </div>
          <div className="operation-grid">
            {operationDetails.map(([title, desc]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="footer-section">
        <div>
          <strong>CIRCUITMATE</strong>
          <p>사업자 정보, 이용약관, 개인정보처리방침, 공식 SNS 링크와 실시간 문의 채널이 들어가는 하단 고정 영역입니다.</p>
          <a className="admin-link" href="/admin">
            관리자
          </a>
        </div>
        <button type="button" onClick={() => setBookingOpen(true)}>
          다음 세션 예약
        </button>
      </footer>

      {bookingOpen && (
        <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="quick-booking-title">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="예약 패널 닫기"
            onClick={() => setBookingOpen(false)}
          />
          <section className="bottom-sheet">
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-header">
              <div>
                <p className="eyebrow">Quick Booking</p>
                <h2 id="quick-booking-title">바로 예약하기</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setBookingOpen(false)} aria-label="닫기">
                닫기
              </button>
            </div>
            <form onSubmit={handleBooking} className="sheet-form">
              <label>
                일정 선택
                <select value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)}>
                  {sessions.map((session) => (
                    <option key={session} value={session}>
                      {session} / 잔여 12석
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  이름
                  <input name="quickName" placeholder="홍길동" required />
                </label>
                <label>
                  연락처
                  <input name="quickPhone" inputMode="tel" placeholder="010-0000-0000" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  운동 수준
                  <select name="quickLevel" defaultValue="intro">
                    <option value="intro">입문자</option>
                    <option value="experienced">경험자</option>
                  </select>
                </label>
                <label>
                  신청 유형
                  <select name="quickParty" defaultValue="solo">
                    <option value="solo">개인 신청</option>
                    <option value="with-friend">동반인 있음</option>
                    <option value="team">팀 단위 신청</option>
                  </select>
                </label>
              </div>
              <label>
                패스 선택
                <select name="quickPassType" defaultValue="single">
                  {passOptions.map((pass) => (
                    <option key={pass.value} value={pass.value}>
                      {pass.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-row">
                <input type="checkbox" required />
                준비물과 환불 규정을 확인했습니다.
              </label>
              <div className="sheet-summary">
                <span>{selectedSession}</span>
                <strong>원데이 39,000원</strong>
              </div>
              <button type="submit" className="sheet-submit" disabled={bookingSending}>
                {bookingSending ? '접수 중' : '예약 및 결제 안내 받기'}
              </button>
              {bookingSent && <p className="success-message">접수되었습니다. 결제 안내와 확정 알림을 보내드릴게요.</p>}
              {bookingError && <p className="error-message">{bookingError}</p>}
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
