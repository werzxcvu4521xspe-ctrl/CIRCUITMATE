import { env } from 'cloudflare:workers';
import { DEFAULT_SITE_MAP, normalizeSiteMap, type SiteSection } from '../lib/site-map';

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

async function ensureSiteSectionsTable() {
  const db = getDb();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS site_sections (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        href TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        visible INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
}

export async function getSiteMap() {
  await ensureSiteSectionsTable();

  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT id, label, href, title, description, visible, sort_order
       FROM site_sections
       ORDER BY sort_order ASC`
    )
    .all<{
      id: string;
      label: string;
      href: string;
      title: string;
      description: string;
      visible: number;
      sort_order: number;
    }>();

  if (!results?.length) {
    return DEFAULT_SITE_MAP;
  }

  return normalizeSiteMap(
    results.map((section) => ({
      id: section.id,
      label: section.label,
      href: section.href,
      title: section.title,
      description: section.description,
      visible: section.visible === 1,
      order: section.sort_order,
    }))
  );
}

export async function saveSiteMap(sections: SiteSection[]) {
  await ensureSiteSectionsTable();

  const db = getDb();
  const normalized = normalizeSiteMap(sections);

  for (const section of normalized) {
    await db
      .prepare(
        `INSERT INTO site_sections (id, label, href, title, description, visible, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           label = excluded.label,
           href = excluded.href,
           title = excluded.title,
           description = excluded.description,
           visible = excluded.visible,
           sort_order = excluded.sort_order,
           updated_at = CURRENT_TIMESTAMP`
      )
      .bind(
        section.id,
        section.label,
        section.href,
        section.title,
        section.description,
        section.visible ? 1 : 0,
        section.order
      )
      .run();
  }

  return normalized;
}
