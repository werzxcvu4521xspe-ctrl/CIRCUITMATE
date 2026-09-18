import { env } from 'cloudflare:workers';
import { getReservationsDb, normalizeStatus, type Reservation } from '../../../db/reservations';

type RuntimeEnv = {
  ADMIN_PASSWORD?: string;
};

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePassType(value: unknown) {
  return value === 'monthly' ? 'monthly' : 'single';
}

function isAuthorized(request: Request) {
  const adminPassword = (env as RuntimeEnv).ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    throw new Error('관리자 비밀번호 설정이 필요합니다.');
  }

  return request.headers.get('x-admin-password') === adminPassword;
}

function toErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '예상하지 못한 오류가 발생했습니다.';

  if (message.includes('no such table') || message.includes('reservations')) {
    return '예약 테이블을 아직 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  return message;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: '관리자 비밀번호를 확인해주세요.' }, { status: 401 });
    }

    const db = getReservationsDb();
    const { results } = await db
      .prepare(
        `SELECT id, name, phone, instagram, gender, session, level, party, companion_name, pass_type, status, source, created_at
         FROM reservations
         ORDER BY datetime(created_at) DESC, id DESC
         LIMIT 200`
      )
      .all<Reservation>();

    return Response.json({ reservations: results ?? [] });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const name = asText(payload.name);
    const phone = asText(payload.phone);
    const instagram = asText(payload.instagram);
    const gender = asText(payload.gender);
    const session = asText(payload.session);
    const level = asText(payload.level) || '입문자';
    const party = asText(payload.party) || '개인 신청';
    const companionName = asText(payload.companionName);
    const passType = normalizePassType(payload.passType);
    const source = asText(payload.source) || 'main';

    if (!name || !phone || !session) {
      return Response.json({ error: '성함, 연락처, 일정은 필수입니다.' }, { status: 400 });
    }

    const db = getReservationsDb();
    await db
      .prepare(
        `INSERT INTO reservations (name, phone, instagram, gender, session, level, party, companion_name, pass_type, status, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
      )
      .bind(name, phone, instagram, gender, session, level, party, companionName, passType, source)
      .run();

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: '관리자 비밀번호를 확인해주세요.' }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const id = Number(payload.id);
    const status = normalizeStatus(payload.status);

    if (!Number.isInteger(id) || id < 1 || !status) {
      return Response.json({ error: '변경할 예약과 상태를 확인해주세요.' }, { status: 400 });
    }

    const db = getReservationsDb();
    await db.prepare('UPDATE reservations SET status = ? WHERE id = ?').bind(status, id).run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: '관리자 비밀번호를 확인해주세요.' }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const id = Number(payload.id);

    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ error: '삭제할 예약을 확인해주세요.' }, { status: 400 });
    }

    const db = getReservationsDb();
    await db.prepare('DELETE FROM reservations WHERE id = ?').bind(id).run();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
