import { Link } from 'react-router-dom';
import type { TripSummary } from '../../api/trips';
import { AvatarGroup } from '../Avatar/Avatar';
import { CloseIcon } from '../Icon/icons';
import { formatTripMeta, TRIP_STATUS_LABEL, truncateTripName } from './tripFormat';
import styles from './TripCard.module.css';

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
        <span className={`${styles.badge} ${styles[trip.status]}`}>
          {TRIP_STATUS_LABEL[trip.status]}
        </span>
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
      <span className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
      <span className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
      <span className={styles.skeletonCircle} />
    </div>
  );
}
