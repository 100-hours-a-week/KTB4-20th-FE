import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CameraIcon, DownloadIcon, ImagesIcon } from 'lucide-react';
import { getApiErrorCode } from '../../api/errors';
import {
  getPhotoMissionAlbum,
  getPhotoMissionCompletion,
  PHOTO_MISSION_ERROR_CODES,
  type PhotoMissionAlbum,
  type PhotoMissionAlbumItem,
  type PhotoMissionCompletion,
} from '../../api/photoMissions';
import { getTripDetail } from '../../api/trips';
import { Button } from '@/components/ui/button';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { getToday } from '../../utils/date';
import { formatMonthDayWeekday, formatTripRange } from './photoMissionFormat';
import { savePhotos, sharePhotos, warmPhotoFiles } from './photoShare';
import styles from './MissionAlbum.module.css';

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      album: PhotoMissionAlbum;
      /** 통계 3칸에 쓰는 완주 결과. 못 받으면 통계만 숨겨요. */
      summary: PhotoMissionCompletion | null;
      /** 여행 기간. 완주 결과나 여행방 상세에서 받아요. 둘 다 못 받으면 null */
      period: { startDate: string; endDate: string } | null;
    }
  /** 방이 없어졌거나 멤버가 아니라서 다시 불러와도 볼 수 없어요. */
  | { status: 'forbidden' }
  /** 네트워크·서버 오류라 다시 불러오면 될 수 있어요. */
  | { status: 'error' };

const FORBIDDEN_CODES: (string | undefined)[] = [
  PHOTO_MISSION_ERROR_CODES.tripNotFound,
  PHOTO_MISSION_ERROR_CODES.memberRequired,
  PHOTO_MISSION_ERROR_CODES.notFound,
];

/** 앨범과 요약을 따로 받아요. 요약(완주 결과)이 실패해도 앨범은 보여줘요. */
async function loadAlbum(tripId: string): Promise<LoadState> {
  const summaryRequest = getPhotoMissionCompletion(tripId).catch(() => null);
  let album: PhotoMissionAlbum;
  try {
    album = await getPhotoMissionAlbum(tripId);
  } catch (error) {
    return { status: FORBIDDEN_CODES.includes(getApiErrorCode(error)) ? 'forbidden' : 'error' };
  }
  const summary = await summaryRequest;
  // 앨범 응답에는 여행 기간이 없어서, 완주 결과가 없으면 여행방 상세에서 받아요.
  const period = summary
    ? { startDate: summary.startDate, endDate: summary.endDate }
    : await getTripDetail(tripId).then(
        (trip) => ({ startDate: trip.startDate, endDate: trip.endDate }),
        () => null,
      );
  return { status: 'ready', album, summary, period };
}

/**
 * 여행의 미션 앨범. 여행이 끝난 다음 날부터 열려요.
 * 그룹 미션은 멤버 모두의 사진, 개인 미션은 내 사진만 와요(백엔드 규칙).
 */
