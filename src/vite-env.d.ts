/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** 여행 일정 화면의 지도(마커·동선)에 쓰는 구글 지도 JS API 키. 브라우저에 노출되는 값이라 HTTP 리퍼러 제한으로 보호해요. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
