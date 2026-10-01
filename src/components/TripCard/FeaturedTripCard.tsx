import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getTripDetail, type TripSummary } from '../../api/trips';
import { fetchSurveySummary } from '../../api/survey';
import { AvatarGroup } from '../Avatar/Avatar';
import RegionIllustration from '../RegionIllustration/RegionIllustration';
import { Skeleton } from '@/components/ui/skeleton';
import { truncateTripName } from './tripFormat';
import { formatTripDate, getDaysUntil } from './tripDisplay';
import styles from './FeaturedTripCard.module.css';

interface FeaturedTripCardProps {
  trip: TripSummary;
  /** 나가기 버튼을 눌렀을 때. 되돌릴 수 없는 동작이라 부르는 쪽에서 확인 팝업을 띄운다. */
  onLeave: (trip: TripSummary) => void;
}

interface Extra {
  regionCode: string;
  regionName: string;
  submittedCount: number;
  activeMemberCount: number;
}

/**
 * 가장 가까운 여행 하나를 크게 보여주는 카드입니다.
 * 목록 API에는 지역·설문 현황이 없어서 이 카드 하나만 상세 API와 설문 현황 API를 더 불러옵니다.
 * 더 불러오지 못해도 카드는 그대로 보이고, 풍경 그림과 제출 수만 빠집니다.
 */
export default function FeaturedTripCard({ trip, onLeave }: FeaturedTripCardProps) {
  const [extra, setExtra] = useState<Extra | null>(null);
  const [extraFailed, setExtraFailed] = useState(false);
  const daysUntil = getDaysUntil(trip.startDate, trip.status);
  const canLeave = trip.status !== 'TRIP_IN_PROGRESS' && trip.status !== 'TRIP_COMPLETED';

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTripDetail(trip.tripId), fetchSurveySummary(trip.tripId)])
      .then(([detail, summary]) => {
        if (cancelled) return;
        setExtra({
          regionCode: detail.region.regionCode,
          regionName: detail.region.regionName,
          submittedCount: summary.submittedCount,
          activeMemberCount: summary.activeMemberCount,
        });
      })
      .catch(() => {
        if (!cancelled) setExtraFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.tripId]);

  const statusText =
    trip.status === 'SURVEY_IN_PROGRESS'
      ? extra
        ? `설문 모으는 중 ${extra.submittedCount}/${extra.activeMemberCount}`
        : '설문 모으는 중'
      : trip.status === 'SCHEDULE_COMPLETED'
        ? '일정이 완성됐어요'
        : null; // 출발 당일은 D-DAY로 충분해서 상태 문구를 두지 않는다

  return (
    <article className={styles.card}>
      <div className={styles.scene}>
        {extra ? (
          <RegionIllustration regionCode={extra.regionCode} regionName={extra.regionName} />
        ) : extraFailed ? (
          <RegionIllustration />
        ) : (
          <Skeleton className="size-full rounded-none bg-accent" />
        )}
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
      </div>

      <div className={styles.body}>
        <div className={styles.top}>
          <h3 className={styles.name}>
            <Link
              to={`/trips/${encodeURIComponent(trip.tripId)}`}
              className={styles.link}
              title={trip.name}
            >
              {truncateTripName(trip.name)}
            </Link>
          </h3>
          <span className={styles.dDay}>
            {daysUntil === null || daysUntil === 0 ? 'D-DAY' : `D-${daysUntil}`}
          </span>
        </div>
        <div className={styles.footer}>
          <div className={styles.info}>
            <p className={styles.meta}>{formatTripDate(trip.startDate, true)} 출발</p>
            {statusText && (
              <span className={styles.status}>
                <span className={styles.statusDot} aria-hidden="true" />
                {statusText}
              </span>
            )}
          </div>
          <AvatarGroup
            members={trip.members.map((member) => ({
              name: member.userName,
              imageUrl: member.profileImageUrl,
            }))}
            max={4}
          />
        </div>
      </div>
    </article>
  );
}

export function FeaturedTripCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton className="h-[96px] w-full rounded-none bg-accent" />
      <div className={styles.body}>
        <div className={styles.top}>
          <Skeleton className="h-5 w-32 bg-accent" />
          <Skeleton className="h-8 w-14 bg-accent" />
        </div>
        <Skeleton className="h-3.5 w-44 bg-accent" />
      </div>
    </div>
  );
}
