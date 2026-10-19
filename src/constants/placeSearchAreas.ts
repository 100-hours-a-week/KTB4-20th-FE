/**
 * 장소 검색을 허용하는 지역별 원형 범위입니다.
 * AI 서버(KTB4-20th-AI)의 장소 수집 범위(app/trips/services/collect_places.py의 REGIONS)와 같은 값을 씁니다.
 * 제주는 바다가 많이 포함되지 않도록 제주시권·서귀포권 두 원으로 나눠요.
 */
export interface PlaceSearchCircle {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

const PLACE_SEARCH_AREAS: Record<string, PlaceSearchCircle[]> = {
  'REGION-SEOUL': [{ latitude: 37.5665, longitude: 126.978, radiusMeters: 18_000 }],
  'REGION-GYEONGJU': [{ latitude: 35.8367, longitude: 129.211, radiusMeters: 13_000 }],
  'REGION-BUSAN': [{ latitude: 35.1796, longitude: 129.0756, radiusMeters: 15_000 }],
  'REGION-JEONJU': [{ latitude: 35.8181703, longitude: 127.1535972, radiusMeters: 8_000 }],
  'REGION-JEJU': [
    { latitude: 33.499461, longitude: 126.530167, radiusMeters: 15_000 },
    { latitude: 33.2541, longitude: 126.5601, radiusMeters: 15_000 },
  ],
};

/** 여행 지역 코드(GET /api/trips/{tripId}의 region.regionCode)에 해당하는 검색 범위. 지원하지 않는 지역이면 null */
export function getPlaceSearchArea(regionCode: string): PlaceSearchCircle[] | null {
  return PLACE_SEARCH_AREAS[regionCode] ?? null;
}
