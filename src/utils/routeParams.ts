/** 백엔드의 양수 숫자 ID 형식과 일치하는 경로 파라미터인지 확인합니다. */
export function isValidNumericRouteId(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}
