/*
  여행지로 고를 수 있는 지역입니다.
  백엔드에 지역 목록 API가 없어서, 백엔드 DB 초기 데이터(V3__seed_regions.sql)의 번호를 그대로 옮겨 적었습니다.
  AI 일정 생성을 지원하는 지역(서울·부산·제주·경주·전주)만 보여줍니다.
  백엔드에 지역 목록 API가 생기면 이 파일 대신 API로 불러오도록 바꿉니다.
*/

export interface SubRegion {
  id: number;
  name: string;
}

export interface RegionGroup {
  key: string;
  name: string;
  subRegions: SubRegion[];
}

const toSubRegions = (startId: number, names: string[]): SubRegion[] =>
  names.map((name, index) => ({ id: startId + index, name }));

export const REGION_GROUPS: RegionGroup[] = [
  {
    key: 'seoul',
    name: '서울',
    subRegions: toSubRegions(1, [
      '강남구',
      '강동구',
      '강북구',
      '강서구',
      '관악구',
      '광진구',
      '구로구',
      '금천구',
      '노원구',
      '도봉구',
      '동대문구',
      '동작구',
      '마포구',
      '서대문구',
      '서초구',
      '성동구',
      '성북구',
      '송파구',
      '양천구',
      '영등포구',
      '용산구',
      '은평구',
      '종로구',
      '중구',
      '중랑구',
    ]),
  },
  {
    key: 'busan',
    name: '부산',
    subRegions: toSubRegions(26, [
      '강서구',
      '금정구',
      '기장군',
      '남구',
      '동구',
      '동래구',
      '부산진구',
      '북구',
      '사상구',
      '사하구',
      '서구',
      '수영구',
      '연제구',
      '영도구',
      '중구',
      '해운대구',
    ]),
  },
  {
    key: 'jeju',
    name: '제주',
    subRegions: [
      { id: 227, name: '제주시' },
      { id: 228, name: '서귀포시' },
    ],
  },
  { key: 'gyeongju', name: '경주', subRegions: [{ id: 189, name: '경주시' }] },
  { key: 'jeonju', name: '전주', subRegions: [{ id: 163, name: '전주시' }] },
];

export interface SelectedRegion {
  groupKey: string;
  subRegionId: number;
  /** 화면에 보여줄 이름. 예: "서울 강남구", "경주시" */
  label: string;
}

export function toSelectedRegion(group: RegionGroup, subRegion: SubRegion): SelectedRegion {
  const label = group.subRegions.length > 1 ? `${group.name} ${subRegion.name}` : subRegion.name;
  return { groupKey: group.key, subRegionId: subRegion.id, label };
}
