import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CameraIcon } from 'lucide-react';
import { getTrips, type TripSummary } from '../../api/trips';
import BottomNav from '../../components/BottomNav/BottomNav';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { Button } from '@/components/ui/button';
import PhotoMissionHome from './PhotoMissionHome';
import PhotoMissionList from './PhotoMissionList';
import styles from './PhotoMission.module.css';

type TripState =
  { status: 'loading' } | { status: 'home'; trips: TripSummary[] } | { status: 'error' };

/** 백엔드 여행 목록 API가 한 번에 최대 10개까지만 받아요. 넘으면 400이에요. */
const TRIP_PAGE_SIZE = 10;
/** 여행 목록을 이만큼만 넘겨 봐요. (한 사람이 참여한 여행 수는 많지 않아요) */
const MAX_TRIP_PAGES = 20;

/** 참여한 여행을 모두 불러와요. 목록은 다가오는·진행 중 여행이 먼저, 지난 여행이 뒤에 와요. */
async function getAllTrips(): Promise<TripSummary[]> {
  const trips: TripSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_TRIP_PAGES; page += 1) {
    const result = await getTrips({ cursor, size: TRIP_PAGE_SIZE });
    trips.push(...result.trips);
    if (!result.hasNext || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return trips;
}

/**
 * 하단 탭의 포토미션 화면입니다.
 * - 주소에 여행방(tripId)이 있으면 그 여행의 미션 목록
 * - 없으면 첫 화면: 진행 중인 여행 카드(있을 때), 가장 가까운 여행, 지난 여행 앨범
 */
export default function PhotoMission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTripId = searchParams.get('tripId');
  const [tripState, setTripState] = useState<TripState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (requestedTripId) return;
    let cancelled = false;
    getAllTrips().then(
      (trips) => {
        if (!cancelled) setTripState({ status: 'home', trips });
      },
      () => {
        if (!cancelled) setTripState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestedTripId, reloadKey]);

  if (requestedTripId) {
    return (
      <>
        <main className={styles.page}>
          <PhotoMissionList
            key={requestedTripId}
            tripId={requestedTripId}
            onBack={() => navigate('/photo-missions')}
          />
        </main>
        <BottomNav />
      </>
    );
  }

  if (tripState.status === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <>
      <main className={styles.page}>
        {tripState.status === 'home' ? (
          <PhotoMissionHome trips={tripState.trips} />
        ) : (
          <div className={styles.centerBody}>
            <StatusMessage
              icon={<CameraIcon size={20} strokeWidth={1.6} />}
              title="여행을 불러오지 못했어요"
              description="잠시 후 다시 시도해 주세요"
            >
              <Button size="lg" className="h-13 w-full" onClick={reload}>
                다시 불러오기
              </Button>
            </StatusMessage>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
