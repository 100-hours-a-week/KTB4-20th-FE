import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckIcon, ClockIcon, ImagesIcon, InfoIcon } from 'lucide-react';
import { getPhotoMissionCompletion, type PhotoMissionCompletion } from '../../api/photoMissions';
import { Button } from '@/components/ui/button';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { formatTripRange } from './photoMissionFormat';
import { markCompletionSeen, type CompletionKind } from './completionSeen';
import { sharePhotos, warmPhotoFiles } from './photoShare';
import styles from './MissionCompletion.module.css';

const PREVIEW_COUNT = 4;

function daysBetween(startDate: string, endDate: string): number {
  return Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1;
}

/**
 * 완주 화면 3종. 조건마다 한 번만 보여줘요(열리면 "봤음"으로 남겨요).
 * - day: 오늘 Day의 마지막 미션을 성공했을 때 (마지막 Day가 아닐 때)
 * - trip: 마지막 Day까지 모두 끝냈을 때
 * - ended: 미션을 다 채우지 못한 채 여행이 끝난 뒤 처음 포토미션 탭에 들어왔을 때
 */
export default function MissionCompletion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const kindParam = searchParams.get('kind');
  const kind: CompletionKind | null =
    kindParam === 'day' || kindParam === 'trip' || kindParam === 'ended' ? kindParam : null;
  const day = Number(searchParams.get('day')) || undefined;
  const [result, setResult] = useState<PhotoMissionCompletion | 'error' | null>(null);

  useEffect(() => {
    if (!tripId || !kind) return;
    markCompletionSeen(tripId, kind, day);
    let cancelled = false;
    getPhotoMissionCompletion(tripId, kind === 'day' ? day : undefined).then(
      (data) => {
        if (cancelled) return;
        setResult(data);
        warmPhotoFiles(data.previewPhotos.map((photo) => photo.imageUrl));
      },
      () => {
        if (!cancelled) setResult('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [tripId, kind, day]);

  const listPath = `/photo-missions?tripId=${encodeURIComponent(tripId ?? '')}`;
  if (!tripId || !kind || result === 'error') {
    return <Navigate to={tripId ? listPath : '/photo-missions'} replace />;
  }
  if (!result) {
    return <LoadingScreen />;
  }

  const tripDays = daysBetween(result.startDate, result.endDate);
  const goToList = () => navigate(listPath, { replace: true });
  const albumPath = `/photo-missions/album?tripId=${encodeURIComponent(tripId)}`;
  const goToAlbum = () => navigate(albumPath, { replace: true });

  const copy = {
    day: {
      title: '오늘 미션을 다 끝냈어요!',
      description: `${result.tripName} Day ${result.dayNumber}에서\n${result.completedMissionCount}개 미션을 모두 완료했어요`,
    },
    trip: {
      title: '여행 미션을 모두 끝냈어요!',
      description: `${tripDays}일 동안 ${result.completedMissionCount}개 미션을 완료했어요\n사진으로 남은 기록을 확인해 보세요`,
    },
    ended: {
      title: '여행이 끝났어요',
      description: `${tripDays}일 동안 ${result.completedMissionCount}개 미션을 완료했어요\n남은 기록을 확인해 보세요`,
    },
  }[kind];

  // 하루 완주는 사진을 4장까지만, 여행 완주는 4장을 넘으면 마지막 칸을 "+N"으로 바꿔요.
  const overflow =
    kind !== 'day' && result.totalPhotoCount > PREVIEW_COUNT
      ? result.totalPhotoCount - (PREVIEW_COUNT - 1)
      : 0;
  const previews = result.previewPhotos.slice(0, overflow > 0 ? PREVIEW_COUNT - 1 : PREVIEW_COUNT);
  const shareText = `${result.tripName}에서 포토미션 ${result.completedMissionCount}개를 완료했어요!`;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={kind === 'ended' ? styles.iconAlbum : styles.iconDone} aria-hidden="true">
          {kind === 'ended' ? (
            <ImagesIcon size={32} strokeWidth={1.6} />
          ) : (
            <CheckIcon size={34} strokeWidth={2.6} />
          )}
        </span>
        {kind !== 'day' && (
          <p className={styles.tripChip}>
            {result.tripName} · {formatTripRange(result.startDate, result.endDate)}
          </p>
        )}
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
      </section>

      <dl className={styles.stats}>
        <div>
          <dt>완료한 미션</dt>
          <dd>{result.completedMissionCount}</dd>
        </div>
        <div>
          <dt>모든 사진</dt>
          <dd>{result.totalPhotoCount}</dd>
        </div>
        <div>
          <dt>찾은 랜드마크</dt>
          <dd>{result.landmarkCount}</dd>
        </div>
      </dl>

      {previews.length > 0 && (
        <ul className={styles.previews} aria-label="모은 사진 미리보기">
          {previews.map((photo) => (
            <li key={photo.photoId}>
              <img src={photo.imageUrl} alt="" />
            </li>
          ))}
          {overflow > 0 && (
            <li className={styles.more} aria-label={`사진 ${overflow}장 더 있어요`}>
              +{overflow}
            </li>
          )}
        </ul>
      )}

      {kind === 'day' && result.nextDayExists && (
        <p className={styles.notice}>
          <ClockIcon size={16} aria-hidden="true" />
          내일 아침에 Day {(result.dayNumber ?? 0) + 1} 미션이 도착해요. 오늘 못 찍은 게 있으면 남은
          일정 동안 언제든 다시 찍을 수 있어요.
        </p>
      )}
      {kind === 'ended' && result.incompleteMissionCount > 0 && (
        <p className={styles.notice}>
          <InfoIcon size={16} aria-hidden="true" />못 채운 미션 {result.incompleteMissionCount}개는
          여행이 끝나 마감됐어요. 다음 여행에서 새로운 미션으로 만나요.
        </p>
      )}

      <div className={styles.footer}>
        {/* 앨범은 여행이 끝난 다음 날 열려요. 여행 중에는 미션 목록으로 돌아가요. */}
        {result.tripEnded ? (
          <Button size="lg" className="h-13 w-full text-base font-semibold" onClick={goToAlbum}>
            앨범 보러 가기
          </Button>
        ) : (
          <Button size="lg" className="h-13 w-full text-base font-semibold" onClick={goToList}>
            미션 목록 보기
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          className="h-13 w-full text-base font-semibold"
          onClick={() =>
            void sharePhotos(
              result.previewPhotos.map((photo) => photo.imageUrl),
              shareText,
              // 여행이 끝났으면 앨범, 아니면 미션 목록 링크를 보내요.
              `${window.location.origin}${result.tripEnded ? albumPath : listPath}`,
            )
          }
        >
          멤버들과 공유하기
        </Button>
        {kind !== 'day' && !result.tripEnded && (
          <p className={styles.hint}>앨범은 여행이 끝난 다음 날 열려요</p>
        )}
        {result.tripEnded && (
          <Button
            variant="ghost"
            className="h-11 w-full text-sm text-[var(--color-text-muted)]"
            onClick={goToList}
          >
            나중에 보기
          </Button>
        )}
      </div>
    </main>
  );
}
