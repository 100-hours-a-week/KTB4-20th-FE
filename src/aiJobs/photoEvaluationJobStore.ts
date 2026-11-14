/** 접수된 포토미션 AI 판정을 사용자별로 기억해 새로고침 뒤에도 진행 카드를 복원한다. */
export interface StoredPhotoEvaluationJob {
  missionId: string;
  photoId?: number;
  evaluationId?: number;
  /** 요청을 보내기 시작한 시각(ms). 접수 응답을 잃어도 중복 제출을 막는 기준이다. */
  startedAt: number;
}

/** 백엔드의 16분 deadline과 checker 실행 간격까지 지난 작업은 로컬에서 제거한다. */
export const PHOTO_EVALUATION_JOB_EXPIRES_AFTER_MS = 20 * 60 * 1000;

function keyOf(userPublicId: string): string {
  return `planit:ai-job:photo-evaluation:${userPublicId}`;
}

export function loadPhotoEvaluationJob(userPublicId: string): StoredPhotoEvaluationJob | null {
  try {
    const raw = window.localStorage.getItem(keyOf(userPublicId));
    if (!raw) return null;
    const job = JSON.parse(raw) as StoredPhotoEvaluationJob;
    if (typeof job.missionId !== 'string' || typeof job.startedAt !== 'number') return null;
    if (Date.now() - job.startedAt > PHOTO_EVALUATION_JOB_EXPIRES_AFTER_MS) {
      clearPhotoEvaluationJob(userPublicId);
      return null;
    }
    return job;
  } catch {
    return null;
  }
}

export function savePhotoEvaluationJob(userPublicId: string, job: StoredPhotoEvaluationJob): void {
  try {
    window.localStorage.setItem(keyOf(userPublicId), JSON.stringify(job));
  } catch {
    // 저장하지 못해도 현재 화면의 진행 카드는 유지한다.
  }
}

export function clearPhotoEvaluationJob(userPublicId: string): void {
  try {
    window.localStorage.removeItem(keyOf(userPublicId));
  } catch {
    // 만료 시각이 지나면 다음 조회에서 다시 제거한다.
  }
}
