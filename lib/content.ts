// Auto-generated default content model for the WYSIWYG site editor.
// Every field here is what the public site shows until an admin override
// exists in the content_blocks table (see db/content.ts).

export type Tuple2 = [string, string];
export type Tuple3 = [string, string, string];
export type Tuple4 = [string, string, string, string];

export type StationContent = {
  key: string;
  title: string;
  video: string;
  cue: string;
  effect: string;
};

export type PassOptionContent = {
  value: string;
  eyebrow: string;
  title: string;
  price: string;
  note: string;
  desc: string;
};

export type TimelineSectionContent = {
  phase: string;
  label: string;
  duration: string;
};

export type StoryPanelCard = {
  key: string;
  label: string;
  paragraphs: string[];
};

export type HeadingContent = {
  eyebrow: string;
  title: string;
};

export type PricingLogicContent = {
  eyebrow: string;
  heading: string;
  description: string;
};

export type ContentData = {
  badgeLoop: string[];
  keyFigures: Tuple3[];
  previewCards: Tuple2[];
  socialProof: Tuple2[];
  selectedMoments: Tuple2[];
  manifestoHeading: HeadingContent;
  brandManifesto: string[];
  storyPanel: StoryPanelCard[];
  timeline: Tuple4[];
  timelineSections: TimelineSectionContent[];
  stations: StationContent[];
  recoveryItems: Tuple3[];
  wellnessGuide: Tuple2[];
  operationHeading: HeadingContent;
  operationDetails: Tuple2[];
  awards: Tuple2[];
  valueStack: Tuple2[];
  pricingLogic: PricingLogicContent;
  passOptions: PassOptionContent[];
  identityIntro: string;
  identityGallery: string[];
};

