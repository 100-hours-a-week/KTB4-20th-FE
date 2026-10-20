/*
  NOTIFICATION_API_SPEC.md 8장 — 같은 알림 팝업을 두 번 띄우지 않기 위한 기록.
  키는 notification:{userPublicId}:{notificationId}:{생성 시각(ms)}, 값은 받은 시각부터 20시간 뒤 만료 시각이다.
  생성 시각을 함께 넣는 이유: DB를 초기화한 개발 환경처럼 알림 ID가 다시 쓰이면, ID만으로는 새 알림을
  이미 띄운 알림으로 잘못 보고 팝업을 건너뛴다. 실시간·미전달 응답은 시간대 표기가 달라도 같은 시각이라 ms로 맞춘다.
  localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 기록 없이 동작한다.
*/
const KEY_PREFIX = 'notification:';
const EXPIRES_AFTER_MS = 20 * 60 * 60 * 1000;

interface DeliveredRecord {
  expiredAt: number;
}

interface DeliveredNotification {
  notificationId: string;
  createdAt: string;
}

function keyOf(userPublicId: string, { notificationId, createdAt }: DeliveredNotification): string {
  const createdAtMs = Date.parse(createdAt);
  const suffix = Number.isNaN(createdAtMs) ? '' : `:${createdAtMs}`;
  return `${KEY_PREFIX}${userPublicId}:${notificationId}${suffix}`;
}

/** 이미 화면에 띄운 알림인지 확인한다. */
export function wasDelivered(userPublicId: string, notification: DeliveredNotification): boolean {
  try {
    return localStorage.getItem(keyOf(userPublicId, notification)) !== null;
  } catch {
    return false;
  }
}

/** 화면에 띄운 알림을 20시간 동안 기록한다. */
export function markDelivered(userPublicId: string, notification: DeliveredNotification): void {
  const record: DeliveredRecord = { expiredAt: Date.now() + EXPIRES_AFTER_MS };
  try {
    localStorage.setItem(keyOf(userPublicId, notification), JSON.stringify(record));
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
