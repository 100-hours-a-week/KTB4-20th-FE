import type { TripStatus } from '../../api/trips';
import { getDaysUntil } from './tripDisplay';
import styles from './TicketStub.module.css';

interface TicketStubProps {
  status: TripStatus;
  startDate: string;
  size?: 'md' | 'lg';
}

/**
 * 탑승권 오른쪽 칸. 백엔드 여행 상태를 그대로 따릅니다.
 * - 설문 중·일정 생성 완료(출발 전): 브라운 글자 D-12, 당일이면 D-DAY
 * - 여행 중(백엔드 기준 출발 당일): 올리브 글자 "여행 중"
 * - 여행 완료: "여행 완료" 도장
 */
export default function TicketStub({ status, startDate, size = 'md' }: TicketStubProps) {
  const className = `${styles.stub} ${styles[size]}`;

  if (status === 'TRIP_IN_PROGRESS') {
    return (
      <div className={`${className} ${styles.traveling}`}>
        <span className={styles.text}>여행 중</span>
      </div>
    );
  }

  if (status === 'TRIP_COMPLETED') {
    return (
      <div className={className}>
        <span className={styles.stamp}>여행 완료</span>
      </div>
    );
  }

  const daysUntil = Math.max(0, getDaysUntil(startDate, status) ?? 0);
  return (
    <div className={`${className} ${styles.upcoming}`}>
      <span className={styles.number} aria-hidden="true">
        {daysUntil === 0 ? 'D-DAY' : `D-${daysUntil}`}
      </span>
      <span className="sr-only">{daysUntil === 0 ? '오늘 출발' : `출발까지 ${daysUntil}일`}</span>
    </div>
  );
}
