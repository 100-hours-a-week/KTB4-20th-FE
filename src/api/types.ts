/** 백엔드 공통 응답 형식 */
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  errors?: { field: string; reason: string }[];
}
