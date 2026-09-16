export type SiteSectionId = 'home' | 'brand' | 'program' | 'recovery' | 'awards' | 'pricing' | 'review' | 'booking' | 'faq' | 'location' | 'identity';

export type SiteSection = {
  id: SiteSectionId;
  label: string;
  href: string;
  title: string;
  description: string;
  visible: boolean;
  order: number;
};

export const DEFAULT_SITE_MAP: SiteSection[] = [
  {
    id: 'home',
    label: '01. Home',
    href: '#home',
    title: 'CIRCUITMATE',
    description: '땀 흘린 뒤 찾아오는 가장 건강한 교류',
    visible: true,
    order: 1,
  },
  {
    id: 'brand',
    label: '02. Brand',
    href: '#brand',
    title: '건강한 땀과 진정성 있는 교류를 만드는 나이트 웰니스 커뮤니티',
    description: '서킷메이트는 운동을 매개로 낯선 사람들이 서로의 에너지를 안전하게 나누는 새로운 스포츠 소셜 문화를 지향합니다.',
    visible: true,
    order: 2,
  },
  {
    id: 'program',
    label: '03. Program',
    href: '#program',
    title: '19:00-21:30 상세 타임라인과 종목별 가이드',
    description: '',
    visible: true,
    order: 3,
  },
  {
    id: 'recovery',
    label: '04. Recovery',
    href: '#recovery',
    title: '리커버리 테이블과 운동 후 회복 가이드',
    description: '카드형 메뉴 소개와 텍스트 기반 웰니스 가이드로 운동 뒤 필요한 선택을 명확하게 보여줍니다.',
    visible: true,
    order: 4,
  },
  {
    id: 'awards',
    label: '05. Awards',
    href: '#awards',
    title: '시상식의 취지와 유쾌한 분위기를 전하는 네 가지 부문',
    description: '현장 분위기를 끌어올리는 어워즈와 포토 타임을 한 흐름으로 운영합니다.',
    visible: true,
    order: 5,
  },
  {
    id: 'pricing',
    label: '06. Pricing',
    href: '#pricing',
    title: '필요한 날만 결제하거나, 루틴으로 투자하거나',
    description: '서킷메이트는 단발 참여의 부담 없는 진입과 꾸준한 참석을 위한 선택형 월간 패스를 함께 운영합니다.',
    visible: true,
    order: 6,
  },
  {
    id: 'review',
    label: '07. Review',
    href: '#review',
    title: '안전하고 깨끗한 웰니스 스포츠 파티라는 약속',
    description: '혼자 와도 자연스럽고, 땀 흘린 뒤에도 건강한 에너지로 연결되는 경험을 후기 흐름으로 보여줍니다.',
    visible: true,
    order: 7,
  },
  {
    id: 'booking',
    label: '08. Booking',
    href: '#booking',
    title: '일정 선택부터 티켓 구매까지 한 번에',
    description: '날짜/시간 선택, 잔여 티켓 확인, 구매자 정보, 체크리스트 동의, 결제 안내를 단계별로 배치했습니다.',
    visible: true,
    order: 8,
  },
  {
    id: 'faq',
    label: '09. FAQ',
    href: '#faq',
    title: '자주 묻는 질문',
    description: '환불 규정, 준비물, 초보자 안내 등 참가 전 자주 묻는 질문을 모았습니다.',
    visible: true,
    order: 9,
  },
  {
    id: 'location',
    label: '10. Location',
    href: '#location',
    title: '오시는 길',
    description: '네이버 지도 연동과 입장부터 회복까지 현장 운영 흐름을 고려한 길찾기 안내를 담았습니다.',
    visible: true,
    order: 10,
  },
  {
    id: 'identity',
    label: '11. Identity',
    href: '#identity',
    title: '공간 아이덴티티',
    description: '실내테니스팡의 보랏빛 코트 무드와 편의시설을 사전에 안내합니다.',
    visible: true,
    order: 11,
  },
];

export function normalizeSiteMap(value: unknown): SiteSection[] {
  const incoming = Array.isArray(value) ? value : [];

  return DEFAULT_SITE_MAP.map((fallback) => {
    const section = incoming.find(
      (item): item is Partial<SiteSection> =>
        typeof item === 'object' && item !== null && 'id' in item && item.id === fallback.id
    );

    return {
      ...fallback,
      label: typeof section?.label === 'string' && section.label.trim() ? section.label.trim() : fallback.label,
      title: typeof section?.title === 'string' && section.title.trim() ? section.title.trim() : fallback.title,
      description:
        typeof section?.description === 'string' && section.description.trim()
          ? section.description.trim()
          : fallback.description,
      visible: typeof section?.visible === 'boolean' ? section.visible : fallback.visible,
      order: typeof section?.order === 'number' && Number.isFinite(section.order) ? section.order : fallback.order,
    };
  }).sort((a, b) => a.order - b.order);
}
