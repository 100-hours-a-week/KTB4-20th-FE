/** 취향 설문 카테고리 코드별 화면 이름 (설문 화면과 여행방 취향 종합이 함께 씁니다) */
export const SURVEY_CATEGORY_LABELS: Record<string, string> = {
  HISTORY_CULTURE: '역사·문화',
  NATURE: '자연·힐링',
  FOOD: '미식',
  ACTIVITY_ENTERTAINMENT: '액티비티',
  CONVENIENCE_RELAXATION: '편의·쇼핑',
};

/**
 * 백엔드 제외 항목 이름을 화면용으로 바꿉니다. (예: "시끄러운_곳" → "시끄러운 곳")
 * 백엔드 데이터에 밑줄이 들어 있어서, 설문 화면과 같은 방식으로 밑줄을 띄어쓰기로 바꿉니다.
 */
export function formatExclusionName(name: string): string {
  return name.replace(/_/g, ' ');
}
