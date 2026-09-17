export type FaqItem = {
  id: string;
  question: string;
  answer: string[];
  table?: { head: [string, string]; rows: [string, string][] };
  bullets?: string[];
  note?: string;
  visible: boolean;
  order: number;
};

type FaqSeed = {
  question: string;
  answer?: string[];
  table?: { head: [string, string]; rows: [string, string][] };
  bullets?: string[];
  note?: string;
};

const FAQ_SEED: FaqSeed[] = [
  {
    question: '운동을 잘 못하거나 체력이 약한데 따라갈 수 있을까요?',
    answer: [
      "절대 무게나 횟수로 경쟁하지 않습니다. 서킷메이트는 '1분 동안 내 호흡에 맞춰 움직이는 자율 인터벌 방식'입니다. 모든 스테이션에 초심자를 위한 대체 동작(스케일링) 가이드와 전문 코치가 상주하므로 부상 걱정 없이 안전하게 자신의 페이스대로 즐기실 수 있습니다.",
    ],
  },
  {
    question: '혼자 신청해도 어색하거나 겉돌지 않을까요?',
    answer: [
      "참가자의 83%가 혼자 신청합니다. 입장 즉시 컬러 밴드로 5인 1조 팀이 자동 매칭되며, 메인 운동 전 15분간 진행되는 '순발력 미니게임'을 통해 자연스럽게 하이파이브하며 팀원이 됩니다.",
    ],
  },
  {
    question: '일반적인 친목 모임이나 가벼운 헌팅 포차 분위기인가요?',
    answer: [
      "아닙니다. 서킷메이트는 과도한 음주가 없는 100% 클린 웰니스 스포츠 파티입니다. 분 단위로 설계된 고강도 인터벌 서킷과 팀 릴레이, 신선한 생과일 케이터링 바와 4대 어워즈로 구성되어 '진짜 운동과 건강한 에너지'에 몰입합니다.",
    ],
  },
  {
    question: '땀 흘리고 화장이 지워져서 사진 찍기 민망할까 봐 걱정돼요.',
    answer: [
      '운동 종료 직후 땀을 식히고 매무새를 정돈할 수 있는 10분간의 리프레시 & 과일 케이터링 타임이 주어집니다. 시상식과 포토타임은 땀방울마저 탄탄하고 감각적으로 연출되는 전용 보랏빛 무드 조명 아래에서 진행됩니다.',
    ],
  },
  {
    question: '참가비 대비 프로그램 구성이 아깝지 않을까요?',
    answer: [
      '원데이 온디맨드 패스는 23,000원 티켓 1매로 가능한 회차만 구매하는 구조라 못 나오는 주의 손해가 없습니다. 꾸준히 루틴을 만들고 싶다면 회당 단가를 낮춘 선택형 월간 패스로 전환할 수 있습니다.',
    ],
  },
  {
    question: '취소 및 환불 정책',
    answer: ['서킷 시작 시점 대비 취소 환불 규정은 아래 기준으로 적용됩니다.'],
    table: {
      head: ['시점', '환불'],
      rows: [
        ['서킷 2일 전', '무료 취소'],
        ['서킷 1일 전', '80% 환불'],
        ['당일부터 서킷 시작 90분 전까지', '20% 환불'],
        ['서킷 시작 3시간부터 90분 전까지 참가자 10인 이하인 서킷', '무료 취소'],
        ['서킷 시작 90분 이내', '환불 불가'],
      ],
    },
    bullets: [
      '취소 수수료 발생 시 사용된 포인트를 우선 차감 후 차액을 캐시로 지급합니다.',
      '변경은 상단 취소 환불 규정과 동일하게 적용됩니다.',
      '신청 후 30분 이내에는 하루 1회에 한해 무료 취소가 가능합니다. 단, 서킷 시작 90분 이내일 경우 불가합니다.',
      '쿠폰 신청자는 서킷 시작 90분 전까지 취소 시 쿠폰이 반환됩니다. 2026년 10월 5일부터는 서킷 당일 취소 시 사용한 쿠폰이 반환되지 않습니다.',
      '실 결제금액, 쿠폰 제외 기준으로 위 규정에 따라 환불됩니다.',
      '서킷 시작 90분 전까지 최소 인원이 모이지 않을 시 카카오톡 혹은 LMS로 안내되며 자동 전액 환불됩니다. 단, 공지 전 직접 취소하는 경우 상단 일반 환불 규정대로 처리됩니다.',
      '90분 내 취소자로 최소 인원이 미달되거나, 구장 시설에 긴급한 문제가 생긴 경우 서킷 시작 90분 이내라도 서킷을 취소합니다.',
    ],
  },
  {
    question: '안전 유의사항',
    answer: ['서킷메이트는 안전을 최우선으로 생각합니다. 참가 전 아래 내용을 꼭 확인해 주세요.'],
    bullets: [
      '최근 심장/호흡기 질환, 근육·관절 통증이 있다면 서킷 참가는 지양해 주세요.',
      '음주, 과로, 임신 중, 고혈압·저혈압 등 신체적 부담이 큰 상태에서는 신청하지 말아 주세요.',
      '서킷 중 몸에 이상이 느껴지면 바로 플레이를 멈추고 매니저 또는 주변에 알려주세요.',
      '본인의 건강 문제로 인한 사고에 대해서는 운영 측이 책임지지 않습니다.',
    ],
  },
  {
    question: '비상 상황 대응',
    bullets: [
      '응급 상황 발생 시 주변과 매니저에게 즉시 알리고, 필요시 119에 신고해 주세요.',
      '구장 내 비상구 위치를 미리 확인해 주세요.',
    ],
    note: '서킷메이트는 참가자의 자율적 판단 아래 신청하여 진행되는 활동이며, 개인의 건강 문제 및 본인의 귀책 사유로 인한 사고 발생 시 법적 책임을 지지 않습니다.',
  },
  {
    question: '유의 사항',
    bullets: [
      '단순 변심으로 취소 혹은 변경을 요청하는 경우 환불이 불가합니다.',
      '무단 불참하거나 서킷 시작 90분 이내에 취소하면 페널티를 받습니다.',
      '2026년 10월 5일부터 슈퍼서브·매니저서브 무료 참가 신청을 서킷 당일 취소하면 30일간 무료 참가가 제한됩니다.',
      '참가가 어렵다면 원활한 서킷 진행을 위해 일정에서 미리 취소해 주세요.',
    ],
  },
];

