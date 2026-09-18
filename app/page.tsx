'use client';

import { CSSProperties, FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SITE_MAP, normalizeSiteMap, type SiteSection, type SiteSectionId } from '../lib/site-map';
import { DEFAULT_FAQ_ITEMS, normalizeFaqItems, type FaqItem } from '../lib/faq';
import {
  MIN_PARTICIPANTS,
  MAX_PARTICIPANTS,
  TICKET_PRICE,
  ticketDates,
  buildSessionLabel,
  type TicketDate,
  type TicketSession,
} from '../lib/schedule';

declare global {
  interface Window {
    naver?: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (
          target: HTMLElement,
          options: {
            center: unknown;
            zoom: number;
            zoomControl?: boolean;
            scaleControl?: boolean;
            mapDataControl?: boolean;
            gl?: boolean;
            customStyleId?: string;
          },
        ) => unknown;
        Marker: new (options: { position: unknown; map: unknown; title?: string }) => unknown;
      };
    };
    initCircuitmateNaverMap?: () => void;
    navermap_authFailure?: () => void;
  }
}

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
  ['@shmasus_1', '혼자 갈까 말까 고민했는데, 도착하자마자 팀이 자동으로 정해져서 그냥 바로 몸부터 풀게 됐어요'],
  ['@gah_y.n', '운동 처음이라 걱정했는데 스스로 난이도를 조절 할 수 있어서 끝까지 제 페이스로 따라갈 수 있었어요. 운동 후 과일 케이터링 바도 신선해서 좋았어요'],
  ['@awf_sacri', '술 없이도 이렇게 텐션 오르는 모임은 처음이었어요. 덕분에 주말이 상쾌해졌어요'],
  ['@osrmwt', '순발력 미니게임이랑 팀 이어달리기가 재밌었어요\n마지막 팀 이어달리기에서 다 같이 응원하며 뛴 게 아직도 기억나요.'],
];

const selectedMoments = [
  ['Opening Rally', '웰컴 드링크와 팀 배정이 시작되는 입장 장면'],
  ['Station Heat', '보랏빛 조명 아래 이어지는 6스테이션 전신 서킷'],
  ['Relay Peak', '응원과 기록이 동시에 터지는 팀 이어달리기'],
  ['Recovery Table', '치킨 샌드위치, 과일컵, 전해질 드링크로 마무리'],
];

