import axios from 'axios';
import type { ApiResponse } from './types';

/** 백엔드 오류 응답에서 오류 코드를 꺼냅니다. 알 수 없으면 undefined를 반환합니다. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError<Partial<ApiResponse<unknown>>>(error)) return undefined;
  return error.response?.data?.code;
}

/** 백엔드 오류 응답의 메시지를 꺼냅니다. 알 수 없으면 undefined를 반환합니다. */
export function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError<Partial<ApiResponse<unknown>>>(error)) return undefined;
  return error.response?.data?.message;
}
