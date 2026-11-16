import type { ScheduleGenerationReason } from '../api/schedule';

/**
 * 접수한(202) AI 일정 생성 작업을 사용자별로 기억해, 새로고침하거나 다시 들어와도 "AI 작업 중"을 이어서 보여준다.
 * 결과는 알림으로 오므로 서버에 작업 상태를 따로 묻지 않는다.
 */
export interface StoredScheduleJob {
  tripId: string;
  jobId: string;
  reason: ScheduleGenerationReason;
  /** 접수한 시각(ms) */
  acceptedAt: number;
}

/**
 * 백엔드는 접수 후 28분 안에 결과가 없으면 작업을 실패로 끝내고 실패 알림을 보낸다(Stale Job Checker, 3분 주기).
 * 그 알림까지 놓쳐도 진행 카드가 계속 남지 않도록 조금 더 긴 31분이 지나면 버린다.
 */
const EXPIRES_AFTER_MS = 31 * 60 * 1000;

function keyOf(userPublicId: string): string {
  return `planit:ai-job:schedule-generation:${userPublicId}`;
}

export function loadScheduleJob(userPublicId: string): StoredScheduleJob | null {
  try {
    const raw = window.localStorage.getItem(keyOf(userPublicId));
    if (!raw) return null;
    const job = JSON.parse(raw) as StoredScheduleJob;
    if (typeof job.tripId !== 'string' || typeof job.acceptedAt !== 'number') return null;
    if (Date.now() - job.acceptedAt > EXPIRES_AFTER_MS) {
      clearScheduleJob(userPublicId);
      return null;
    }
    return job;
  } catch {
    return null;
  }
}

export function saveScheduleJob(userPublicId: string, job: StoredScheduleJob): void {
  try {
    window.localStorage.setItem(keyOf(userPublicId), JSON.stringify(job));
  } catch {
    // 저장하지 못해도 지금 화면의 진행 카드는 그대로 보인다.
  }
}

export function clearScheduleJob(userPublicId: string): void {
  try {
    window.localStorage.removeItem(keyOf(userPublicId));
  } catch {
    // 지우지 못해도 만료 시각이 지나면 읽을 때 버린다.
  }
}
