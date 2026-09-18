import { env } from 'cloudflare:workers';
import { getContent, saveContentBlock } from '../../../db/content';

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
  return error instanceof Error ? error.message : '콘텐츠를 처리하지 못했습니다.';
}

export async function GET() {
  try {
    const content = await getContent();

    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: '관리자 비밀번호를 확인해주세요.' }, { status: 401 });
    }

    const payload = (await request.json()) as { key?: string; value?: unknown };

    if (!payload.key || payload.value === undefined) {
      return Response.json({ error: 'key와 value가 필요합니다.' }, { status: 400 });
    }

    const content = await saveContentBlock(payload.key, payload.value);

    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
