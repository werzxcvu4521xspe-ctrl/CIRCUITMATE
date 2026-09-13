import { env } from 'cloudflare:workers';
import { getSiteMap, saveSiteMap } from '../../../db/site-map';
import { normalizeSiteMap } from '../../../lib/site-map';

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
  return error instanceof Error ? error.message : '사이트맵 설정을 처리하지 못했습니다.';
}

export async function GET() {
  try {
    const sections = await getSiteMap();

    return Response.json({ sections });
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
    const sections = normalizeSiteMap(payload.sections);
    const saved = await saveSiteMap(sections);

    return Response.json({ sections: saved });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
