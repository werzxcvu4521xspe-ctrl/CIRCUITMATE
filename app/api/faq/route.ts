import { env } from 'cloudflare:workers';
import { getFaqItems, saveFaqItems } from '../../../db/faq';
import { normalizeFaqItems } from '../../../lib/faq';

type RuntimeEnv = {
  ADMIN_PASSWORD?: string;
};

function isAuthorized(request: Request) {
  const adminPassword = (env as RuntimeEnv).ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    throw new Error('관리자 비밀번호 설정이 필요합니다.');
  }

  return request.headers.get('x-admin-password') === adminPassword;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'FAQ 설정을 처리하지 못했습니다.';
}

export async function GET() {
  try {
    const items = await getFaqItems();

    return Response.json({ items });
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
    const items = normalizeFaqItems(payload.items);
    const saved = await saveFaqItems(items);

    return Response.json({ items: saved });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
