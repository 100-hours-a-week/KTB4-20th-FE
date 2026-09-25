import { Link } from 'react-router-dom';
import type { TripStatus, TripSummary } from '../../api/trips';
import { AvatarGroup } from '../Avatar/Avatar';
import { XIcon as CloseIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTripMeta, TRIP_STATUS_LABEL, truncateTripName } from './tripFormat';
import styles from './TripCard.module.css';

/** 설문 중·여행 완료는 흐리게, 생성 완료·여행 중은 진하게 보여줍니다. */
const TRIP_STATUS_TONE: Record<TripStatus, string> = {
  SURVEY_IN_PROGRESS: 'text-muted-foreground',
  TRIP_COMPLETED: 'text-muted-foreground',
  SCHEDULE_COMPLETED: 'text-foreground font-semibold',
  TRIP_IN_PROGRESS: 'text-foreground font-semibold',
};

interface TripCardProps {
  trip: TripSummary;
  onLeave: (trip: TripSummary) => void;
}

/** 참여 중인 여행방 하나를 보여주는 카드입니다. 누르면 여행방 상세로 이동합니다. */
export default function TripCard({ trip, onLeave }: TripCardProps) {
  const displayName = truncateTripName(trip.name);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>
          <Link
            to={`/trips/${encodeURIComponent(trip.tripId)}`}
            className={styles.link}
            title={trip.name}
          >
            {displayName}
          </Link>
        </h3>
        <Badge variant="secondary" className={`bg-accent ${TRIP_STATUS_TONE[trip.status]}`}>
          {TRIP_STATUS_LABEL[trip.status]}
        </Badge>
      </div>
      <p className={styles.meta}>{formatTripMeta(trip.startDate, trip.memberCount)}</p>
      <div className={styles.footer}>
        <AvatarGroup
          members={trip.members.map((member) => ({
            name: member.userName,
            imageUrl: member.profileImageUrl,
          }))}
        />
        <button
          type="button"
          className={styles.leaveButton}
          onClick={() => onLeave(trip)}
          aria-label={`${trip.name} 나가기`}
        >
          <CloseIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}

/** 목록을 불러오는 동안 보여주는 회색 카드입니다. */
export function TripCardSkeleton() {
  return (
    <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <Skeleton className="h-3.5 w-[45%] bg-accent" />
      <Skeleton className="h-3.5 w-[30%] bg-accent" />
      <Skeleton className="mt-1 size-5 rounded-full bg-accent" />
    </div>
  );
}
