import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import type { TripStatus, TripSummary } from '../../api/trips';
import { AvatarGroup } from '../Avatar/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { truncateTripName } from './tripFormat';
import { formatTripDate, getDaysUntil } from './tripDisplay';
import styles from './TripRow.module.css';

const STATUS_TEXT: Record<TripStatus, string> = {
  SURVEY_IN_PROGRESS: '설문 중',
  SCHEDULE_COMPLETED: '일정 완성',
  TRIP_IN_PROGRESS: '여행 중',
  TRIP_COMPLETED: '완료',
};

interface TripRowProps {
  trip: TripSummary;
  onLeave: (trip: TripSummary) => void;
}

/** 다가오는 여행 외의 여행방을 한 줄로 보여줍니다. 왼쪽 네모 칸에 D-day, 누르면 여행방 상세로 이동합니다. */
export default function TripRow({ trip, onLeave }: TripRowProps) {
  const daysUntil = getDaysUntil(trip.startDate, trip.status);
  const isDone = trip.status === 'TRIP_COMPLETED';
  const canLeave = trip.status !== 'TRIP_IN_PROGRESS' && !isDone;
  const badge =
    daysUntil !== null
      ? daysUntil === 0
        ? 'D-DAY'
        : `D-${daysUntil}`
      : trip.status === 'TRIP_IN_PROGRESS'
        ? '여행 중'
        : '완료';
  const tone = daysUntil !== null ? styles.upcoming : isDone ? styles.done : styles.traveling;

  return (
    <article className={`${styles.row} ${isDone ? styles.past : ''}`}>
      <span className={`${styles.badge} ${tone}`}>{badge}</span>
      <div className={styles.info}>
        <h3 className={styles.name}>
          <Link
            to={`/trips/${encodeURIComponent(trip.tripId)}`}
            className={styles.link}
            title={trip.name}
          >
            {truncateTripName(trip.name)}
          </Link>
        </h3>
        <div className={styles.meta}>
          <span className={styles.when}>
            {formatTripDate(trip.startDate)} · {STATUS_TEXT[trip.status]}
          </span>
          <AvatarGroup
            members={trip.members.map((member) => ({
              name: member.userName,
              imageUrl: member.profileImageUrl,
            }))}
            max={4}
            size="xs"
          />
        </div>
      </div>
      {/* 나갈 수 없는 여행은 버튼 자리를 비우지 않아 참여자 얼굴이 카드 오른쪽 끝에 붙는다 */}
      {canLeave && (
        <button
          type="button"
          className={styles.leaveButton}
          onClick={() => onLeave(trip)}
          aria-label={`${trip.name} 나가기`}
          aria-haspopup="dialog"
        >
          <LogOut size={16} />
        </button>
      )}
    </article>
  );
}

export function TripRowSkeleton() {
  return (
    <div className={styles.row} aria-hidden="true">
      <Skeleton className="size-11 rounded-[14px] bg-accent" />
      <div className={styles.info}>
        <Skeleton className="h-4 w-28 bg-accent" />
        <Skeleton className="mt-1.5 h-3 w-40 bg-accent" />
      </div>
    </div>
  );
}
