import { env } from 'cloudflare:workers';

type RuntimeEnv = {
  NAVER_MAPS_NCP_KEY_ID?: string;
  NAVER_MAP_LAT?: string;
  NAVER_MAP_LNG?: string;
  NAVER_MAP_PLACE_NAME?: string;
  NAVER_MAP_ADDRESS?: string;
  NAVER_MAP_SEARCH_URL?: string;
  NAVER_MAP_CUSTOM_STYLE_ID?: string;
  NAVER_MAP_CUSTOM_STYLE_VERSION?: string;
};

const defaultPlaceName = '충남대학교 정문 앞 서브웨이 건물 8층';
const defaultAddress = '대전 유성구 궁동 482-3';
const defaultSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(defaultAddress)}`;
// TODO: 네이버 지도 API 키 연결 시 NAVER_MAP_LAT / NAVER_MAP_LNG 환경변수로
// 정확한 좌표를 지정해주세요 (현재 값은 이전 장소인 가산디지털밸리 좌표입니다).
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
    customStyleId: toTrimmedText(runtimeEnv.NAVER_MAP_CUSTOM_STYLE_ID),
    customStyleVersion: toTrimmedText(runtimeEnv.NAVER_MAP_CUSTOM_STYLE_VERSION),
  });
}
