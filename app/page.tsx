'use client';

import { CSSProperties, FocusEvent, FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SITE_MAP, normalizeSiteMap, type SiteSection, type SiteSectionId } from '../lib/site-map';
import { DEFAULT_FAQ_ITEMS, normalizeFaqItems, type FaqItem } from '../lib/faq';
import { DEFAULT_CONTENT, mergeContent, type ContentData, type Tuple2 } from '../lib/content';
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

export default function Home() {
  const [siteMap, setSiteMap] = useState<SiteSection[]>(DEFAULT_SITE_MAP);
  const [content, setContent] = useState<ContentData>(DEFAULT_CONTENT);
  const [selectedStationKey, setSelectedStationKey] = useState(DEFAULT_CONTENT.stations[0].key);
  const [editMode, setEditMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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
  const canEdit = editMode && adminPassword.length > 0;
  const selectedStationIndex = content.stations.findIndex((station) => station.key === selectedStationKey);
  const selectedStation = selectedStationIndex >= 0 ? content.stations[selectedStationIndex] : content.stations[0];
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
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('cm_edit') === '1') {
      setEditMode(true);
    }

    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'CM_ADMIN_AUTH' && typeof event.data.password === 'string') {
        setAdminPassword(event.data.password);
      }
    }

    window.addEventListener('message', handleMessage);
    window.parent?.postMessage({ type: 'CM_EDIT_READY' }, window.location.origin);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') {
      return;
    }

    const timer = window.setTimeout(() => setSaveStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      try {
        const response = await fetch('/api/content');
        const data = (await response.json()) as { content?: Partial<ContentData> };

        if (mounted && response.ok && data.content) {
          setContent(mergeContent(data.content));
        }
      } catch {
        if (mounted) {
          setContent(DEFAULT_CONTENT);
        }
      }
    }

    void loadContent();

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

  function saveContentField<K extends keyof ContentData>(key: K, value: ContentData[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));

    if (!canEdit) {
      return;
    }

    setSaveStatus('saving');
    fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
      body: JSON.stringify({ key, value }),
    })
      .then((response) => {
        setSaveStatus(response.ok ? 'saved' : 'error');
      })
      .catch(() => setSaveStatus('error'));
  }

  type TupleFieldKey =
    | 'keyFigures'
    | 'previewCards'
    | 'socialProof'
    | 'selectedMoments'
    | 'recoveryItems'
    | 'wellnessGuide'
    | 'valueStack'
    | 'operationDetails'
    | 'awards'
    | 'timeline';

  function editTuple(key: TupleFieldKey, rowIndex: number, fieldIndex: number) {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        const current = content[key] as unknown as string[][];
        const updated = current.map((row, i) => (i === rowIndex ? row.map((v, j) => (j === fieldIndex ? next : v)) : row));
        saveContentField(key, updated as ContentData[typeof key]);
      },
    };
  }

  type StringArrayFieldKey = 'badgeLoop' | 'brandManifesto' | 'identityGallery';

  function editStringItem(key: StringArrayFieldKey, index: number) {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        const current = content[key] as unknown as string[];
        const updated = current.map((v, i) => (i === index ? next : v));
        saveContentField(key, updated as ContentData[typeof key]);
      },
    };
  }

  type HeadingFieldKey = 'manifestoHeading' | 'operationHeading';

  function editHeadingField(key: HeadingFieldKey, field: 'eyebrow' | 'title') {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        saveContentField(key, { ...content[key], [field]: next });
      },
    };
  }

  function editPricingLogicField(field: 'eyebrow' | 'heading' | 'description') {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        saveContentField('pricingLogic', { ...content.pricingLogic, [field]: next });
      },
    };
  }

  function editIdentityIntro() {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (next) {
          saveContentField('identityIntro', next);
        }
      },
    };
  }

  type ArrayObjectFieldKey = 'timelineSections' | 'stations' | 'passOptions';

  function editArrayObjectField(key: ArrayObjectFieldKey, index: number, field: string) {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        const current = content[key] as unknown as Record<string, unknown>[];
        const updated = current.map((item, i) => (i === index ? { ...item, [field]: next } : item));
        saveContentField(key, updated as ContentData[typeof key]);
      },
    };
  }

  function editStoryLabel(cardIndex: number) {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        const updated = content.storyPanel.map((card, i) => (i === cardIndex ? { ...card, label: next } : card));
        saveContentField('storyPanel', updated);
      },
    };
  }

  function editStoryParagraph(cardIndex: number, paraIndex: number) {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        const updated = content.storyPanel.map((card, i) =>
          i === cardIndex
            ? { ...card, paragraphs: card.paragraphs.map((p, j) => (j === paraIndex ? next : p)) }
            : card,
        );
        saveContentField('storyPanel', updated);
      },
    };
  }

  function editReviewField(index: number, field: 'name' | 'text', lineIndex = 0) {
    if (!canEdit) {
      return {};
    }

    return {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = (event.currentTarget.textContent ?? '').trim();
        if (!next) {
          return;
        }
        const updated: Tuple2[] = content.socialProof.map((row, i) => {
          if (i !== index) {
            return row;
          }
          if (field === 'name') {
            return [next, row[1]] as Tuple2;
          }
          const lines = row[1].split('\n');
          lines[lineIndex] = next;
          return [row[0], lines.join('\n')] as Tuple2;
        });
        saveContentField('socialProof', updated);
      },
    };
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
        return content.passOptions.find((pass) => pass.value === buyerForm.passType)?.title ?? '';
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
            {content.passOptions.map((pass) => {
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
      className={canEdit ? 'cm-edit-mode' : undefined}
      onMouseMove={handlePointer}
      style={
        {
          '--spotlight-x': `${spotlight.x}%`,
          '--spotlight-y': `${spotlight.y}%`,
        } as CSSProperties
      }
    >
      {canEdit && saveStatus !== 'idle' && (
        <div className={`cm-save-status cm-save-status-${saveStatus}`} role="status">
          {saveStatus === 'saving' ? '저장 중…' : saveStatus === 'saved' ? '저장됨' : '저장 실패'}
        </div>
      )}

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
            {[...content.badgeLoop, ...content.badgeLoop].map((item, index) => (
              <span key={`${item}-${index}`} {...editStringItem('badgeLoop', index % content.badgeLoop.length)}>{item}</span>
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
              {content.keyFigures.map(([index, value, label], i) => (
                <article key={label}>
                  <span {...editTuple('keyFigures', i, 0)}>{index}</span>
                  <strong {...editTuple('keyFigures', i, 1)}>{value}</strong>
                  <p {...editTuple('keyFigures', i, 2)}>{label}</p>
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
              {content.previewCards.map(([title, desc], i) => (
                <article key={title}>
                  <span {...editTuple('previewCards', i, 0)}>{title}</span>
                  <h3 {...editTuple('previewCards', i, 1)}>{desc}</h3>
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
              {content.selectedMoments.map(([title, desc], index) => (
                <article key={title} className="moment-card">
                  <div className="moment-media">
                    <img src={momentImages[index]} alt="" />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 {...editTuple('selectedMoments', index, 0)}>{title}</h3>
                  <p {...editTuple('selectedMoments', index, 1)}>{desc}</p>
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
            <span {...editHeadingField('manifestoHeading', 'eyebrow')}>{content.manifestoHeading.eyebrow}</span>
            <h3 {...editHeadingField('manifestoHeading', 'title')}>{content.manifestoHeading.title}</h3>
            <div>
              {content.brandManifesto.map((paragraph, i) => (
                <p key={paragraph} {...editStringItem('brandManifesto', i)}>{paragraph}</p>
              ))}
            </div>
          </article>
          <div className="story-panel reveal">
            {content.storyPanel.map((card, cardIndex) => (
              <article key={card.key}>
                <span {...editStoryLabel(cardIndex)}>{card.label}</span>
                {card.paragraphs.map((paragraph, paraIndex) => (
                  <p key={paragraph} {...editStoryParagraph(cardIndex, paraIndex)}>{paragraph}</p>
                ))}
              </article>
            ))}
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
            {content.timelineSections.map((section, sectionIndex) => {
              const items = content.timeline
                .map((row, i) => ({ row, i }))
                .filter(({ row }) => row[0] === section.phase);

              if (items.length === 0) {
                return null;
              }

              return (
                <div className="timeline-group" key={section.phase}>
                  <div className="timeline-group-heading">
                    <h3 {...editArrayObjectField('timelineSections', sectionIndex, 'label')}>{section.label}</h3>
                    <span {...editArrayObjectField('timelineSections', sectionIndex, 'duration')}>{section.duration}</span>
                  </div>
                  <div className="timeline-group-items">
                    {items.map(({ row: [, time, title, desc], i }) => {
                      return (
                        <article key={time}>
                          <div>
                            <h4 {...editTuple('timeline', i, 2)}>{title}</h4>
                            <p {...editTuple('timeline', i, 3)}>{desc}</p>
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
              {content.stations.map((station) => (
                <button
                  key={station.key}
                  type="button"
                  className={selectedStation.key === station.key ? 'active' : ''}
                  onClick={() => setSelectedStationKey(station.key)}
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
              <h3 {...editArrayObjectField('stations', selectedStationIndex, 'title')}>{selectedStation.title}</h3>
              <dl>
                <div>
                  <dt>핵심 큐잉</dt>
                  <dd {...editArrayObjectField('stations', selectedStationIndex, 'cue')}>{selectedStation.cue}</dd>
                </div>
                <div>
                  <dt>효과</dt>
                  <dd {...editArrayObjectField('stations', selectedStationIndex, 'effect')}>{selectedStation.effect}</dd>
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
          {content.recoveryItems.map(([tag, title, desc], i) => (
            <article key={title}>
              <span {...editTuple('recoveryItems', i, 0)}>{tag}</span>
              <h3 {...editTuple('recoveryItems', i, 1)}>{title}</h3>
              <p {...editTuple('recoveryItems', i, 2)}>{desc}</p>
            </article>
          ))}
        </div>
        <div className="guide-grid reveal">
          {content.wellnessGuide.map(([title, desc], i) => (
            <article key={title}>
              <strong {...editTuple('wellnessGuide', i, 0)}>{title}</strong>
              <p {...editTuple('wellnessGuide', i, 1)}>{desc}</p>
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
          {content.awards.map(([title, desc], i) => (
            <article key={title}>
              <div className="award-icon" aria-hidden="true">{title.slice(0, 1)}</div>
              <h3 {...editTuple('awards', i, 0)}>{title}</h3>
              <p {...editTuple('awards', i, 1)}>{desc}</p>
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
            {content.passOptions.map((pass, i) => (
              <article key={pass.value} className={pass.value === 'single' ? 'pass-card featured' : 'pass-card monthly'}>
                <span {...editArrayObjectField('passOptions', i, 'eyebrow')}>{pass.eyebrow}</span>
                <h3 {...editArrayObjectField('passOptions', i, 'title')}>{pass.title}</h3>
                <strong {...editArrayObjectField('passOptions', i, 'price')}>{pass.price}</strong>
                <small {...editArrayObjectField('passOptions', i, 'note')}>{pass.note}</small>
                <p {...editArrayObjectField('passOptions', i, 'desc')}>{pass.desc}</p>
              </article>
            ))}
          </div>
          <div className="earlybird-box">
            <span {...editPricingLogicField('eyebrow')}>{content.pricingLogic.eyebrow}</span>
            <strong {...editPricingLogicField('heading')}>{content.pricingLogic.heading}</strong>
            <p {...editPricingLogicField('description')}>{content.pricingLogic.description}</p>
            <div className="value-list compact">
              {content.valueStack.map(([item, desc], i) => (
                <div key={item}>
                  <span {...editTuple('valueStack', i, 0)}>{item}</span>
                  <strong {...editTuple('valueStack', i, 1)}>{desc}</strong>
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
          {content.socialProof.map(([name, text], i) => (
            <article key={name}>
              <div className="photo-tile" />
              <strong {...editReviewField(i, 'name')}>{name}</strong>
              {text.split('\n').map((line, lineIndex) => (
                <p key={line} {...editReviewField(i, 'text', lineIndex)}>{line}</p>
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
            <p className="eyebrow" {...editHeadingField('operationHeading', 'eyebrow')}>{content.operationHeading.eyebrow}</p>
            <h2 {...editHeadingField('operationHeading', 'title')}>{content.operationHeading.title}</h2>
          </div>
          <div className="operation-grid reveal">
            {content.operationDetails.map(([title, desc], i) => (
              <article key={title}>
                <strong {...editTuple('operationDetails', i, 0)}>{title}</strong>
                <p {...editTuple('operationDetails', i, 1)}>{desc}</p>
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
          <p {...editIdentityIntro()}>{content.identityIntro}</p>
          <div className="gallery-strip">
            {content.identityGallery.map((label, i) => (
              <span key={label} {...editStringItem('identityGallery', i)}>{label}</span>
            ))}
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
                {content.passOptions.find((pass) => pass.value === buyerForm.passType)?.title} ·{' '}
                {content.passOptions.find((pass) => pass.value === buyerForm.passType)?.price}
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
