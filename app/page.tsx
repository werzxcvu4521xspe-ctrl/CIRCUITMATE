'use client';

import { FormEvent, useMemo, useState } from 'react';

const navItems = [
  ['Brand', '#brand'],
  ['Sessions', '#sessions'],
  ['F&B', '#perks'],
  ['Booking', '#booking'],
  ['Survey', '#survey'],
  ['FAQ', '#faq'],
];

const sessionFlow = [
  ['19:00', '체크인 & 웰컴 드링크', '컨디션 확인, 팀 배정, 라이트 네트워킹'],
  ['19:20', '다이내믹 웜업', '관절 가동성과 코트 적응을 위한 리듬 워밍업'],
  ['19:40', '6 스테이션 서킷', '하체, 코어, 파워, 밸런스를 순환 트레이닝'],
  ['20:45', '팀 이어달리기', '협업 미션과 스피드 챌린지로 분위기 피크업'],
  ['21:10', '리커버리 파티', 'F&B, 어워즈, 후기 공유, 다음 세션 안내'],
];

const stations = [
  ['Lunge Twist', '런지 트위스트', '회전 코어와 하체 안정성을 동시에 깨웁니다.'],
  ['Burpee Jump', '버피 점프', '전신 심박을 끌어올리는 고강도 파워 루틴.'],
  ['Push Press', '덤벨 푸쉬 프레스', '어깨와 코어를 연결해 폭발적인 추진력을 만듭니다.'],
  ['Ball Tap', '플랭크 볼 탭', '흔들림 속에서도 중심을 잡는 밸런스 코어.'],
  ['Court Sprint', '코트 스프린트', '짧은 거리 반응 속도와 민첩성을 강화합니다.'],
  ['Partner Rally', '파트너 랠리', '운동 뒤 자연스럽게 대화가 시작되는 팀 미션.'],
];

const perks = [
  ['Protein', '치킨 샌드위치', '운동 후 부담 없이 채우는 든든한 단백질 리커버리.'],
  ['Vitamin', '5종 과일컵', '수분감과 비타민을 빠르게 채우는 컬러풀한 과일 컵.'],
  ['Hydrate', '전해질 드링크', '땀 흘린 뒤 컨디션 회복을 돕는 라이트 드링크.'],
];

const awards = ['허슬상', '베스트 드레서', '분위기 메이커', '챔피언'];

const reviews = [
  ['민지', '운동 강도는 확실한데 분위기가 부담스럽지 않아서 처음 온 사람도 금방 섞였어요.', '9.6'],
  ['준호', '테니스 코트 조명, 음악, 팀 미션이 합쳐지니까 일반 운동 모임과 완전히 달랐습니다.', '9.3'],
  ['서연', '끝나고 샌드위치 먹으면서 얘기하는 시간이 제일 좋았어요. 다음 회차도 예약할게요.', '9.8'],
];

const faqs = [
  ['운동 초보도 참여할 수 있나요?', '네. 입문자와 경험자를 나눠 강도를 조절하고, 각 스테이션마다 쉬운 옵션을 제공합니다.'],
  ['개인 신청도 가능한가요?', '가능합니다. 현장에서 밸런스를 맞춰 팀을 배정해 드립니다.'],
  ['무엇을 준비하면 되나요?', '운동복, 깨끗한 실내 운동화, 개인 텀블러를 권장합니다.'],
];

