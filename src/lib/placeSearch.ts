import type { PlaceSearchCircle } from '../constants/placeSearchAreas';
import { loadGoogleMaps } from './googleMaps';

export interface PlaceSearchResult {
  googlePlaceId: string;
  name: string;
  categoryName: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  placeUrl: string | null;
}

const SEARCH_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'primaryTypeDisplayName',
  'nationalPhoneNumber',
  'googleMapsURI',
];

const MAX_RESULTS_PER_AREA = 20;
const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

function isInsideArea(latitude: number, longitude: number, area: PlaceSearchCircle[]): boolean {
  return area.some(
    (circle) =>
      distanceMeters(circle.latitude, circle.longitude, latitude, longitude) <= circle.radiusMeters,
  );
}

/** 원을 감싸는 사각형. Text Search의 locationRestriction은 사각형만 받아요. */
function toBounds(circle: PlaceSearchCircle): google.maps.LatLngBoundsLiteral {
  const latDelta = (circle.radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos(toRadians(circle.latitude));
  return {
    north: circle.latitude + latDelta,
    south: circle.latitude - latDelta,
    east: circle.longitude + lngDelta,
    west: circle.longitude - lngDelta,
  };
}

/** "대한민국 경상북도 경주시 …" → "경상북도 경주시 …" */
function trimCountry(address: string | null | undefined): string | null {
  if (!address) return null;
  return address.replace(/^대한민국\s*/, '').trim() || null;
}

function toResult(place: google.maps.places.Place): PlaceSearchResult | null {
  const location = place.location;
  if (!place.id || !place.displayName || !location) return null;
  return {
    googlePlaceId: place.id,
    name: place.displayName,
    categoryName: place.primaryTypeDisplayName ?? null,
    address: trimCountry(place.formattedAddress),
    latitude: location.lat(),
    longitude: location.lng(),
    phone: place.nationalPhoneNumber ?? null,
    placeUrl: place.googleMapsURI ?? null,
  };
}

/**
 * Google Places(New) Text Search로 장소를 찾습니다.
 * 원마다 사각형 범위로 검색한 뒤, 원 밖(사각형 모서리)의 결과는 버려서 지역 범위 안의 장소만 돌려줘요.
 */
export async function searchPlacesInArea(
  query: string,
  area: PlaceSearchCircle[],
): Promise<PlaceSearchResult[]> {
  await loadGoogleMaps();
  const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;

  const responses = await Promise.all(
    area.map((circle) =>
      Place.searchByText({
        textQuery: query,
        fields: SEARCH_FIELDS,
        locationRestriction: toBounds(circle),
        language: 'ko',
        region: 'kr',
        maxResultCount: MAX_RESULTS_PER_AREA,
      }),
    ),
  );

  const seen = new Set<string>();
  const results: PlaceSearchResult[] = [];
  for (const { places } of responses) {
    for (const place of places) {
      const result = toResult(place);
      if (!result || seen.has(result.googlePlaceId)) continue;
      if (!isInsideArea(result.latitude, result.longitude, area)) continue;
      seen.add(result.googlePlaceId);
      results.push(result);
    }
  }
  return results;
}
