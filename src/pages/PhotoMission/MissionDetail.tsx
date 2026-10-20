import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CameraIcon, CheckIcon, ImageIcon, InfoIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import {
  completeMissionManually,
  getPhotoMissionDetail,
  PHOTO_MISSION_ERROR_CODES,
  type PhotoMissionDetail,
} from '../../api/photoMissions';
import { Button } from '@/components/ui/button';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import Avatar from '../../components/Avatar/Avatar';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { formatMissionCategory, formatMissionTime, SCOPE_LABELS } from './photoMissionFormat';
import { usePhotoSubmission } from './usePhotoSubmission';
import styles from './MissionDetail.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; mission: PhotoMissionDetail }
  | { status: 'notFound' }
  | { status: 'error' };

/** 미션 하나의 정보, 제출한 사진, 멤버별 현황과 사진 올리기 버튼을 보여줍니다. */
export default function MissionDetail() {
  const { missionId: missionIdParam } = useParams<{ missionId: string }>();
  const missionId = Number(missionIdParam);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const [completing, setCompleting] = useState(false);

  const loaded = state.status === 'ready' ? state.mission : null;
  const loadedDone = loaded?.status === 'COMPLETED';
  const submission = usePhotoSubmission(missionId, {
    // 완료한 그룹 미션은 판정 없이 사진을 더하고, 완료한 개인 미션은 다시 찍기(판정 성공 시에만 교체)예요.
    additional: loaded?.scope === 'GROUP' && loadedDone,
    retake: loaded?.scope === 'PERSONAL' && loadedDone,
    tripId,
    onChanged: reload,
  });

  useEffect(() => {
    if (!Number.isInteger(missionId) || missionId <= 0) return;
    let cancelled = false;
    getPhotoMissionDetail(missionId).then(
      (mission) => {
        if (!cancelled) setState({ status: 'ready', mission });
      },
      (error: unknown) => {
        if (cancelled) return;
        const code = getApiErrorCode(error);
        const notFound =
          code === PHOTO_MISSION_ERROR_CODES.notFound ||
          code === PHOTO_MISSION_ERROR_CODES.memberRequired ||
          code === PHOTO_MISSION_ERROR_CODES.tripNotFound;
        setState({ status: notFound ? 'notFound' : 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [missionId, reloadKey]);

  // 목록에서 들어오면 뒤로 가기로 같은 Day 목록에 돌아가고, 주소로 바로 들어왔으면 포토미션 탭으로 가요.
  const goBack = () => {
    const hasHistory = (window.history.state as { idx?: number } | null)?.idx;
    if (hasHistory) navigate(-1);
    else navigate('/photo-missions', { replace: true });
  };

  if (!Number.isInteger(missionId) || missionId <= 0 || state.status === 'notFound') {
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<CameraIcon size={20} strokeWidth={1.6} />}
          title="미션을 찾을 수 없어요"
          description="여행방 멤버만 볼 수 있고, 미션은 그날 0시 30분에 열려요"
        >
          <Button size="lg" className="h-13 w-full" onClick={goBack}>
            미션 목록으로 가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (submission.submitting) {
    return (
      <LoadingScreen
        title="사진을 확인하고 있어요"
        description="미션에 맞는 사진인지 AI가 보고 있어요. 30초쯤 걸릴 수 있어요"
      />
    );
  }

  if (state.status === 'error') {
    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<CameraIcon size={20} strokeWidth={1.6} />}
          title="미션을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요"
        >
          <Button size="lg" className="h-13 w-full" onClick={reload}>
            다시 불러오기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  const { mission } = state;
  const me = mission.members.find((member) => member.me);
  const isGroup = mission.scope === 'GROUP';
  const done = mission.status === 'COMPLETED';
  const myPhoto = me
    ? mission.photos.find((photo) => photo.submittedByUserId === me.userId)
    : undefined;
  const category = formatMissionCategory(mission.primaryCategory);
  const completedMembers = mission.members.filter((member) => member.status === 'COMPLETED');
  const groupCompleter = isGroup
    ? mission.members.find((member) => member.status === 'COMPLETED' && member.completedAt)
    : undefined;
  const representative = mission.photos.find((photo) => photo.representative);
  const completerName = representative?.submittedByUsername ?? groupCompleter?.username;

  // 판정에 3번 실패하면 더 올릴 수 없고, 마지막 사진으로 직접 완료만 할 수 있어요. (백엔드 규칙)
  const canCompleteManually = mission.status === 'PENDING' && mission.retryCount >= 3;
  // 직접 완료한 사진이나 3번 실패한 뒤의 사진을 지우면 미션을 다시 할 수 없어요(FAILED).
  const closed = mission.status === 'FAILED';

  const completeManually = async () => {
    setCompleting(true);
    try {
      await completeMissionManually(mission.missionId);
      toast.success('미션을 직접 완료했어요.');
      reload();
    } catch (error) {
      toast.error(
        getApiErrorCode(error) === PHOTO_MISSION_ERROR_CODES.manualCompletionNotAllowed
          ? '지금은 직접 완료할 수 없어요.'
          : '완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      reload();
    } finally {
      setCompleting(false);
    }
  };

  const openPhoto = (photoId: number) =>
    navigate(`/photo-missions/missions/${mission.missionId}/photos?photoId=${photoId}`);

  return (
    <main className={styles.page}>
      <PageHeader title="미션 상세" onBack={goBack} />

      <section className={styles.hero}>
        <span className={done ? styles.heroIconDone : styles.heroIcon} aria-hidden="true">
          {done ? (
            <CheckIcon size={30} strokeWidth={2.4} />
          ) : (
            <CameraIcon size={30} strokeWidth={1.6} />
          )}
        </span>
        <h1 className={styles.title}>
          {mission.description}
          <span className={styles.scopeBadge}>{SCOPE_LABELS[mission.scope]}</span>
        </h1>
        {mission.placeName && <p className={styles.place}>{mission.placeName}</p>}
        {done && mission.completedAt ? (
          isGroup && completerName ? (
            <p className={styles.metaChip}>
              <Avatar name={completerName} size="xs" muted />
              {completerName}님이 완료 · {formatMissionTime(mission.completedAt)}
            </p>
          ) : (
            <p className={styles.metaChip}>
              {formatMissionTime(mission.completedAt)}에 완료
              {mission.completionMethod === 'MANUAL' && ' · 직접 완료'}
            </p>
          )
        ) : (
          category && <p className={styles.metaChip}>그룹 취향 '{category}'에서 만들어졌어요</p>
        )}
      </section>

      {done && mission.photos.length > 0 && (
        <section className={styles.section} aria-labelledby="photos-title">
          <div className={styles.sectionHeader}>
            <h2 id="photos-title" className={styles.sectionTitle}>
              {isGroup ? '제출된 사진' : '내가 올린 사진'}
            </h2>
            {isGroup && <span className={styles.sectionCount}>{mission.photos.length}장</span>}
          </div>
          {isGroup ? (
            <ul className={styles.photoGrid}>
              {mission.photos.map((photo) => (
                <li key={photo.photoId}>
                  <button
                    type="button"
                    className={styles.photoItem}
                    onClick={() => openPhoto(photo.photoId)}
                  >
                    <img src={photo.imageUrl} alt={`${photo.submittedByUsername}님이 올린 사진`} />
                    <span className={styles.photoCaption}>
                      {photo.representative && <span className={styles.repBadge}>대표</span>}
                      {photo.submittedByUsername}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            myPhoto && (
              <button
                type="button"
                className={styles.singlePhotoButton}
                onClick={() => openPhoto(myPhoto.photoId)}
              >
                <img src={myPhoto.imageUrl} alt="내가 올린 사진" className={styles.singlePhoto} />
              </button>
            )
          )}
        </section>
      )}

      {isGroup ? (
        !done && (
          <p className={styles.groupNotice}>
            <span className={styles.avatarStack} aria-hidden="true">
              {mission.members.slice(0, 4).map((member, index) => (
                <Avatar
                  key={member.tripMemberId}
                  name={member.username}
                  imageUrl={member.profileImageUrl}
                  size="xs"
                  host={index === 0}
                  muted={index !== 0}
                />
              ))}
            </span>
            한 명만 올리면 멤버 모두 완료돼요
          </p>
        )
      ) : (
        // 개인 미션은 사진은 각자 보고, 완료 여부만 얼굴로 함께 봐요. (완료한 사람은 진하게, 아직이면 흐리게)
        <p className={styles.groupNotice}>
          <span className={styles.avatarStack} aria-hidden="true">
            {mission.members.map((member) => (
              <span
                key={member.tripMemberId}
                className={member.status === 'COMPLETED' ? undefined : styles.avatarPending}
              >
                <Avatar
                  name={member.username}
                  imageUrl={member.profileImageUrl}
                  size="xs"
                  muted={!member.me}
                />
              </span>
            ))}
          </span>
          {mission.members.length}명 중 {completedMembers.length}명 완료
          <span className="sr-only">
            {completedMembers.length > 0 &&
              ` (완료: ${completedMembers.map((member) => member.username).join(', ')})`}
          </span>
        </p>
      )}

      <div className={styles.footer}>
        {mission.expired ? (
          <p className={styles.tip}>
            <InfoIcon size={16} aria-hidden="true" />
            여행이 끝나 이 미션에는 더 사진을 올릴 수 없어요.
          </p>
        ) : closed ? (
          <p className={styles.tip}>
            <InfoIcon size={16} aria-hidden="true" />
            올린 사진을 지워서 이 미션은 더 진행할 수 없어요.
          </p>
        ) : canCompleteManually ? (
          <>
            <div className={styles.manualBox}>
              <p className={styles.manualTitle}>
                <CheckIcon size={16} aria-hidden="true" />
                직접 완료 처리할 수 있어요
              </p>
              <p className={styles.manualDescription}>
                {mission.retryCount}번 시도했지만 AI가 알아보지 못했어요. 마지막에 올린 사진이
                미션에 맞다고 생각되면 직접 완료로 표시하세요. 앨범에는 그대로 저장돼요.
              </p>
            </div>
            <Button
              size="lg"
              className="h-13 w-full text-base font-semibold"
              disabled={completing}
              onClick={completeManually}
            >
              직접 완료 처리하기
            </Button>
          </>
        ) : !done ? (
          <>
            <p className={styles.tip}>
              <InfoIcon size={16} aria-hidden="true" />
              {isGroup
                ? '함께 나와야 하는 미션이면 모두의 얼굴이 보이게 찍어주세요. 뒷모습이나 가려진 얼굴은 인식되지 않을 수 있어요.'
                : '찍을 대상이 화면에 크고 또렷하게 나오게 찍어주세요. 멀리서 작게 나오면 실패할 수 있어요.'}
            </p>
            <Button
              size="lg"
              className="h-13 w-full text-base font-semibold"
              onClick={submission.openCamera}
            >
              <CameraIcon className="size-4" aria-hidden="true" />
              사진 촬영하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full text-base font-semibold"
              onClick={submission.openLibrary}
            >
              <ImageIcon className="size-4" aria-hidden="true" />
              앨범에서 선택
            </Button>
          </>
        ) : isGroup ? (
          <Button
            size="lg"
            variant="outline"
            className="h-13 w-full text-base font-semibold"
            onClick={submission.openLibrary}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            사진 더 추가하기
          </Button>
        ) : (
          // 사진 삭제는 쓸 일이 드물어서, 사진을 눌러 들어가는 사진 상세보기에만 둬요.
          <Button
            size="lg"
            variant="outline"
            className="h-13 w-full text-base font-semibold"
            onClick={submission.openCamera}
          >
            사진 다시 찍기
          </Button>
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