export default function MissionAlbum() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId') ?? '';
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    void loadAlbum(tripId).then((next) => {
      if (cancelled) return;
      setState(next);
      if (next.status === 'ready') {
        warmPhotoFiles(albumItems(next.album).map((item) => item.thumbnailUrl));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tripId, reloadKey]);

  const listPath = `/photo-missions?tripId=${encodeURIComponent(tripId)}`;

  // 백엔드는 막지 않지만, 앨범은 여행이 끝난 다음 날부터 보여줘요. 그 전에 링크로 들어오면 미션 목록으로 보내요.
  // (기간을 끝내 못 받으면 막을 근거가 없어 앨범을 보여줘요)
  const locked =
    state.status === 'ready' && state.period !== null && getToday() <= state.period.endDate;
  useEffect(() => {
    if (!locked) return;
    toast('앨범은 여행이 끝난 다음 날 열려요');
    navigate(listPath, { replace: true });
  }, [locked, listPath, navigate]);
  const goBack = () => {
    const hasHistory = (window.history.state as { idx?: number } | null)?.idx;
    if (hasHistory) navigate(-1);
    else navigate(listPath, { replace: true });
  };

  if (!tripId || state.status === 'forbidden') {
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<ImagesIcon size={20} strokeWidth={1.6} />}
          title="앨범을 볼 수 없어요"
          description="여행방이 없어졌거나 멤버가 아니에요"
        >
          <Button
            size="lg"
            className="h-13 w-full"
            onClick={() => navigate('/photo-missions', { replace: true })}
          >
            포토미션으로 가기
          </Button>
        </StatusMessage>
      </main>
    );
  }
  if (state.status === 'error') {
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<ImagesIcon size={20} strokeWidth={1.6} />}
          title="앨범을 불러오지 못했어요"
          description="인터넷 연결을 확인하고 다시 시도해 주세요"
        >
          <Button size="lg" className="h-13 w-full" onClick={reload}>
            다시 불러오기
          </Button>
        </StatusMessage>
      </main>
    );
  }
  if (state.status === 'loading' || locked) {
    return <LoadingScreen />;
  }

  const { album, summary, period } = state;
  const subtitle = period
    ? `${album.tripName} · ${formatTripRange(period.startDate, period.endDate)}`
    : album.tripName;

  const items = albumItems(album);
  const hasPhotos = items.length > 0;
  const imageUrls = items.map((item) => item.thumbnailUrl);
  const openPhoto = (item: PhotoMissionAlbumItem) =>
    navigate(
      `/photo-missions/missions/${item.missionId}/photos?tripId=${encodeURIComponent(tripId)}`,
    );

  return (
    <main className={styles.page}>
      <PageHeader title="미션 앨범" subtitle={subtitle} onBack={goBack} />

      {/* 사진이 없으면 0만 있는 통계는 숨겨요. */}
      {summary && hasPhotos && (
        <dl className={styles.stats}>
          <div>
            <dt>완료한 미션</dt>
            <dd>{summary.completedMissionCount}</dd>
          </div>
          <div>
            <dt>모든 사진</dt>
            <dd>{summary.totalPhotoCount}</dd>
          </div>
          <div>
            <dt>찾은 랜드마크</dt>
            <dd>{summary.landmarkCount}</dd>
          </div>
        </dl>
      )}

      {hasPhotos ? (
        album.days.map((day) => {
          const dayItems = [...day.groupMissions, ...day.personalMissions];
          if (dayItems.length === 0) return null;
          return (
            <section key={day.dayNumber} aria-labelledby={`album-day-${day.dayNumber}`}>
              <h2 id={`album-day-${day.dayNumber}`} className={styles.dayTitle}>
                Day {day.dayNumber}
                <span>{formatMonthDayWeekday(day.date)}</span>
              </h2>
              <ul className={styles.grid}>
                {dayItems.map((item) => (
                  <li key={item.missionId}>
                    <button type="button" className={styles.tile} onClick={() => openPhoto(item)}>
                      <span className={styles.tileImage}>
                        <img src={item.thumbnailUrl} alt="" />
                        {item.photoCount > 1 && (
                          <span className={styles.countBadge}>{item.photoCount}장</span>
                        )}
                      </span>
                      <span className={styles.tileCaption}>{item.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <CameraIcon size={22} strokeWidth={1.6} />
          </span>
          {/* 앨범은 여행이 끝난 뒤에만 열려서, 더 완료할 수 있다는 안내는 하지 않아요. */}
          <p className={styles.emptyTitle}>이 여행에서 남긴 사진이 없어요</p>
          <p className={styles.emptyDescription}>완료한 미션이 없어서 앨범이 비어 있어요</p>
        </div>
      )}

      <div className={styles.footer}>
        {hasPhotos ? (
          <>
            <Button
              size="lg"
              className="h-13 w-full text-base font-semibold"
              onClick={() => void savePhotos(imageUrls)}
            >
              <DownloadIcon className="size-4" aria-hidden="true" />
              앨범 사진 저장
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full text-base font-semibold"
              onClick={() =>
                void sharePhotos(
                  imageUrls,
                  `${album.tripName}에서 함께 남긴 포토미션 사진 ${imageUrls.length}장이에요`,
                  window.location.href,
                )
              }
            >
              멤버들과 공유하기
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            className="h-13 w-full text-base font-semibold"
            onClick={() => navigate('/photo-missions')}
          >
            포토미션으로 가기
          </Button>
        )}
      </div>
    </main>
  );
}

function albumItems(album: PhotoMissionAlbum): PhotoMissionAlbumItem[] {
  return album.days.flatMap((day) => [...day.groupMissions, ...day.personalMissions]);
}
