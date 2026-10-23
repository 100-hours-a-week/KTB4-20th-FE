import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraIcon, ChevronRightIcon } from 'lucide-react';
import { getPhotoMissionCompletion, type PhotoMissionCompletion } from '../../api/photoMissions';
import type { TripSummary } from '../../api/trips';
import { AvatarGroup } from '../../components/Avatar/Avatar';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { getDaysUntil } from '../../components/TripCard/tripDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { getToday } from '../../utils/date';
import { formatTripRange } from './photoMissionFormat';
import styles from './PhotoMission.module.css';

/** 지난 여행 앨범은 처음 5개를 보여주고, 끝까지 내리면 5개씩 더 불러와요. */
const ALBUM_BATCH = 5;

interface PastAlbum {
  trip: TripSummary;
  /** 사진 수·미션 수. 못 받았으면 null이라 끝난 날짜만 보여줘요. */
  summary: PhotoMissionCompletion | null;
}

interface PhotoMissionHomeProps {
  /** 참여한 모든 여행 */
  trips: TripSummary[];
}

/** 오늘이 여행 며칠째인지 (첫날이 1) */
function getTripDayNumber(startDate: string): number {
  const days = (Date.parse(getToday()) - Date.parse(startDate)) / 86_400_000;
  return Math.max(1, Math.round(days) + 1);
}

/**
 * 포토미션 첫 화면.
 * 진행 중인 여행 카드(있을 때, 없으면 안내) → 가장 가까운 여행 카드(있을 때) → 지난 여행 앨범 목록(끝난 여행 모두, 최신순).
 * 날짜가 겹치는 여행에는 참여할 수 없어 진행 중인 여행은 최대 1개예요.
 */
export default function PhotoMissionHome({ trips }: PhotoMissionHomeProps) {
  const navigate = useNavigate();
  const current = trips.find((trip) => trip.status === 'TRIP_IN_PROGRESS');
  const upcoming = trips
    .filter((trip) => trip.status === 'SURVEY_IN_PROGRESS' || trip.status === 'SCHEDULE_COMPLETED')
    .reduce<TripSummary | null>(
      (nearest, trip) => (!nearest || trip.startDate < nearest.startDate ? trip : nearest),
      null,
    );
  const [ended] = useState(() =>
    trips
      .filter((trip) => trip.status === 'TRIP_COMPLETED')
      .sort((a, b) => (a.endDate < b.endDate ? 1 : -1)),
  );

  const [albums, setAlbums] = useState<PastAlbum[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = checkedCount < ended.length;

  // 앨범 사진 수·미션 수는 여행마다 완주 결과 API로 받아요. 완료한 미션이 없는 여행도 목록에는 보여줘요.
  const loadMore = useCallback(async () => {
    if (loadingRef.current || checkedCount >= ended.length) return;
    loadingRef.current = true;
    setLoading(true);
    const batch = ended.slice(checkedCount, checkedCount + ALBUM_BATCH);
    const found = await Promise.all(
      batch.map((trip) =>
        getPhotoMissionCompletion(trip.tripId).then(
          (summary): PastAlbum => ({ trip, summary }),
          (): PastAlbum => ({ trip, summary: null }),
        ),
      ),
    );
    setAlbums((previous) => [...previous, ...found]);
    setCheckedCount(checkedCount + batch.length);
    setLoading(false);
    loadingRef.current = false;
  }, [checkedCount, ended]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const daysUntil = upcoming ? getDaysUntil(upcoming.startDate, upcoming.status) : null;

  return (
    <>
      <h1 className={styles.homeTitle}>포토미션</h1>
      <p className={styles.homeSubtitle}>여행하는 날마다 그날의 사진 미션이 열려요</p>

      {current ? (
        <section
          aria-labelledby="current-title"
          className={`${styles.homeSection} ${styles.currentSection}`}
        >
          <h2 id="current-title" className={styles.sectionTitle}>
            진행 중인 여행
          </h2>
          <button
            type="button"
            className={styles.upcomingCard}
            onClick={() => navigate(`/photo-missions?tripId=${encodeURIComponent(current.tripId)}`)}
          >
            <span className={styles.upcomingTop}>
              <span className={styles.upcomingName}>{current.name}</span>
              <span className={styles.liveBadge}>Day {getTripDayNumber(current.startDate)}</span>
            </span>
            <span className={styles.upcomingMeta}>
              {formatTripRange(current.startDate, current.endDate)} · {current.memberCount}명
            </span>
            <span className={styles.currentFooter}>
              <AvatarGroup
                members={current.members.map((member) => ({
                  name: member.userName,
                  imageUrl: member.profileImageUrl,
                }))}
                max={5}
                size="xs"
              />
              <span className={styles.currentLink}>
                오늘의 미션 보기
                <ChevronRightIcon size={16} aria-hidden="true" />
              </span>
            </span>
          </button>
        </section>
      ) : (
        <div className={styles.homeEmpty}>
          <StatusMessage
            icon={<CameraIcon size={22} strokeWidth={1.6} />}
            title="진행 중인 여행이 없어요"
            description={'여행 당일이 되면\nAI가 사진 미션을 만들어드려요'}
          />
        </div>
      )}

      {upcoming && (
        <section aria-labelledby="upcoming-title" className={styles.homeSection}>
          <h2 id="upcoming-title" className={styles.sectionTitle}>
            가장 가까운 여행
          </h2>
          <button
            type="button"
            className={styles.upcomingCard}
            onClick={() => navigate(`/trips/${encodeURIComponent(upcoming.tripId)}`)}
          >
            <span className={styles.upcomingTop}>
              <span className={styles.upcomingName}>{upcoming.name}</span>
              {daysUntil !== null && (
                <span className={styles.dday}>{daysUntil === 0 ? 'D-DAY' : `D-${daysUntil}`}</span>
              )}
            </span>
            <span className={styles.upcomingMeta}>
              {formatTripRange(upcoming.startDate, upcoming.endDate)} · {upcoming.memberCount}명
            </span>
            <AvatarGroup
              members={upcoming.members.map((member) => ({
                name: member.userName,
                imageUrl: member.profileImageUrl,
              }))}
              max={5}
              size="xs"
            />
          </button>
        </section>
      )}

      {(albums.length > 0 || hasMore) && (
        <section aria-labelledby="albums-title" className={styles.homeSection}>
          <h2 id="albums-title" className={styles.sectionTitle}>
            지난 여행 앨범
          </h2>
          <ul className={styles.albumList}>
            {albums.map(({ trip, summary }) => (
              <li key={trip.tripId}>
                <button
                  type="button"
                  className={styles.albumCard}
                  onClick={() =>
                    navigate(`/photo-missions/album?tripId=${encodeURIComponent(trip.tripId)}`)
                  }
                >
                  <span className={styles.albumText}>
                    <span className={styles.albumName}>{trip.name}</span>
                    <span className={styles.albumMeta}>
                      {trip.endDate.replaceAll('-', '.')}
                      {summary &&
                        ` · 사진 ${summary.totalPhotoCount}장 · 미션 ${summary.completedMissionCount}/${summary.totalMissionCount}`}
                    </span>
                  </span>
                  <ChevronRightIcon size={18} aria-hidden="true" className={styles.albumChevron} />
                </button>
              </li>
            ))}
          </ul>
          {loading && (
            <div className={styles.albumSkeleton} aria-busy="true" aria-label="앨범을 불러오는 중">
              <Skeleton className="h-[64px] w-full rounded-[var(--radius-md)] bg-accent" />
            </div>
          )}
          {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
        </section>
      )}
    </>
  );
}
