import type { TripStatus } from '../../api/trips';
import styles from './TripProgress.module.css';

const STEPS = ['설문', '일정 생성', '여행'] as const;

/** 상태별 현재 단계 번호. 여행이 끝나면 모든 단계를 지난 것으로 본다. */
const CURRENT_STEP: Record<TripStatus, number> = {
  SURVEY_IN_PROGRESS: 0,
  SCHEDULE_COMPLETED: 1,
  TRIP_IN_PROGRESS: 2,
  TRIP_COMPLETED: STEPS.length,
};

interface TripProgressProps {
  status: TripStatus;
}

/** 설문 → 일정 생성 → 여행 순서의 진행 단계 바. 지금 단계까지 세이지로 채우고, 지금 단계 이름만 굵게 씁니다. */
export default function TripProgress({ status }: TripProgressProps) {
  const current = CURRENT_STEP[status];

  return (
    <ol className={styles.steps} aria-label="여행 진행 단계">
      {STEPS.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li
            key={label}
            className={`${styles.step} ${styles[state]}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={styles.bar} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
