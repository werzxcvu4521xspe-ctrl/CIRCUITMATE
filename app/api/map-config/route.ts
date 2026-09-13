import { env } from 'cloudflare:workers';

type RuntimeEnv = {
  NAVER_MAPS_NCP_KEY_ID?: string;
  NAVER_MAP_LAT?: string;
  NAVER_MAP_LNG?: string;
  NAVER_MAP_PLACE_NAME?: string;
  NAVER_MAP_ADDRESS?: string;
  NAVER_MAP_SEARCH_URL?: string;
};

const defaultPlaceName = '플랩 스타디움 가산 벽산디지털밸리 6차';
const defaultAddress = '서울시 금천구 가산디지털1로 219';
const defaultSearchUrl = 'https://naver.me/xOxcjJkf';
const defaultLat = 37.47936;
const defaultLng = 126.8822;

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
  const lat = toCoordinate(runtimeEnv.NAVER_MAP_LAT) ?? defaultLat;
  const lng = toCoordinate(runtimeEnv.NAVER_MAP_LNG) ?? defaultLng;

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
