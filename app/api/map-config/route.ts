import { env } from 'cloudflare:workers';

type RuntimeEnv = {
  NAVER_MAPS_NCP_KEY_ID?: string;
  NAVER_MAP_LAT?: string;
  NAVER_MAP_LNG?: string;
  NAVER_MAP_PLACE_NAME?: string;
  NAVER_MAP_ADDRESS?: string;
  NAVER_MAP_SEARCH_URL?: string;
};

const defaultPlaceName = '실내테니스팡';
const defaultAddress = '상세 주소 확인 중';
const defaultSearchUrl = 'https://map.naver.com/p/search/%EC%8B%A4%EB%82%B4%ED%85%8C%EB%8B%88%EC%8A%A4%ED%8C%A1';

function toTrimmedText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toCoordinate(value: unknown) {
  const coordinate = Number(toTrimmedText(value));

  return Number.isFinite(coordinate) ? coordinate : null;
}

export async function GET() {
  const runtimeEnv = env as RuntimeEnv;
  const keyId = toTrimmedText(runtimeEnv.NAVER_MAPS_NCP_KEY_ID);
  const lat = toCoordinate(runtimeEnv.NAVER_MAP_LAT);
  const lng = toCoordinate(runtimeEnv.NAVER_MAP_LNG);

  return Response.json({
    configured: Boolean(keyId && lat !== null && lng !== null),
    keyId,
    lat,
    lng,
    placeName: toTrimmedText(runtimeEnv.NAVER_MAP_PLACE_NAME) || defaultPlaceName,
    address: toTrimmedText(runtimeEnv.NAVER_MAP_ADDRESS) || defaultAddress,
    searchUrl: toTrimmedText(runtimeEnv.NAVER_MAP_SEARCH_URL) || defaultSearchUrl,
  });
}
