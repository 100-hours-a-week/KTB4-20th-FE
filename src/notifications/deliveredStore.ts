/*
  NOTIFICATION_API_SPEC.md 8장 — 같은 알림 팝업을 두 번 띄우지 않기 위한 기록.
  키는 notification:{userPublicId}:{notificationId}, 값은 받은 시각부터 20시간 뒤 만료 시각이다.
  localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 기록 없이 동작한다.
*/
const KEY_PREFIX = 'notification:';
const EXPIRES_AFTER_MS = 20 * 60 * 60 * 1000;

interface DeliveredRecord {
  expiredAt: number;
}

function keyOf(userPublicId: string, notificationId: string): string {
  return `${KEY_PREFIX}${userPublicId}:${notificationId}`;
}

/** 이미 화면에 띄운 알림인지 확인한다. */
export function wasDelivered(userPublicId: string, notificationId: string): boolean {
  try {
    return localStorage.getItem(keyOf(userPublicId, notificationId)) !== null;
  } catch {
    return false;
  }
}

/** 화면에 띄운 알림을 20시간 동안 기록한다. */
export function markDelivered(userPublicId: string, notificationId: string): void {
  const record: DeliveredRecord = { expiredAt: Date.now() + EXPIRES_AFTER_MS };
  try {
    localStorage.setItem(keyOf(userPublicId, notificationId), JSON.stringify(record));
  } catch {
    // 저장하지 못해도 팝업과 ACK는 그대로 진행한다.
  }
}

/** 서비스에 들어올 때 만료된 기록을 한 번에 지운다. */
export function clearExpiredDeliveries(): void {
  try {
    const now = Date.now();
    const expiredKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(KEY_PREFIX)) continue;
      const record = JSON.parse(localStorage.getItem(key) ?? 'null') as DeliveredRecord | null;
      if (!record || typeof record.expiredAt !== 'number' || now >= record.expiredAt) {
        expiredKeys.push(key);
      }
    }
    expiredKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // 정리하지 못해도 다음 진입 때 다시 시도한다.
  }
}
