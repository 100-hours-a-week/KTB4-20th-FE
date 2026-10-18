import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CameraIcon, CheckIcon, CircleAlertIcon, InfoIcon, MapPinIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import { completeMissionManually, PHOTO_MISSION_ERROR_CODES } from '../../api/photoMissions';
import { Button } from '@/components/ui/button';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import { usePhotoSubmission, type VerdictState } from './usePhotoSubmission';
import styles from './MissionResult.module.css';

/** 판정에 이 횟수만큼 실패하면 더 올릴 수 없고 직접 완료만 할 수 있어요. (백엔드 MAX_RETRY_COUNT) */
const MAX_RETRY_COUNT = 3;

type ResultKind = 'success' | 'retry' | 'fail' | 'maxed' | 'retakeKept';

/** 사진 판정 결과. 사진 올리기 직후에만 열려요(새로고침하면 미션 상세로 돌아가요). */
export default function MissionResult() {
  const { missionId: missionIdParam } = useParams<{ missionId: string }>();
  const missionId = Number(missionIdParam);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const result = location.state as VerdictState | null;
  const [completing, setCompleting] = useState(false);
  const tripQuery = tripId ? `?tripId=${encodeURIComponent(tripId)}` : '';
  const detailPath = `/photo-missions/missions/${missionId}${tripQuery}`;

  const submission = usePhotoSubmission(missionId, {
    additional: false,
    retake: result?.retake ?? false,
    tripId,
    onChanged: () => navigate(detailPath, { replace: true }),
  });

  if (!result) {
    return <Navigate to={detailPath} replace />;
  }

  if (submission.submitting) {
    return (
      <LoadingScreen
        title="사진을 확인하고 있어요"
        description="미션에 맞는 사진인지 AI가 보고 있어요. 30초쯤 걸릴 수 있어요"
      />
    );
  }

  const { verdict, mission, retake } = result;
  const retryCount = mission?.retryCount ?? 0;
  const kind: ResultKind =
    verdict.result === 'success'
      ? 'success'
      : retake
        ? 'retakeKept'
        : retryCount >= MAX_RETRY_COUNT
          ? 'maxed'
          : verdict.result === 'retry'
            ? 'retry'
            : 'fail';
  const locationMismatch = verdict.reason === 'location_mismatch';
  const placeName = mission?.placeName;
  const landmarkFound = verdict.landmark_confidence !== null;

  const copy: Record<ResultKind, { title: string; description: string }> = {
    success: {
      title: '미션 성공!',
      // 어떤 미션을 끝냈는지 바로 알 수 있게 미션 문구를 보여줘요.
      description: mission
        ? `'${mission.description}' ${retake ? '사진을 바꿨어요' : '완료'}`
        : retake
          ? '새 사진으로 바꿨어요'
          : '미션에 맞는 사진이에요',
    },
    retry: { title: '조금 아쉬워요', description: '조금만 바꿔서 다시 찍어 보세요' },
    fail: {
      title: '다시 찍어볼까요?',
      description: locationMismatch
        ? '미션 장소와 떨어진 곳에서 찍은 사진 같아요'
        : '사진에서 미션 대상을 찾지 못했어요',
    },
    maxed: {
      title: 'AI가 이 사진을 알아보지 못했어요',
      description: `${retryCount}번 모두 인식되지 않았어요. 미션에 맞게 찍었다면 직접 완료로 남길 수 있어요`,
    },
    retakeKept: {
      title: '이번 사진은 인식되지 않았어요',
      description: '먼저 올린 사진이 그대로 남아 있어요',
    },
  };

  const matchedLabels = verdict.detected_labels.filter((label) => label.matched);
  const analysisNote =
    verdict.retry_hint ??
    (locationMismatch ? '미션 장소에서 다시 찍어 주세요' : '미션 조건과 맞는 항목을 찾지 못했어요');
  const goToList = () => navigate(`/photo-missions${tripQuery}`);
  const goToDetail = () => navigate(detailPath, { replace: true });

  const saveToDevice = () => {
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = `planit-mission-${missionId}.jpg`;
    link.click();
  };

  const completeManually = async () => {
    setCompleting(true);
    try {
      await completeMissionManually(missionId);
      toast.success('미션을 직접 완료했어요.');
      goToDetail();
    } catch (error) {
      toast.error(
        getApiErrorCode(error) === PHOTO_MISSION_ERROR_CODES.manualCompletionNotAllowed
          ? '지금은 직접 완료할 수 없어요.'
          : '완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      setCompleting(false);
    }
  };

  return (
    <main className={styles.page}>
      <PageHeader title="판정 결과" onBack={goToDetail} />

      <div className={styles.photoWrap}>
        <img src={result.previewUrl} alt="방금 올린 사진" className={styles.photo} />
        {/* 성공은 사진 위에 체크를 겹쳐 결과가 가장 먼저 보이게 해요. */}
        {kind === 'success' && (
          <span className={styles.photoCheck} aria-hidden="true">
            <CheckIcon size={22} strokeWidth={2.8} />
          </span>
        )}
      </div>

      <section className={styles.verdict} aria-live="polite">
        {kind !== 'success' && (
          <span className={styles.iconOutline} aria-hidden="true">
            {kind === 'retry' ? (
              <CameraIcon size={24} strokeWidth={1.6} />
            ) : (
              <CircleAlertIcon size={24} strokeWidth={1.6} />
            )}
          </span>
        )}
        <h1 className={styles.title}>{copy[kind].title}</h1>
        <p className={styles.description}>{copy[kind].description}</p>
      </section>

      {kind === 'maxed' ? (
        <div className={styles.manualBox}>
          <p className={styles.manualTitle}>
            <CheckIcon size={16} aria-hidden="true" />
            직접 완료 처리할 수 있어요
          </p>
          <p className={styles.manualDescription}>
            직접 완료해도 방금 올린 사진은 앨범에 그대로 남아요.
          </p>
        </div>
      ) : (
        <>
          {kind === 'success' ? (
            // 성공이면 미션과 맞은 항목만 보여줘요. (점수와 상관없는 항목은 빼요)
            matchedLabels.length > 0 && (
              <section className={styles.card} aria-labelledby="found-title">
                <p id="found-title" className={styles.cardHeader}>
                  사진에서 찾은 것
                </p>
                <ul className={styles.labels}>
                  {matchedLabels.map((label) => (
                    <li key={label.name} className={styles.labelMatched}>
                      {label.name}
                    </li>
                  ))}
                </ul>
              </section>
            )
          ) : (
            <section className={styles.card} aria-label="분석 결과">
              {verdict.detected_labels.length > 0 && (
                <>
                  <p className={styles.cardHeader}>사진에서 알아본 것</p>
                  <ul className={styles.labels}>
                    {verdict.detected_labels.map((label) => (
                      <li key={label.name} className={styles.label}>
                        {label.name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p
                className={
                  verdict.detected_labels.length > 0 ? styles.cardNote : styles.cardNoteOnly
                }
              >
                <InfoIcon size={15} aria-hidden="true" />
                {analysisNote}
              </p>
            </section>
          )}

          {/* 장소 이름은 백엔드에 추가 요청한 값이라 있을 때만 보여요. */}
          {placeName &&
            (landmarkFound ? (
              <section className={styles.landmark}>
                <MapPinIcon size={20} aria-hidden="true" />
                <div>
                  <p className={styles.landmarkLabel}>랜드마크를 찾았어요</p>
                  <p className={styles.landmarkName}>{placeName}</p>
                </div>
              </section>
            ) : (
              <p className={styles.landmarkMissing}>
                <MapPinIcon size={15} aria-hidden="true" />이 사진에서는 랜드마크를 찾지 못했어요
              </p>
            ))}
        </>
      )}

      <div className={styles.footer}>
        {kind === 'success' ? (
          <>
            <Button size="lg" className="h-13 w-full text-base font-semibold" onClick={goToList}>
              다음 미션 보기
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full text-base font-semibold"
              onClick={saveToDevice}
            >
              사진 저장
            </Button>
          </>
        ) : kind === 'maxed' ? (
          <>
            <Button
              size="lg"
              className="h-13 w-full text-base font-semibold"
              disabled={completing}
              onClick={completeManually}
            >
              직접 완료 처리하기
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full text-sm text-[var(--color-text-muted)]"
              onClick={goToList}
            >
              나중에 하기
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              className="h-13 w-full text-base font-semibold"
              onClick={submission.openCamera}
            >
              <CameraIcon className="size-4" aria-hidden="true" />
              다시 촬영하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full text-base font-semibold"
              onClick={goToList}
            >
              나중에 하기
            </Button>
          </>
        )}
      </div>

      <AlertDialog
        open={submission.notice !== null}
        title={submission.notice?.title ?? ''}
        description={submission.notice?.description}
        primaryAction={{ label: '확인', onClick: submission.clearNotice }}
        onClose={submission.clearNotice}
      />
      {submission.inputs}
    </main>
  );
}