export const DEFAULT_CONTENT: ContentData = {
  badgeLoop: [
  'Night Court',
  'Circuit Training',
  'Wellness Recovery',
  'Social Relay',
  'Purple Lights',
  'Team Energy',
  'Healthy Exchange',
],
  keyFigures: [
  ['01', '180+', '누적 참가자'],
  ['02', '83%', '1인 참가 비율'],
  ['03', '6', '서킷 종목'],
  ['04', '4', '어워즈 부문'],
  ['05', '150', '분 세션'],
  ['06', '2', '패스 선택지'],
] as Tuple3[],
  previewCards: [
  ['Warm-up', '관절 가동성, 호흡, 코트 적응'],
  ['Main Circuit', '하체, 코어, 파워, 밸런스 6스테이션'],
  ['Team Relay', '순발력 코트 터치 게임과 대형 이어달리기'],
] as Tuple2[],
  socialProof: [
  ['@shmasus_1', '혼자 갈까 말까 진짜 고민했는데, 막상 서킷 돌면서 같이 땀 흘리다 보니까 대화를 안 했어도 어느새 옆 사람이랑 자연스럽게 친해져 있더라고요.'],
  ['@gah_y.n', '운동 처음이라 걱정했는데 스스로 난이도를 조절 할 수 있어서 끝까지 제 페이스로 따라갈 수 있었어요. 운동 후 과일 케이터링 바도 신선해서 좋았어요'],
  ['@awf_sacri', '술 없이도 이렇게 텐션 오르는 모임은 처음이었어요. 음악이 코트 전체를 울리니까 운동하는 맛이 났어요'],
  ['@osrmwt', '순발력 미니게임이랑 팀 이어달리기가 재밌었어요\n서킷에서는 다 같이 응원하며 서로서로 밀어 붙인게 아직도 기억나요. 운동하고 나니 엄청 상쾌했어요'],
] as Tuple2[],
  selectedMoments: [
  ['Opening Rally', '웰컴 드링크와 팀 배정이 시작되는 입장 장면'],
  ['Station Heat', '보랏빛 조명 아래 이어지는 6스테이션 전신 서킷'],
  ['Relay Peak', '응원과 기록이 동시에 터지는 팀 이어달리기'],
  ['Recovery Table', '치킨 샌드위치, 과일컵, 전해질 드링크로 마무리'],
] as Tuple2[],
  manifestoHeading: {
    eyebrow: 'Brand Manifesto',
    title: '서킷메이트의 핵심 철학 및 브랜드 선언문',
  },
  brandManifesto: [
  '에너지는 함께할수록 증폭됩니다.',
  '여기는 서로의 에너지를 빌리고 나눌 수 있는 거대한 에너지의 장입니다.',
  '밝은 에너지를 가진 사람들이 모이면, 그 강한 진동은 각자의 에너지를 흔들어 깨웁니다.',
  '땀 흘리며 서킷을 돌고, 내 몸이 스스로 만들어내는 건강한 활기를 즐기는 것, 그것이 우리가 주고자 하는 핵심 경험입니다.',
  '토요일 저녁, 서로의 에너지를 나누며 삶에 강렬한 활력을 채워가세요.',
  '여러분과 함께 활력 가득한 밤을 만들 수 있어 기쁩니다.',
],
  storyPanel: [
    {
      key: 'mission',
      label: 'Mission',
      paragraphs: [
        '건강한 몰입, 절제된 분위기, 회복의 시간을 통해 일회성 파티보다 오래 남는 연결을 만듭니다.',
      ],
    },
    {
      key: 'community',
      label: 'Community',
      paragraphs: [
        '개인의 기록보다 팀의 완주와 응원을 우선하는 웰니스 소셜링 규칙을 운영합니다.',
      ],
    },
    {
      key: 'space',
      label: 'Space',
      paragraphs: [
        '미래적 낙관을 표현한 1960년대 디자인 컨셉 \'스페이스 에이지(Space Age)\'를 반영했습니다.',
        '일상에서 완전히 분리된 이 비일상의 90분은,',
        '평소의 나를 잠시 내려놓고 온전히 움직임과 에너지에만 몰입하게 만들기 위함입니다.',
      ],
    },
  ],
  timeline: [
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
] as Tuple4[],
  timelineSections: [
  { phase: '준비 운동', label: '준비 운동', duration: '30분' },
  { phase: '메인 서킷', label: '메인 서킷', duration: '20분' },
  { phase: '마무리 운동', label: '마무리 운동', duration: '20분' },
  { phase: '리커버리', label: '리커버리', duration: '10분' },
  { phase: '시상 & 마감', label: '시상식', duration: '10분' },
],
  stations: [
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
],
  recoveryItems: [
  ['Vitamin', '제철 과일컵', '수분과 비타민을 동시에 채우는 상큼한 마무리.'],
  ['Hydrate', '전해질 드링크', '땀으로 빠져나간 수분과 미네랄 밸런스를 회복합니다.'],
] as Tuple3[],
  wellnessGuide: [
  ['회복 루틴', '종아리, 둔근, 어깨 순서로 스트레칭해 다음날 피로를 줄입니다.'],
] as Tuple2[],
  operationHeading: {
    eyebrow: 'Operation Detail',
    title: '혼자 와도 자연스럽고, 초보도 안전하게 움직이는 현장 운영',
  },
  operationDetails: [
  ['입장 데스크', '참가자 전원에게 팀 컬러 손목 밴드를 배부하고, 혼자 온 참가자도 자연스럽게 해당 컬러 구역으로 이동합니다.'],
  ['서킷 스테이션', '각 스테이션마다 초급 / 중급 / 고급 3단계 난이도 픽토그램 보드를 거치합니다.'],
  ['리커버리 전환', '쿨다운 BGM과 함께 과일 바를 오픈합니다.'],
] as Tuple2[],
  awards: [
  ['허슬상', '끝까지 밀어붙인 에너지와 성실한 태도를 기념합니다.'],
  ['분위기 메이커', '팀의 긴장을 풀고 모두의 몰입을 끌어올린 참가자에게.'],
  ['베스트 드레서', '코트 조명 아래 가장 선명한 에슬레저 룩을 선정합니다.'],
  ['챔피언', '미니게임과 릴레이를 종합해 그날의 팀 퍼포먼스를 축하합니다.'],
] as Tuple2[],
  valueStack: [
  ['단발 참여', '이번 주 가능한 회차만 결제'],
  ['손해 제로', '못 나오는 주에는 결제 0원'],
  ['루틴 고정', '월간 패스는 회당 단가 절감'],
  ['유연 운영', '잔여 횟수 이월 또는 스케줄 변경'],
] as Tuple2[],
  pricingLogic: {
    eyebrow: 'Pricing Logic',
    heading: '혜택',
    description: '원데이는 원하는 회차의 23,000원 티켓만 구매하고, 월간 패스는 꾸준한 참가자에게 더 낮은 회당 단가와 유연한 일정 변경을 제공합니다.',
  },
  passOptions: [
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
],
  identityIntro: '코트 조명, 탄성 바닥, 탈의실과 정수기 등 편의시설을 사전 안내해 첫 방문의 불안을 줄입니다.',
  identityGallery: [
    'COURT',
    'LIGHT',
    'RECOVERY',
  ],
};

const CONTENT_KEYS = Object.keys(DEFAULT_CONTENT) as (keyof ContentData)[];

export function isContentKey(key: string): key is keyof ContentData {
  return (CONTENT_KEYS as string[]).includes(key);
}

export function mergeContent(overrides: Partial<ContentData> | null | undefined): ContentData {
  if (!overrides) {
    return DEFAULT_CONTENT;
  }

  const merged = { ...DEFAULT_CONTENT } as ContentData;

  for (const key of CONTENT_KEYS) {
    const value = overrides[key];
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

