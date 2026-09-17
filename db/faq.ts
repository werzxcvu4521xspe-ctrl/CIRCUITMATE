import { env } from 'cloudflare:workers';
import { DEFAULT_FAQ_ITEMS, normalizeFaqItems, type FaqItem } from '../lib/faq';

type RuntimeEnv = {
  DB?: D1Database;
};

function getDb() {
  const db = (env as RuntimeEnv).DB;

  if (!db) {
    throw new Error('사이트 설정 데이터베이스 연결을 사용할 수 없습니다.');
  }

  return db;
}

async function ensureFaqTable() {
  const db = getDb();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS faq_items (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL DEFAULT '[]',
        table_data TEXT,
        bullets TEXT,
        note TEXT,
        visible INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
}

export async function getFaqItems(): Promise<FaqItem[]> {
  await ensureFaqTable();

  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT id, question, answer, table_data, bullets, note, visible, sort_order
       FROM faq_items
       ORDER BY sort_order ASC`
    )
    .all<{
      id: string;
      question: string;
      answer: string;
      table_data: string | null;
      bullets: string | null;
      note: string | null;
      visible: number;
      sort_order: number;
    }>();

  if (!results?.length) {
    return DEFAULT_FAQ_ITEMS;
  }

  return normalizeFaqItems(
    results.map((row) => ({
      id: row.id,
      question: row.question,
      answer: safeParse(row.answer, []),
      table: row.table_data ? safeParse(row.table_data, undefined) : undefined,
      bullets: row.bullets ? safeParse(row.bullets, undefined) : undefined,
      note: row.note ?? undefined,
      visible: row.visible === 1,
      order: row.sort_order,
    }))
  );
}

export async function saveFaqItems(items: FaqItem[]) {
  await ensureFaqTable();

  const db = getDb();
  const normalized = normalizeFaqItems(items);

  const statements = [
    db.prepare('DELETE FROM faq_items'),
    ...normalized.map((item, index) =>
      db
        .prepare(
          `INSERT INTO faq_items (id, question, answer, table_data, bullets, note, visible, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          item.id,
          item.question,
          JSON.stringify(item.answer ?? []),
          item.table ? JSON.stringify(item.table) : null,
          item.bullets ? JSON.stringify(item.bullets) : null,
          item.note ?? null,
          item.visible ? 1 : 0,
          index + 1
        )
    ),
  ];

  await db.batch(statements);

  return normalized.map((item, index) => ({ ...item, order: index + 1 }));
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
