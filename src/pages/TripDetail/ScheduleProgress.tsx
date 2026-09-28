import { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import styles from './TripDetail.module.css';

/*
  백엔드는 일정 생성이 끝날 때 한 번에 응답하고 진행 단계를 따로 알려주지 않습니다.
  그래서 단계 표시는 시간에 맞춰 넘어가고, 마지막 단계("최적 동선을 계산하는 중")는
  실제 응답이 올 때까지 진행 중으로 둡니다.
*/
const STEP_DELAYS_MS = [0, 1500, 3000];

interface ScheduleProgressProps {
  /** 취향을 종합한 인원 수 */
  memberCount: number;
}

/** AI 일정 생성 중 화면 (설계서 10번). 뒤로가기 버튼은 두지 않습니다. */
export default function ScheduleProgress({ memberCount }: ScheduleProgressProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = STEP_DELAYS_MS.slice(1).map((delay, index) =>
      window.setTimeout(() => setActiveStep(index + 1), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const steps = [
    `${memberCount}명의 취향을 종합했어요`,
    '후보 장소를 찾았어요',
    '최적 동선을 계산하는 중',
  ];

  return (
    <main className={styles.centerScreen}>
      <section className={styles.generating} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <h1 className={styles.generatingTitle}>
          취향을 분석해서
          <br />
          최적 동선을 만드는 중이에요
        </h1>
        <p className={styles.generatingDescription}>잠시만 기다려주세요!</p>
        <ol className={styles.steps}>
          {steps.map((label, index) => {
            const done = index < activeStep;
            const current = index === activeStep;
            return (
              <li
                key={label}
                className={`${styles.step} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''}`}
              >
                {done ? (
                  <CheckIcon className="size-4" aria-hidden="true" />
                ) : (
                  <span className={styles.stepCircle} aria-hidden="true" />
                )}
                {label}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
