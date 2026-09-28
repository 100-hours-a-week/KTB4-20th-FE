let loadPromise: Promise<void> | null = null;

function isLoaded(): boolean {
  return typeof google !== 'undefined' && Boolean(google.maps?.Map);
}

/** 구글 지도 JS SDK를 한 번만 불러와서 재사용합니다. 이후에는 전역 `google.maps`를 바로 씁니다. */
export function loadGoogleMaps(): Promise<void> {
  if (isLoaded()) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY가 설정되지 않았어요.'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.onload = () => {
      if (isLoaded()) {
        resolve();
      } else {
        loadPromise = null;
        reject(new Error('구글 지도를 불러오지 못했어요.'));
      }
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('구글 지도를 불러오지 못했어요.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
