import { env } from 'cloudflare:workers';
import { DEFAULT_CONTENT, isContentKey, type ContentData } from '../lib/content';

type RuntimeEnv = {
  DB?: D1Database;
};

function getDb() {
  const db = (env as RuntimeEnv).DB;

  if (!db) {
    throw new Error('콘텐츠 데이터베이스 연결을 사용할 수 없습니다.');
  }

  return db;
}

async function ensureContentBlocksTable() {
  const db = getDb();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS content_blocks (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getContent(): Promise<ContentData> {
  await ensureContentBlocksTable();

  const db = getDb();
  const { results } = await db
    .prepare(`SELECT key, value FROM content_blocks`)
    .all<{ key: string; value: string }>();

  const merged = { ...DEFAULT_CONTENT } as ContentData;

  for (const row of results ?? []) {
    if (isContentKey(row.key)) {
      (merged as Record<string, unknown>)[row.key] = safeParse(
        row.value,
        (DEFAULT_CONTENT as Record<string, unknown>)[row.key]
      );
    }
  }

  return merged;
}

export async function saveContentBlock(key: string, value: unknown): Promise<ContentData> {
  if (!isContentKey(key)) {
    throw new Error(`알 수 없는 콘텐츠 항목입니다: ${key}`);
  }

  await ensureContentBlocksTable();

  const db = getDb();

  await db
    .prepare(
      `INSERT INTO content_blocks (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(key, JSON.stringify(value))
    .run();

  return getContent();
}