export const DEFAULT_FAQ_ITEMS: FaqItem[] = FAQ_SEED.map((item, index) => ({
  question: item.question,
  answer: item.answer ?? [],
  table: item.table,
  bullets: item.bullets,
  note: item.note,
  id: `faq-${index + 1}`,
  visible: true,
  order: index + 1,
}));

function makeFaqId() {
  return `faq-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cleaned = value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim());

  return cleaned.length ? cleaned : undefined;
}

function toFaqTable(value: unknown): FaqItem['table'] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const head =
    Array.isArray(record.head) && record.head.length === 2 && record.head.every((entry) => typeof entry === 'string')
      ? (record.head as [string, string])
      : undefined;
  const rows = Array.isArray(record.rows)
    ? record.rows.filter(
        (row): row is [string, string] =>
          Array.isArray(row) && row.length === 2 && typeof row[0] === 'string' && typeof row[1] === 'string'
      )
    : [];

  if (!head || rows.length === 0) {
    return undefined;
  }

  return { head, rows };
}

export function normalizeFaqItems(value: unknown): FaqItem[] {
  const incoming = Array.isArray(value) ? value : [];

  const normalized = incoming
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const question = typeof record.question === 'string' ? record.question.trim() : '';

      if (!question) {
        return null;
      }

      const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : makeFaqId();
      const answer = toStringArray(record.answer) ?? [];
      const bullets = toStringArray(record.bullets);
      const table = toFaqTable(record.table);
      const note = typeof record.note === 'string' && record.note.trim() ? record.note.trim() : undefined;
      const visible = typeof record.visible === 'boolean' ? record.visible : true;
      const order =
        typeof record.order === 'number' && Number.isFinite(record.order) ? record.order : index + 1;

      const item: FaqItem = { id, question, answer, visible, order };

      if (table) item.table = table;
      if (bullets) item.bullets = bullets;
      if (note) item.note = note;

      return item;
    })
    .filter((item): item is FaqItem => item !== null);

  if (normalized.length === 0) {
    return DEFAULT_FAQ_ITEMS;
  }

  return normalized
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}
