/*
  여행지로 고를 수 있는 곳입니다. 백엔드가 AI 일정 생성 요청에 보내는 지역 값
  (서울·경주·부산·전주·제주, ScheduleGenerationServiceImpl.resolveAiRegion)과 같게 맞췄습니다.

  여행방 만들기 API는 세부 지역 번호(subRegionId)를 받으므로, 도시마다 백엔드 DB 초기 데이터
  (V3__seed_regions.sql)의 대표 지역 하나를 연결했습니다. AI에는 도시 이름만 전달되어
  어느 세부 지역을 골라도 같은 도시로 처리됩니다.
  백엔드에 지역 목록 API가 생기면 이 파일 대신 API로 불러오도록 바꿉니다.
*/

export interface TripDestination {
  /** 백엔드 sub_regions.id */
  subRegionId: number;
  /** 화면에 보여줄 이름 (AI 요청 값과 같음) */
  name: string;
}

export const TRIP_DESTINATIONS: TripDestination[] = [
  { subRegionId: 24, name: '서울' }, // 서울특별시 중구
  { subRegionId: 189, name: '경주' }, // 경상북도 경주시
  { subRegionId: 40, name: '부산' }, // 부산광역시 중구
  { subRegionId: 163, name: '전주' }, // 전북특별자치도 전주시
  { subRegionId: 227, name: '제주' }, // 제주특별자치도 제주시
];

export interface SelectedRegion {
  subRegionId: number;
  label: string;
}

export function toSelectedRegion(destination: TripDestination): SelectedRegion {
  return { subRegionId: destination.subRegionId, label: destination.name };
}

/**
 * 백엔드가 알려준 지역을 여행지 이름으로 바꿉니다. (예: 서울특별시 중구 → 서울)
 * 목록에 없는 지역이면 백엔드 이름을 그대로 씁니다.
 */
export function getDestinationName(
  subRegionId: string | number,
  fallback: { broadRegionName: string; subRegionName: string },
): string {
  const destination = TRIP_DESTINATIONS.find((item) => item.subRegionId === Number(subRegionId));
  return destination?.name ?? `${fallback.broadRegionName} ${fallback.subRegionName}`;
}