const momentImages = ['/circuitmate-live.png', '/circuitmate-concept.png', '/circuitmate-live.png', '/circuitmate-concept.png'];
const defaultMapPlaceName = '충남대학교 정문 앞 서브웨이 건물 8층';
const defaultMapAddress = '대전 유성구 궁동 482-3';
const defaultMapSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(defaultMapAddress)}`;

type MapConfig = {
  configured: boolean;
  keyId: string;
  lat: number | null;
  lng: number | null;
  placeName: string;
  address: string;
  searchUrl: string;
  customStyleId: string;
  customStyleVersion: string;
};

const timeline = [
  ['준비 운동', '18:00 - 18:05 (5분)', '입장 및 출석 확인', '참가자 확인 및 팀 배정, 짐 정리'],
  ['준비 운동', '18:05 - 18:15 (10분)', '몸풀기 스트레칭', '전신 관절 및 다이내믹 스트레칭'],
  ['준비 운동', '18:15 - 18:30 (15분)', '순발력 미니게임', '반응속도 콘 터치 게임 & 팀 단합'],
  ['준비 운동', '18:30 - 18:33 (3분)', '1차 수분 보충', '전해질 음료 섭취 및 호흡 정리'],
  ['메인 서킷', '18:33 - 18:35 (2분)', '서킷 종목 설명', '5개 구역 동작 시범 및 핵심 큐잉 브리핑'],
  ['메인 서킷', '18:35 - 18:42 (7분)', '메인 서킷 1라운드', '5개 종목 순환 (종목당 1분 운동 + 30초 휴식/이동)'],
  ['메인 서킷', '18:42 - 18:45 (3분)', '라운드 간 휴식', '팀별 호흡 조절 및 수분 보충'],
  ['마무리 운동', '18:52 - 18:55 (3분)', '2차 수분 보충', '호흡 정리 및 이어달리기 순서 결정'],
  ['마무리 운동', '18:55 - 19:10 (15분)', '팀 이어달리기', '코트를 활용한 팀 대항 이어달리기'],
  ['마무리 운동', '19:10 - 19:15 (5분)', '마무리 스트레칭', '이어달리기 후 전신 이완 및 호흡 정리'],
  ['리커버리', '19:15 - 19:20 (5분)', '과일 케이터링 바', '스탠딩 생과일 뷔페 바 & 전해질 드링크 섭취'],
  ['시상 & 마감', '19:20 - 19:30 (10분)', '서킷 어워즈 & 마무리', '4대 부문 시상식 및 단체 사진 촬영'],
];

const TIMELINE_SECTIONS = [
  { phase: '준비 운동', label: '준비 운동', duration: '30분' },
  { phase: '메인 서킷', label: '메인 서킷', duration: '20분' },
  { phase: '마무리 운동', label: '마무리 운동', duration: '20분' },
  { phase: '리커버리', label: '리커버리', duration: '10분' },
  { phase: '시상 & 마감', label: '시상식', duration: '10분' },
];

const stations = [
  {
    key: 'lunge',
    title: '런지 트위스트',
    video: '/station-lunge.m4v',
    cue: '무릎은 발끝 방향, 회전은 흉추에서 시작',
    effect: '하체 안정성과 회전 코어를 동시에 깨웁니다.',
  },
  {
    key: 'burpee',
    title: '버피 점프',
    video: '/station-burpee.m4v',
    cue: '착지는 부드럽게, 점프 전 복부 긴장 유지',
    effect: '짧은 시간 심박과 전신 파워를 끌어올립니다.',
  },
  {
    key: 'press',
    title: '덤벨 푸쉬 프레스',
    video: '/station-press.m4v',
    cue: '다리 반동을 어깨까지 연결하고 허리는 꺾지 않기',
    effect: '상체 추진력과 코어 연결성을 강화합니다.',
  },
  {
    key: 'plank',
    title: '플랭크 볼 탭',
    video: '/station-plank.m4v',
    cue: '골반 흔들림을 줄이고 손끝은 가볍게 터치',
    effect: '밸런스와 코어 지구력을 선명하게 만듭니다.',
  },
];

const recoveryItems = [
  ['Vitamin', '제철 과일컵', '수분과 비타민을 동시에 채우는 상큼한 마무리.'],
  ['Hydrate', '전해질 드링크', '땀으로 빠져나간 수분과 미네랄 밸런스를 회복합니다.'],
];

const wellnessGuide = [
  ['회복 루틴', '종아리, 둔근, 어깨 순서로 스트레칭해 다음날 피로를 줄입니다.'],
];

const brandManifesto = [
  '에너지는 함께할수록 증폭됩니다.',
  '여기는 서로의 에너지를 빌리고 나눌 수 있는 거대한 에너지의 장입니다.',
  '밝은 에너지를 가진 사람들이 모이면, 그 강한 진동은 각자의 에너지를 흔들어 깨웁니다.',
  '땀 흘리며 서킷을 돌고, 내 몸이 스스로 만들어내는 건강한 활기를 즐기는 것, 그것이 우리가 주고자 하는 핵심 경험입니다.',
  '토요일 저녁, 서로의 에너지를 나누며 삶에 강렬한 활력을 채워가세요.',
  '여러분과 함께 활력 가득한 밤을 만들 수 있어 기쁩니다.',
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
    price: '23,000원',
    note: '티켓 1매',
    desc: '최소 인원이 모이면 호스트가 세션을 오픈하는 1회성 티켓입니다. 가능한 날만 구매하고, 못 나오는 주에는 결제 부담이 없습니다.',
  },
  {
    value: 'monthly',
    eyebrow: 'Optional Monthly Pass',
    title: '핏 인베스트먼트 먼슬리 패스',
    price: '월 정기 패스',
    note: '가격 별도 안내',
    desc: '매주 꾸준히 참석해 루틴을 만들고 싶은 회원을 위한 선택형 구독 패스입니다. 원데이보다 회당 단가 -15%와 이월/일정 변경 옵션을 제공합니다.',
  },
];

const GENDER_OPTIONS = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

const LEVEL_OPTIONS = [
  { value: 'beginner', label: '초급', description: '처음이라 내 페이스대로 가볍게 시작하고 싶어요' },
  { value: 'intermediate', label: '중급', description: '기본 체력은 있고, 적당히 땀 흘리며 도전하고 싶어요' },
  { value: 'advanced', label: '고급', description: '체력에 자신 있고, 강도 높게 끝까지 밀어붙이고 싶어요' },
];

const PARTY_OPTIONS = [
  { value: 'solo', label: '개인 신청' },
  { value: 'with-friend', label: '동반인 있음' },
  { value: 'team', label: '팀 단위 신청' },
];

type BuyerStepKey = 'name' | 'phone' | 'instagram' | 'gender' | 'level' | 'party' | 'passType';

type BuyerFormState = {
  name: string;
  phone: string;
  instagram: string;
  gender: string;
  level: string;
  party: string;
  companionName: string;
  passType: string;
};

const INITIAL_BUYER_FORM: BuyerFormState = {
  name: '',
  phone: '010',
  instagram: '@',
  gender: GENDER_OPTIONS[0].value,
  level: LEVEL_OPTIONS[0].value,
  party: PARTY_OPTIONS[0].value,
  companionName: '',
  passType: 'single',
};

const BUYER_STEP_LABELS: Record<BuyerStepKey, string> = {
  name: '성함',
  phone: '연락처',
  instagram: '인스타그램 아이디',
  gender: '성별',
  level: '운동 수준',
  party: '동반인 및 팀 배정',
  passType: '패스 선택',
};

const operationDetails = [
  ['입장 데스크', '참가자 전원에게 팀 컬러 손목 밴드를 배부하고, 혼자 온 참가자도 자연스럽게 해당 컬러 구역으로 이동합니다.'],
  ['서킷 스테이션', '각 스테이션마다 초급 / 중급 / 고급 3단계 난이도 픽토그램 보드를 거치합니다.'],
  ['리커버리 전환', '쿨다운 BGM과 함께 과일 바를 오픈합니다.'],
];

const awards = [
  ['허슬상', '끝까지 밀어붙인 에너지와 성실한 태도를 기념합니다.'],
  ['분위기 메이커', '팀의 긴장을 풀고 모두의 몰입을 끌어올린 참가자에게.'],
  ['베스트 드레서', '코트 조명 아래 가장 선명한 에슬레저 룩을 선정합니다.'],
  ['챔피언', '미니게임과 릴레이를 종합해 그날의 팀 퍼포먼스를 축하합니다.'],
];

export default function Home() {
  const [siteMap, setSiteMap] = useState<SiteSection[]>(DEFAULT_SITE_MAP);
  const [selectedStation, setSelectedStation] = useState(stations[0]);
  const [selectedDate, setSelectedDate] = useState(ticketDates[0].id);
  const [selectedSessionId, setSelectedSessionId] = useState(ticketDates[0].sessions[0].id);
  const [bookingError, setBookingError] = useState('');
  const [bookingSending, setBookingSending] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [mainStepStarted, setMainStepStarted] = useState(false);
  const [quickStepStarted, setQuickStepStarted] = useState(false);
  const [buyerForm, setBuyerForm] = useState<BuyerFormState>(INITIAL_BUYER_FORM);
  const [buyerStepIndex, setBuyerStepIndex] = useState(0);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [agreements, setAgreements] = useState({ gear: false, policy: false, recording: false });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 18 });
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number> | null>(null);
  const [mapError, setMapError] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [openFaqQuestion, setOpenFaqQuestion] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(DEFAULT_FAQ_ITEMS);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedDateInfo = useMemo(
    () => ticketDates.find((date) => date.id === selectedDate) ?? ticketDates[0],
    [selectedDate],
  );
  const selectedTicketSession = useMemo(
    () =>
      selectedDateInfo.sessions.find((session) => session.id === selectedSessionId) ??
      selectedDateInfo.sessions[0],
    [selectedDateInfo, selectedSessionId],
  );
  const selectedSessionLabel = buildSessionLabel(selectedDateInfo, selectedTicketSession);
  const selectedSessionBooked = getSessionBooked(selectedDateInfo, selectedTicketSession);
  const remainingSeats = MAX_PARTICIPANTS - selectedSessionBooked;
  const visibleSections = useMemo(
    () =>
      new Set(
        siteMap.filter((section) => section.visible && section.id !== 'identity').map((section) => section.id)
      ),
    [siteMap],
  );
  const navItems = useMemo(
    () =>
      siteMap
        .filter((section) => section.visible && section.id !== 'identity')
        .map((section) => [section.label, section.href] as const),
    [siteMap],
  );

  useEffect(() => {
    const ids = navItems.map(([, href]) => href.replace('#', ''));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) {
      return;
    }

    let ticking = false;

    // The "home" section id lives on the outer <main> element, which wraps
    // every other section, so it can't be compared by intersection ratio
    // (it would always look "smaller" than any single section). Instead,
    // walk the sections in document order and keep the last one whose top
    // has scrolled above a fixed line near the top of the viewport.
    function updateActiveSection() {
      const line = window.innerHeight * 0.35;
      let current = elements[0].id;

      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) {
          current = el.id;
        } else {
          break;
        }
      }

      setActiveSection(current);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActiveSection);
      }
    }

    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [navItems]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    if (elements.length === 0) {
      return;
    }

    if (typeof window.IntersectionObserver !== 'function') {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [visibleSections]);

  useEffect(() => {
    let mounted = true;

    async function loadSiteMap() {
      try {
        const response = await fetch('/api/site-map');
        const data = (await response.json()) as { sections?: SiteSection[] };

        if (mounted && response.ok) {
          setSiteMap(normalizeSiteMap(data.sections));
        }
      } catch {
        setSiteMap(DEFAULT_SITE_MAP);
      }
    }

    void loadSiteMap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadFaqItems() {
      try {
        const response = await fetch('/api/faq');
        const data = (await response.json()) as { items?: FaqItem[] };

        if (mounted && response.ok) {
          setFaqItems(normalizeFaqItems(data.items));
        }
      } catch {
        setFaqItems(DEFAULT_FAQ_ITEMS);
      }
    }

    void loadFaqItems();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSessionCounts() {
      try {
        const response = await fetch('/api/session-counts');
        const data = (await response.json()) as { counts?: Record<string, number> };

        if (mounted) {
          setSessionCounts(data.counts ?? {});
        }
      } catch {
        if (mounted) {
          setSessionCounts({});
        }
      }
    }

    void loadSessionCounts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMapConfig() {
      try {
        const response = await fetch('/api/map-config');
        const data = (await response.json()) as MapConfig;

        if (mounted) {
          setMapConfig(data);
        }
      } catch {
        if (mounted) {
          setMapConfig({
            configured: false,
            keyId: '',
            lat: null,
            lng: null,
            placeName: defaultMapPlaceName,
            address: defaultMapAddress,
            searchUrl: defaultMapSearchUrl,
            customStyleId: '',
            customStyleVersion: '',
          });
        }
      }
    }

    void loadMapConfig();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapConfig?.configured || !mapConfig.keyId || mapConfig.lat === null || mapConfig.lng === null) {
      return;
    }

    let cancelled = false;
    let rendered = false;

    const renderMap = () => {
      if (cancelled || rendered) {
        return;
      }
      if (!mapContainerRef.current || !window.naver?.maps) {
        return;
      }
      if (mapContainerRef.current.childElementCount > 0) {
        rendered = true;
        return;
      }

      try {
        const center = new window.naver.maps.LatLng(mapConfig.lat as number, mapConfig.lng as number);
        const map = new window.naver.maps.Map(mapContainerRef.current, {
          center,
          zoom: 16,
          zoomControl: true,
          scaleControl: false,
          mapDataControl: false,
          ...(mapConfig.customStyleId
            ? {
                gl: true,
                customStyleId: mapConfig.customStyleId,
              }
            : {}),
        });

        new window.naver.maps.Marker({
          position: center,
          map,
          title: mapConfig.placeName,
        });

        rendered = true;
      } catch {
        // 커스텀 스타일(GL) 모듈이 아직 로드되지 않았을 수 있음 — 폴링에서 재시도.
      }
    };

    // 커스텀 스타일(Style Editor)을 쓰려면 기본 maps.js 외에 별도의 GL 모듈 스크립트가 필요함.
    // (submodules=gl 파라미터가 아니라 maps-gl.js를 따로 로드해야 동작함.)
    const ensureGlModule = () => {
      if (!mapConfig.customStyleId || document.getElementById('naver-map-gl-sdk')) {
        return;
      }

      const glScript = document.createElement('script');
      glScript.id = 'naver-map-gl-sdk';
      glScript.async = true;
      glScript.src = 'https://oapi.map.naver.com/openapi/v3/maps-gl.js';
      glScript.onload = renderMap;
      document.head.appendChild(glScript);
    };

    if (window.naver?.maps) {
      ensureGlModule();
      renderMap();
      return () => {
        cancelled = true;
      };
    }

    window.initCircuitmateNaverMap = () => {
      ensureGlModule();
      renderMap();
    };
    window.navermap_authFailure = () => {
      setMapError('네이버 지도 인증에 실패했습니다. Naver Cloud Platform 콘솔에서 Maps API 키의 Web 서비스 URL에 이 사이트 도메인이 등록되어 있는지 확인해주세요.');
    };

    // Naver SDK's own ready callback occasionally never fires (observed in production even
    // when the API key/domain are correctly configured), leaving the canvas blank. Poll as a
    // safety net so the map still renders once window.naver.maps (and, for custom styles, the
    // GL module) becomes available.
    const pollId = window.setInterval(() => {
      ensureGlModule();
      renderMap();
      if (rendered || cancelled) {
        window.clearInterval(pollId);
      }
    }, 300);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(pollId);
    }, 8000);

    if (!document.getElementById('naver-map-sdk')) {
      const script = document.createElement('script');
      script.id = 'naver-map-sdk';
      script.async = true;
      const scriptParams = new URLSearchParams({
        ncpKeyId: mapConfig.keyId,
        callback: 'initCircuitmateNaverMap',
      });

      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${scriptParams.toString()}`;
      script.onerror = () => setMapError('네이버 지도를 불러오지 못했습니다.');
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
    };
  }, [mapConfig]);

  function isSectionVisible(id: SiteSectionId) {
    return visibleSections.has(id);
  }

  function sectionCopy(id: SiteSectionId) {
    return siteMap.find((section) => section.id === id) ?? DEFAULT_SITE_MAP.find((section) => section.id === id)!;
  }

  async function handleCopyAddress() {
    const address = mapConfig?.address ?? defaultMapAddress;

    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 1800);
    } catch {
      setAddressCopied(false);
    }
  }

  function getSessionBooked(date: TicketDate, session: TicketSession) {
    if (sessionCounts) {
      return sessionCounts[buildSessionLabel(date, session)] ?? 0;
    }

    return session.booked;
  }

  function getTicketStatus(booked: number) {
    const remainingToConfirm = Math.max(MIN_PARTICIPANTS - booked, 0);
    const seatsLeft = Math.max(MAX_PARTICIPANTS - booked, 0);
    const progress = Math.min(Math.round((booked / MAX_PARTICIPANTS) * 100), 100);

    if (seatsLeft === 0) {
      return {
        tone: 'soldout',
        label: '마감',
        message: '이번 세션은 마감되었습니다.',
        progress,
      };
    }

    if (booked >= MIN_PARTICIPANTS) {
      return {
        tone: 'closing',
        label: '마감 임박',
        message: `마감까지 ${seatsLeft}명 남았어요!`,
        progress,
      };
    }

    if (booked >= 3) {
      return {
        tone: 'confirming',
        label: '확정 임박',
        message: `진행 확정까지 ${remainingToConfirm}명 남았어요!`,
        progress,
      };
    }

    return {
      tone: 'open',
      label: '티케팅 가능',
      message: '토요일 세션 티케팅이 열려 있습니다.',
      progress,
    };
  }

  function handleDateSelect(dateId: string) {
    const date = ticketDates.find((item) => item.id === dateId) ?? ticketDates[0];
    setSelectedDate(date.id);
    setSelectedSessionId(date.sessions[0].id);
  }

  const buyerSteps: BuyerStepKey[] = [
    'name',
    'phone',
    'instagram',
    'gender',
    'level',
    'party',
    'passType',
  ];

  const buyerFormComplete = buyerStepIndex >= buyerSteps.length;

  function isBuyerStepValid(key: BuyerStepKey) {
    switch (key) {
      case 'name':
        return buyerForm.name.trim().length > 0;
      case 'phone':
        return buyerForm.phone.trim().length >= 9;
      case 'party':
        return buyerForm.party === 'solo' || buyerForm.companionName.trim().length > 0;
      default:
        return true;
    }
  }

  function updateBuyerField<K extends keyof BuyerFormState>(key: K, value: BuyerFormState[K]) {
    setBuyerForm((prev) => ({ ...prev, [key]: value }));
  }

  function confirmBuyerStep(key: BuyerStepKey) {
    if (!isBuyerStepValid(key)) {
      return;
    }

    const index = buyerSteps.indexOf(key);

    if (editingStepIndex !== null && editingStepIndex === index) {
      setEditingStepIndex(null);
      return;
    }

    setBuyerStepIndex((prev) => Math.min(prev + 1, buyerSteps.length));
  }

  function editBuyerStep(index: number) {
    setEditingStepIndex(index);
  }

  function resetBuyerForm() {
    setBuyerForm(INITIAL_BUYER_FORM);
    setBuyerStepIndex(0);
    setEditingStepIndex(null);
    setAgreements({ gear: false, policy: false, recording: false });
    setMainStepStarted(false);
    setQuickStepStarted(false);
  }

  function buyerStepSummary(key: BuyerStepKey) {
    switch (key) {
      case 'name':
        return buyerForm.name;
      case 'phone':
        return buyerForm.phone;
      case 'instagram':
        return buyerForm.instagram || '입력 안 함';
      case 'gender':
        return GENDER_OPTIONS.find((option) => option.value === buyerForm.gender)?.label ?? '';
      case 'level':
        return LEVEL_OPTIONS.find((option) => option.value === buyerForm.level)?.label ?? '';
      case 'party': {
        const partyLabel = PARTY_OPTIONS.find((option) => option.value === buyerForm.party)?.label ?? '';
        return buyerForm.party === 'solo'
          ? partyLabel
          : `${partyLabel} (${buyerForm.companionName})`;
      }
      case 'passType':
        return passOptions.find((pass) => pass.value === buyerForm.passType)?.title ?? '';
      default:
        return '';
    }
  }

  function renderBuyerStepBody(key: BuyerStepKey) {
    switch (key) {
      case 'name':
        return (
          <input
            name="name"
            value={buyerForm.name}
            onChange={(event) => updateBuyerField('name', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                confirmBuyerStep('name');
              }
            }}
            placeholder="홍길동"
            autoFocus
          />
        );
      case 'phone':
        return (
          <input
            name="phone"
            inputMode="tel"
            value={buyerForm.phone}
            onChange={(event) => updateBuyerField('phone', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                confirmBuyerStep('phone');
              }
            }}
            onFocus={(event) => {
              const { value } = event.target;
              event.target.setSelectionRange(value.length, value.length);
            }}
            placeholder="010-0000-0000"
            autoFocus
          />
        );
      case 'instagram':
        return (
          <input
            name="instagram"
            value={buyerForm.instagram}
            onChange={(event) => updateBuyerField('instagram', event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                confirmBuyerStep('instagram');
              }
            }}
            onFocus={(event) => {
              const { value } = event.target;
              event.target.setSelectionRange(value.length, value.length);
            }}
            placeholder="instagram_id (선택)"
            autoFocus
          />
        );
      case 'gender':
        return (
          <div className="pill-options" role="radiogroup" aria-label="성별">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={buyerForm.gender === option.value ? 'active' : ''}
                onClick={() => updateBuyerField('gender', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        );
      case 'level':
        return (
          <div className="pill-options pill-options-detailed" role="radiogroup" aria-label="운동 수준">
            {LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={buyerForm.level === option.value ? 'active' : ''}
                onClick={() => updateBuyerField('level', option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        );
      case 'party':
        return (
          <div className="party-step-body">
            <div className="pill-options" role="radiogroup" aria-label="동반인 및 팀 배정">
              {PARTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={buyerForm.party === option.value ? 'active' : ''}
                  onClick={() => updateBuyerField('party', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {buyerForm.party !== 'solo' && (
              <input
                name="companionName"
                className="party-companion-input"
                value={buyerForm.companionName}
                onChange={(event) => updateBuyerField('companionName', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    confirmBuyerStep('party');
                  }
                }}
                placeholder="동반인 성함"
                autoFocus
              />
            )}
          </div>
        );
      case 'passType':
        return (
          <div className="pill-options pill-options-detailed" role="radiogroup" aria-label="패스 선택">
            {passOptions.map((pass) => {
              const isAvailable = pass.value === 'single';

              return (
                <button
                  key={pass.value}
                  type="button"
                  className={buyerForm.passType === pass.value ? 'active' : ''}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && updateBuyerField('passType', pass.value)}
                >
                  <strong>{pass.eyebrow}{isAvailable ? '' : ' · 오픈 예정'}</strong>
                  <span>{pass.price}</span>
                </button>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  }

  function renderBuyerStepsForm() {
    return (
      <>
        <div className="buyer-steps">
          {buyerSteps.map((key, index) => {
            if (index > buyerStepIndex) {
              return null;
            }

            const isEditing = editingStepIndex === index;
            const isActive = isEditing || (editingStepIndex === null && index === buyerStepIndex);
            const isDone = index < buyerStepIndex && !isEditing;

            return (
              <div
                key={key}
                className={`buyer-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}
                onClick={isDone ? () => editBuyerStep(index) : undefined}
              >
                <div className="buyer-step-head">
                  <span className="buyer-step-label">{BUYER_STEP_LABELS[key]}</span>
                  {isDone && <span className="buyer-step-edit">수정</span>}
                </div>
                {isActive ? (
                  <>
                    {renderBuyerStepBody(key)}
                    <button
                      type="button"
                      className="step-next-button"
                      disabled={!isBuyerStepValid(key)}
                      onClick={() => confirmBuyerStep(key)}
                    >
                      {isEditing ? '저장' : '다음'}
                    </button>
                  </>
                ) : (
                  <p className="buyer-step-value">{buyerStepSummary(key)}</p>
                )}
              </div>
            );
          })}
        </div>
        {buyerFormComplete && (
          <>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agreements.gear}
                onChange={(event) =>
                  setAgreements((prev) => ({ ...prev, gear: event.target.checked }))
                }
              />
              실내 운동화, 운동복, 텀블러 준비를 확인했습니다.
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agreements.policy}
                onChange={(event) =>
                  setAgreements((prev) => ({ ...prev, policy: event.target.checked }))
                }
              />
              환불 규정과 세션 운영 정책에 동의합니다.
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agreements.recording}
                onChange={(event) =>
                  setAgreements((prev) => ({ ...prev, recording: event.target.checked }))
                }
              />
              세션 중 촬영된 사진/영상이 기록 및 홍보 목적으로 활용될 수 있음에 동의합니다.
            </label>
            <p className="payment-hint">결제는 신청 접수 후 팝업으로 안내됩니다.</p>
            <button
              type="submit"
              disabled={bookingSending || !agreements.gear || !agreements.policy || !agreements.recording}
            >
              {bookingSending ? '접수 중' : '구매 안내 받기'}
            </button>
            {bookingError && <p className="error-message">{bookingError}</p>}
          </>
        )}
      </>
    );
  }

  async function submitReservation(payload: Record<string, unknown>) {
    setBookingSending(true);
    setBookingError('');

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

      return true;
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : '예약 접수에 실패했습니다.');
      return false;
    } finally {
      setBookingSending(false);
    }
  }

  async function handleMainBooking(event: FormEvent<HTMLFormElement>, source: 'booking' | 'quick' = 'booking') {
    event.preventDefault();

    const ok = await submitReservation({
      session: selectedSessionLabel,
      name: buyerForm.name,
      phone: buyerForm.phone,
      instagram: buyerForm.instagram,
      gender: GENDER_OPTIONS.find((option) => option.value === buyerForm.gender)?.label ?? buyerForm.gender,
      level: LEVEL_OPTIONS.find((option) => option.value === buyerForm.level)?.label ?? buyerForm.level,
      party: PARTY_OPTIONS.find((option) => option.value === buyerForm.party)?.label ?? buyerForm.party,
      companionName: buyerForm.companionName,
      passType: buyerForm.passType,
      source,
    });

    if (ok) {
      setShowPaymentModal(true);
      setBookingOpen(false);
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
          CIRCUIT<span>MATE</span>
        </a>
        <nav aria-label="Primary navigation" className={mobileNavOpen ? 'mobile-open' : undefined}>
          <span className="nav-menu-label eyebrow">Menu</span>
          {navItems.flatMap(([label, href], index) => {
            const match = /^(\d+)\.\s*(.+)$/.exec(label);
            const isBooking = href === '#booking';
            const isActive = href === `#${activeSection}`;
            const showDivider = index > 0 && index === Math.ceil(navItems.length / 2);
            const linkClassName = [isBooking && 'nav-accent', isActive && 'active'].filter(Boolean).join(' ');
            const item = (
              <a
                key={label}
                href={href}
                className={linkClassName || undefined}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setMobileNavOpen(false)}
              >
                {match ? (
                  <>
                    <span className="nav-index">{match[1]}</span>
                    <span className="nav-label">
                      {match[2]}
                      {isBooking && <span className="nav-badge">예약중</span>}
                    </span>
                  </>
                ) : (
                  <span className="nav-label">{label}</span>
                )}
              </a>
            );

            return showDivider
              ? [<span key={`${label}-divider`} className="nav-divider" aria-hidden="true" />, item]
              : [item];
          })}
          <a
            href="/admin"
            className="nav-admin-link"
            onClick={() => setMobileNavOpen(false)}
          >
            관리자
          </a>
        </nav>
        {isSectionVisible('booking') && (
          <button className="header-cta" type="button" onClick={() => setBookingOpen(true)}>
            티켓 구매
          </button>
        )}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-label={mobileNavOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? '✕' : '☰'}
        </button>
      </header>

      {isSectionVisible('home') && (
        <section className="ticker-section" aria-label="서킷메이트 핵심 무드">
          <div className="ticker-track">
            {[...badgeLoop, ...badgeLoop].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {isSectionVisible('home') && (
        <>
          <section className="hero section-block">
            <img src="/circuitmate-live.png" alt="보랏빛 실내 코트에서 진행 중인 서킷메이트 현장" className="hero-image" />
            <div className="hero-overlay" />
            <div className="hero-content">
              <p className="eyebrow">{sectionCopy('home').label}</p>
              <h1>{sectionCopy('home').title}</h1>
              <p className="hero-copy">{sectionCopy('home').description}</p>
              <div className="hero-actions">
                {isSectionVisible('booking') && (
                  <button className="primary-button" type="button" onClick={() => setBookingOpen(true)}>
                    티켓 구매하기
                  </button>
                )}
                {isSectionVisible('program') && (
                  <a className="secondary-button" href="#program">
                    프로그램 미리보기
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="section figures-section">
            <div className="section-heading compact">
              <p className="eyebrow">Key Figures</p>
              <h2>한 번의 밤을 숫자로 읽으면, 운영 흐름이 더 선명해집니다.</h2>
            </div>
            <div className="figures-grid reveal">
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
            <div className="horizontal-cards reveal">
              {previewCards.map(([title, desc]) => (
                <article key={title}>
                  <span>{title}</span>
                  <h3>{desc}</h3>
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
            </div>
            <div className="moment-grid reveal">
              {selectedMoments.map(([title, desc], index) => (
                <article key={title} className="moment-card">
                  <div className="moment-media">
                    <img src={momentImages[index]} alt="" />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {isSectionVisible('booking') && (
        <button className="floating-cta" type="button" onClick={() => setBookingOpen(true)}>
          티켓 구매하기
        </button>
      )}

      {isSectionVisible('brand') && (
        <section id="brand" className="section brand-section">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">{sectionCopy('brand').label}</p>
              <h2>{sectionCopy('brand').title}</h2>
            </div>
          </div>
          <article className="manifesto-panel reveal" aria-label="서킷메이트 핵심 철학 및 브랜드 선언문">
            <span>Brand Manifesto</span>
            <h3>서킷메이트의 핵심 철학 및 브랜드 선언문</h3>
            <div>
              {brandManifesto.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
          <div className="story-panel reveal">
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
              <p>미래적 낙관을 표현한 1960년대 디자인 컨셉 &apos;스페이스 에이지(Space Age)&apos;를 반영했습니다.</p>
              <p>일상에서 완전히 분리된 이 비일상의 90분은,</p>
              <p>평소의 나를 잠시 내려놓고 온전히 움직임과 에너지에만 몰입하게 만들기 위함입니다.</p>
            </article>
          </div>
        </section>
      )}

      {isSectionVisible('program') && (
      <section id="program" className="section program-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('program').label}</p>
            <h2>{sectionCopy('program').title}</h2>
          </div>
        </div>
        <div className="program-layout">
          <div className="vertical-timeline">
            {TIMELINE_SECTIONS.map((section) => {
              const items = timeline.filter(([phase]) => phase === section.phase);

              if (items.length === 0) {
                return null;
              }

              return (
                <div className="timeline-group" key={section.phase}>
                  <div className="timeline-group-heading">
                    <h3>{section.label}</h3>
                    <span>{section.duration}</span>
                  </div>
                  <div className="timeline-group-items">
                    {items.map(([, time, title, desc]) => {
                      return (
                        <article key={time}>
                          <div>
                            <h4>{title}</h4>
                            <p>{desc}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="station-guide">
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
              <div className="station-video-frame">
                <video
                  key={selectedStation.video}
                  src={selectedStation.video}
                  aria-label={`${selectedStation.title} 동작 영상`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
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
      </section>
      )}

      {isSectionVisible('recovery') && (
      <section id="recovery" className="section recovery-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('recovery').label}</p>
            <h2>{sectionCopy('recovery').title}</h2>
          </div>
        </div>
        <div className="recovery-grid reveal">
          {recoveryItems.map(([tag, title, desc]) => (
            <article key={title}>
              <span>{tag}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        <div className="guide-grid reveal">
          {wellnessGuide.map(([title, desc]) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>
      )}

      {isSectionVisible('awards') && (
      <section id="awards" className="section awards-section">
        <div className="section-heading">
          <p className="eyebrow">{sectionCopy('awards').label}</p>
          <h2>{sectionCopy('awards').title}</h2>
        </div>
        <div className="awards-slider reveal" aria-label="서킷메이트 어워즈 부문">
          {awards.map(([title, desc]) => (
            <article key={title}>
              <div className="award-icon" aria-hidden="true">{title.slice(0, 1)}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>
      )}

      {isSectionVisible('pricing') && (
      <section id="pricing" className="section value-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('pricing').label}</p>
            <h2>{sectionCopy('pricing').title}</h2>
          </div>
          <p>{sectionCopy('pricing').description}</p>
        </div>
        <div className="value-card">
          <div className="pass-grid reveal">
            {passOptions.map((pass) => (
              <article key={pass.value} className={pass.value === 'single' ? 'pass-card featured' : 'pass-card monthly'}>
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
            <strong>혜택</strong>
            <p>원데이는 원하는 회차의 23,000원 티켓만 구매하고, 월간 패스는 꾸준한 참가자에게 더 낮은 회당 단가와 유연한 일정 변경을 제공합니다.</p>
            <div className="value-list compact">
              {valueStack.map(([item, desc]) => (
                <div key={item}>
                  <span>{item}</span>
                  <strong>{desc}</strong>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setBookingOpen(true)}>
              티켓 구매하기
            </button>
          </div>
        </div>
      </section>
      )}

      {isSectionVisible('review') && (
      <section id="review" className="section review-section" aria-label="참가자 후기">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('review').label}</p>
            <h2>{sectionCopy('review').title}</h2>
          </div>
        </div>
        <div className="social-grid reveal" aria-label="참가자 현장 스케치와 포토 리뷰">
          {socialProof.map(([name, text]) => (
            <article key={name}>
              <div className="photo-tile" />
              <strong>{name}</strong>
              {text.split('\n').map((line) => (
                <p key={line}>{line}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
      )}

      {isSectionVisible('booking') && (
      <section id="booking" className="section booking-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('booking').label}</p>
            <h2>{sectionCopy('booking').title}</h2>
          </div>
        </div>
        <div className="booking-layout reveal">
          <aside className="slot-panel">
            <h3>6.1 일정 선택</h3>
            <div className="date-calendar" role="listbox" aria-label="토요일 티켓 날짜">
              {ticketDates.map((date) => (
                <button
                  key={date.id}
                  type="button"
                  className={selectedDate === date.id ? 'active' : ''}
                  onClick={() => handleDateSelect(date.id)}
                >
                  <strong>
                    {date.label} ({date.day})
                  </strong>
                </button>
              ))}
            </div>
            <div className="session-list" aria-label="티케팅 가능한 세션">
              {selectedDateInfo.sessions.map((session) => {
                const status = getTicketStatus(getSessionBooked(selectedDateInfo, session));

                return (
                  <button
                    key={session.id}
                    type="button"
                    className={selectedSessionId === session.id ? 'active' : ''}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <span>
                      <strong>{session.label}</strong>
                      {session.time}
                    </span>
                    <em>{status.label}</em>
                  </button>
                );
              })}
            </div>
            <div className={`ticket-gauge ${getTicketStatus(selectedSessionBooked).tone}`}>
              <div className="gauge-copy">
                <span>{getTicketStatus(selectedSessionBooked).label}</span>
                <strong>{getTicketStatus(selectedSessionBooked).message}</strong>
              </div>
              <div className="gauge-track" aria-hidden="true">
                <span style={{ width: `${getTicketStatus(selectedSessionBooked).progress}%` }} />
              </div>
              <p>
                현재 {selectedSessionBooked}명 신청 · 최소 {MIN_PARTICIPANTS}명 시작 · 최대 {MAX_PARTICIPANTS}명
              </p>
            </div>
            <div className="ticket-box">
              <span>선택 일정</span>
              <strong>{selectedSessionLabel}</strong>
              <p>원데이 올패스 티켓 {TICKET_PRICE} · 잔여 {remainingSeats}석</p>
            </div>
          </aside>
          <form onSubmit={handleMainBooking} className="form-card">
            {mainStepStarted ? (
              renderBuyerStepsForm()
            ) : (
              <button
                type="button"
                className="buyer-form-cta"
                onClick={() => setMainStepStarted(true)}
              >
                티켓 구매하기
              </button>
            )}
          </form>
        </div>
      </section>
      )}

      {isSectionVisible('faq') && (
      <section id="faq" className="section faq-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('faq').label}</p>
            <h2>{sectionCopy('faq').title}</h2>
          </div>
        </div>
        <div className="faq-list reveal">
          {faqItems
            .filter((item) => item.visible)
            .map((item) => (
            <details key={item.id} open={openFaqQuestion === item.id}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setOpenFaqQuestion((current) => (current === item.id ? null : item.id));
                }}
              >
                {item.question}
              </summary>
              <div className="faq-answer">
                {item.answer?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {item.table && (
                  <div className="faq-policy-table" role="table" aria-label={item.question}>
                    <div role="row">
                      <strong role="columnheader">{item.table.head[0]}</strong>
                      <strong role="columnheader">{item.table.head[1]}</strong>
                    </div>
                    {item.table.rows.map(([point, refund]) => (
                      <div key={point} role="row">
                        <span role="cell">{point}</span>
                        <b role="cell">{refund}</b>
                      </div>
                    ))}
                  </div>
                )}
                {item.bullets && (
                  <ul>
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {item.note && <p className="faq-note">{item.note}</p>}
              </div>
            </details>
            ))}
        </div>
      </section>
      )}

      {isSectionVisible('location') && (
      <section id="location" className="section location-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('location').label}</p>
            <h2>{sectionCopy('location').title}</h2>
          </div>
        </div>
        <article className="map-panel">
          {mapConfig?.configured && !mapError ? (
            <div ref={mapContainerRef} className="naver-map-canvas" aria-label="네이버 지도" />
          ) : (
            <div className="map-fallback">
              <div className="map-pin" aria-hidden="true" />
              <span>NAVER MAP</span>
              <p>API 키 연결 전에는 네이버 지도 장소 링크로 위치를 확인할 수 있습니다.</p>
              <a href={mapConfig?.searchUrl ?? defaultMapSearchUrl} target="_blank" rel="noreferrer">
                네이버 지도에서 보기
              </a>
            </div>
          )}
          <div className="map-actions">
            <p>
              <strong>{mapConfig?.placeName ?? defaultMapPlaceName}</strong>
              <button
                type="button"
                className="map-address-row"
                onClick={handleCopyAddress}
                aria-label={addressCopied ? '주소가 복사되었습니다' : '주소 복사하기'}
              >
                <span>{mapConfig?.address ?? defaultMapAddress}</span>
                {addressCopied ? (
                  <svg className="map-copy-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8.5L6.5 12L13 4.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg className="map-copy-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="5.5" y="5.5" width="8" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M3 10.5V3.9C3 3.4 3.4 3 3.9 3H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <span className="map-note">건물 자체 주차장이 없습니다.</span>
            </p>
            <a href={mapConfig?.searchUrl ?? defaultMapSearchUrl} target="_blank" rel="noreferrer">
              네이버 지도 열기
            </a>
          </div>
          {mapError && <p className="map-error">{mapError}</p>}
        </article>
        <div className="operation-manual">
          <div className="section-heading compact">
            <p className="eyebrow">Operation Detail</p>
            <h2>혼자 와도 자연스럽고, 초보도 안전하게 움직이는 현장 운영</h2>
          </div>
          <div className="operation-grid reveal">
            {operationDetails.map(([title, desc]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {isSectionVisible('identity') && (
      <section id="identity" className="section location-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">{sectionCopy('identity').label}</p>
            <h2>{sectionCopy('identity').title}</h2>
          </div>
          <p>{sectionCopy('identity').description}</p>
        </div>
        <article className="space-gallery">
          <p>코트 조명, 탄성 바닥, 탈의실과 정수기 등 편의시설을 사전 안내해 첫 방문의 불안을 줄입니다.</p>
          <div className="gallery-strip">
            <span>COURT</span>
            <span>LIGHT</span>
            <span>RECOVERY</span>
          </div>
        </article>
      </section>
      )}

      <footer className="footer-section">
        <div>
          <strong>CIRCUITMATE</strong>
        </div>
        <a className="footer-admin-link" href="/admin">
          관리자
        </a>
      </footer>

      {bookingOpen && isSectionVisible('booking') && (
        <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="quick-booking-title">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="티켓 구매 패널 닫기"
            onClick={() => {
              setBookingOpen(false);
              setQuickStepStarted(false);
            }}
          />
          <section className="bottom-sheet booking-sheet">
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-header">
              <div>
                <p className="eyebrow">Ticket Checkout</p>
                <h2 id="quick-booking-title">티켓 구매하기</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setBookingOpen(false);
                  setQuickStepStarted(false);
                }}
                aria-label="닫기"
              >
                닫기
              </button>
            </div>
            <form onSubmit={(event) => handleMainBooking(event, 'quick')} className="sheet-form">
              <fieldset className="sheet-picker">
                <legend>일정 선택</legend>
                <div className="sheet-date-grid" role="listbox" aria-label="티켓 구매 날짜">
                  {ticketDates.map((date) => (
                    <button
                      key={date.id}
                      type="button"
                      className={selectedDate === date.id ? 'active' : ''}
                      onClick={() => handleDateSelect(date.id)}
                    >
                      <strong>
                        {date.label} ({date.day})
                      </strong>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="sheet-picker">
                <legend>세션 선택</legend>
                <div className="sheet-session-grid" role="listbox" aria-label="티켓 구매 세션">
                  {selectedDateInfo.sessions.map((session) => {
                    const sessionBooked = getSessionBooked(selectedDateInfo, session);
                    const status = getTicketStatus(sessionBooked);

                    return (
                      <button
                        key={session.id}
                        type="button"
                        className={selectedSessionId === session.id ? 'active' : ''}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <span>
                          <strong>{session.label}</strong>
                          {session.time}
                        </span>
                        <em>{status.label}</em>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              {quickStepStarted ? (
                renderBuyerStepsForm()
              ) : (
                <button
                  type="button"
                  className="buyer-form-cta"
                  onClick={() => setQuickStepStarted(true)}
                >
                  티켓 구매하기
                </button>
              )}
            </form>
          </section>
        </div>
      )}

      {showPaymentModal && (
        <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="payment-popup-title">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="결제 안내 닫기"
            onClick={() => {
              setShowPaymentModal(false);
              resetBuyerForm();
            }}
          />
          <section className="bottom-sheet payment-popup-sheet">
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-header">
              <div>
                <p className="eyebrow">Payment</p>
                <h2 id="payment-popup-title">결제 QR</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setShowPaymentModal(false);
                  resetBuyerForm();
                }}
                aria-label="닫기"
              >
                닫기
              </button>
            </div>
            <p className="payment-popup-copy">
              신청이 접수됐어요. 아래 QR로 결제하시면 예약이 확정됩니다.
            </p>
            <div className="ticket-box">
              <span>선택 일정</span>
              <strong>{selectedSessionLabel}</strong>
              <p>
                {passOptions.find((pass) => pass.value === buyerForm.passType)?.title} ·{' '}
                {passOptions.find((pass) => pass.value === buyerForm.passType)?.price}
              </p>
            </div>
            <div className="payment-qr" aria-label="서킷메이트 티켓 결제 QR 코드">
              <img src="/payment-qr.png" alt="서킷메이트 티켓 결제 QR 코드" />
              <span>QR로 티켓 결제하기</span>
              <p className="payment-qr-hint">모바일에서는 QR 이미지를 꾹 눌러 저장한 뒤, 결제 앱에서 스캔하면 바로 결제할 수 있어요.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