export default function Home() {
  const [bookingSent, setBookingSent] = useState(false);
  const [surveySent, setSurveySent] = useState(false);
  const nextSession = useMemo(() => {
    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() + 12);
    return target.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }, []);

  function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingSent(true);
  }

  function handleSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSurveySent(true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Circuitmate home">
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
        <a className="header-cta" href="#booking">
          지금 예약
        </a>
      </header>

      <section id="top" className="hero">
        <img
          src="/circuitmate-hero.png"
          alt="보랏빛 실내 테니스 코트에서 진행되는 서킷 트레이닝"
          className="hero-image"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Night circuit training & wellness socialing</p>
          <h1>CIRCUITMATE</h1>
          <p className="hero-copy">땀 흘린 뒤 찾아오는 가장 건강한 교류</p>
          <div className="hero-actions">
            <a className="primary-button" href="#booking">
              다음 세션 예약하기
            </a>
            <a className="secondary-button" href="#sessions">
              프로그램 보기
            </a>
          </div>
          <div className="hero-stats" aria-label="다음 세션 요약">
            <span>
              <strong>D-12</strong>
              다음 세션
            </span>
            <span>
              <strong>{nextSession}</strong>
              19:00-21:30
            </span>
            <span>
              <strong>32명</strong>
              선착순 모집
            </span>
          </div>
        </div>
      </section>

      <a className="floating-cta" href="#booking">
        예약하기
      </a>

      <section id="brand" className="section brand-section">
        <div className="section-heading">
          <p className="eyebrow">Brand</p>
          <h2>운동, 회복, 대화가 한 코트에서 이어지는 밤</h2>
        </div>
        <div className="brand-grid">
          <article>
            <span>01</span>
            <h3>나이트 웰니스 커뮤니티</h3>
            <p>서킷메이트는 단순한 운동 모임이 아니라 건강한 에너지와 온전한 리커버리를 함께 나누는 스포츠 소셜 파티입니다.</p>
          </article>
          <article>
            <span>02</span>
            <h3>보랏빛 실내 코트 무드</h3>
            <p>감각적인 조명, 탄성 있는 바닥, 코트 라인 위에서 움직임이 더 선명해지는 몰입형 공간을 만듭니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>낯선 사람도 팀메이트로</h3>
            <p>운동 난이도와 팀 미션을 조율해 처음 만난 참가자도 자연스럽게 협업하고 대화하도록 설계합니다.</p>
          </article>
        </div>
      </section>

      <section id="sessions" className="section dark-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Sessions</p>
            <h2>19:00부터 21:30까지 이어지는 5단계 플로우</h2>
          </div>
          <p>운동 강도는 선명하게, 소셜링은 자연스럽게. 각 단계가 다음 대화의 계기가 되도록 구성했습니다.</p>
        </div>
        <div className="timeline">
          {sessionFlow.map(([time, title, desc]) => (
            <article key={time}>
              <time>{time}</time>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        <div className="station-grid">
          {stations.map(([tag, title, desc], index) => (
            <article key={title} className="station-card">
              <div className="motion-tile" aria-hidden="true">
                <span style={{ animationDelay: `${index * 120}ms` }} />
              </div>
              <p>{tag}</p>
              <h3>{title}</h3>
              <span>{desc}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="perks" className="section perks-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">F&B & Awards</p>
            <h2>운동 후에도 에너지가 꺼지지 않는 리커버리 테이블</h2>
          </div>
          <p>단백질, 비타민, 수분을 챙기고 네 가지 어워즈로 그날의 장면을 오래 기억하게 만듭니다.</p>
        </div>
        <div className="perks-grid">
          {perks.map(([tag, title, desc]) => (
            <article key={title}>
              <p>{tag}</p>
              <h3>{title}</h3>
              <span>{desc}</span>
            </article>
          ))}
        </div>
        <div className="awards-row">
          {awards.map((award) => (
            <span key={award}>{award}</span>
          ))}
        </div>
      </section>

      <section id="booking" className="section booking-section">
        <div className="section-heading">
          <p className="eyebrow">Booking</p>
          <h2>다음 서킷에 합류하기</h2>
        </div>
        <div className="form-layout">
          <form onSubmit={handleBooking} className="form-card">
            <label>
              성함
              <input name="name" placeholder="홍길동" required />
            </label>
            <label>
              연락처
              <input name="phone" placeholder="010-0000-0000" required />
            </label>
            <label>
              운동 수준
              <select name="level" defaultValue="intro">
                <option value="intro">입문</option>
                <option value="experienced">경험자</option>
              </select>
            </label>
            <label>
              동반인
              <select name="party" defaultValue="solo">
                <option value="solo">개인 신청</option>
                <option value="with-friend">동반인 있음</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" required />
              운동복, 깨끗한 실내 운동화, 개인 텀블러 준비에 동의합니다.
            </label>
            <button type="submit">예약 요청 보내기</button>
            {bookingSent && <p className="success-message">예약 요청이 접수되었습니다. 안내 메시지를 곧 보내드릴게요.</p>}
          </form>
          <aside className="info-panel">
            <h3>실내테니스팡</h3>
            <p>서울 도심권 실내 코트. 주차 가능, 지하철역 도보권. 정확한 위치와 입장 동선은 예약 확정 후 안내됩니다.</p>
            <div className="map-mock" aria-label="장소 지도 목업">
              <span>COURT</span>
            </div>
          </aside>
        </div>
      </section>

      <section id="survey" className="section survey-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Review & Survey</p>
            <h2>참가 후기를 남기고 다음 회차를 더 좋게 만들기</h2>
          </div>
          <div className="score-strip">
            <span>평균 만족도 9.6</span>
            <span>재참여 의향 94%</span>
          </div>
        </div>
        <div className="review-grid">
          {reviews.map(([name, quote, score]) => (
            <article key={name}>
              <strong>{score}</strong>
              <p>{quote}</p>
              <span>{name}</span>
            </article>
          ))}
        </div>
        <form onSubmit={handleSurvey} className="survey-form">
          <div className="survey-row">
            <label>
              닉네임
              <input name="nickname" placeholder="참가자 닉네임" required />
            </label>
            <label>
              참여 회차
              <input name="round" placeholder="예: 8월 2주차" />
            </label>
          </div>
          <label>
            한 줄 후기
            <input name="shortReview" placeholder="오늘의 서킷메이트를 한 문장으로 남겨주세요." required />
          </label>
          <div className="rating-grid">
            {['전체 만족도', '운동 강도', '진행/코치', 'F&B', '소셜링 분위기'].map((item) => (
              <label key={item}>
                {item}
                <input type="range" min="1" max="10" defaultValue="9" aria-label={`${item} 점수`} />
              </label>
            ))}
          </div>
          <label>
            친구에게 추천할 의향이 있나요?
            <select name="nps" defaultValue="promoter">
              <option value="promoter">꼭 추천하고 싶어요</option>
              <option value="passive">상황에 따라 추천할게요</option>
              <option value="detractor">아직은 고민돼요</option>
            </select>
          </label>
          <label>
            개선 의견
            <textarea name="feedback" placeholder="좋았던 점, 아쉬웠던 점, 다음에 추가되면 좋은 프로그램을 알려주세요." />
          </label>
          <button type="submit">만족도 제출하기</button>
          {surveySent && <p className="success-message">후기와 만족도 조사가 저장되었습니다. 다음 코트에서 더 좋은 흐름으로 만날게요.</p>}
        </form>
      </section>

      <section id="faq" className="section faq-section">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>처음 오기 전에 궁금한 것들</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
