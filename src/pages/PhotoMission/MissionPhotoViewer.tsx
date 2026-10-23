import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ImageOffIcon,
  MapPinIcon,
  RotateCwIcon,
  ShareIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteMissionPhoto,
  getMissionPhotoDetail,
  getPhotoMissionDetail,
  type PhotoMissionDetail,
  type PhotoMissionPhoto,
  type PhotoMissionPhotoDetail,
} from '../../api/photoMissions';
import Avatar from '../../components/Avatar/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { formatMissionTime, SCOPE_LABELS } from './photoMissionFormat';
import { savePhotos, sharePhotos, warmPhotoFiles } from './photoShare';
import styles from './MissionPhotoViewer.module.css';

/** 옆으로 이만큼 밀면 다음·이전 사진으로 넘겨요. */
const SWIPE_THRESHOLD = 40;

/**
 * 앨범에 보이는 사진만 골라요. 백엔드 앨범 기준과 같아요: 완료한 미션만, 그룹 미션은
 * 대표 사진과 완료 이후에 올린 사진만. 판정에 실패한 사진은 빠져요.
 */
function albumPhotos(mission: PhotoMissionDetail): PhotoMissionPhoto[] {
  if (mission.status !== 'COMPLETED') return [];
  if (mission.scope !== 'GROUP') return mission.photos;
  const completedAt = mission.completedAt ? Date.parse(mission.completedAt) : null;
  return mission.photos.filter(
    (photo) =>
      photo.representative ||
      (completedAt !== null && Date.parse(photo.submittedAt) >= completedAt),
  );
}

/**
 * 미션 사진 상세보기. 한 미션의 사진을 넘겨 봐요(그룹 미션은 멤버들 사진, 개인 미션은 내 사진).
 * 앨범에서 열면(`from=album`) 앨범에 보이던 사진만 넘겨요.
 * 삭제는 내가 올린 사진만 할 수 있어요.
 */
export default function MissionPhotoViewer() {
  const { missionId: missionIdParam } = useParams<{ missionId: string }>();
  const missionId = Number(missionIdParam);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPhotoId = Number(searchParams.get('photoId')) || null;
  const fromAlbum = searchParams.get('from') === 'album';
  const [mission, setMission] = useState<PhotoMissionDetail | null | 'error'>(null);
  // 상세를 못 받은 사진은 null로 남겨 다시 부르지 않아요.
  const [details, setDetails] = useState<Record<number, PhotoMissionPhotoDetail | null>>({});
  // 사진 주소는 몇 분 뒤 만료돼요. 못 불러온 사진은 안내를 보여주고, 다시 불러오면 새 주소를 받아요.
  const [brokenImages, setBrokenImages] = useState<Record<string, true>>({});
  const [reloadCount, setReloadCount] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => {
    const hasHistory = (window.history.state as { idx?: number } | null)?.idx;
    if (hasHistory) navigate(-1);
    else navigate(`/photo-missions/missions/${missionId}`, { replace: true });
  }, [missionId, navigate]);

  useEffect(() => {
    let cancelled = false;
    getPhotoMissionDetail(missionId).then(
      (data) => {
        if (cancelled) return;
        setMission(data);
        setBrokenImages({});
        warmPhotoFiles(data.photos.map((photo) => photo.imageUrl));
      },
      () => {
        if (cancelled) return;
        // 다시 불러오기에 실패하면 보던 화면은 그대로 두고 알려줘요.
        if (reloadCount > 0) toast.error('사진을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        else setMission('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [missionId, reloadCount]);

  const photos = useMemo(() => {
    if (!mission || mission === 'error') return [];
    return fromAlbum ? albumPhotos(mission) : mission.photos;
  }, [mission, fromAlbum]);
  const foundIndex = photos.findIndex((photo) => photo.photoId === requestedPhotoId);
  const index = foundIndex >= 0 ? foundIndex : 0;
  const photo = photos[index];
  const photoId = photo?.photoId;

  // 장소와 올린 사람은 사진 상세 API에서 받아요. 한 번 부른 사진은 결과와 상관없이 다시 부르지 않아요.
  // 판정에 실패한 그룹 사진은 상세가 404라 장소 없이 보여줘요.
  useEffect(() => {
    if (!photoId || photoId in details) return;
    let cancelled = false;
    getMissionPhotoDetail(missionId, photoId).then(
      (detail) => {
        if (!cancelled) setDetails((previous) => ({ ...previous, [photoId]: detail }));
      },
      () => {
        if (!cancelled) setDetails((previous) => ({ ...previous, [photoId]: null }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [missionId, photoId, details]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const next = photos[nextIndex];
      if (!next) return;
      setSearchParams(
        (previous) => {
          const params = new URLSearchParams(previous);
          params.set('photoId', String(next.photoId));
          return params;
        },
        { replace: true },
      );
    },
    [photos, setSearchParams],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (confirmingDelete) return;
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, index, close, confirmingDelete]);

  if (mission === 'error' || (mission && photos.length === 0)) {
    return (
      <main className={styles.viewer}>
        <div className={styles.topBar}>
          <span />
          <button type="button" className={styles.iconButton} onClick={close} aria-label="닫기">
            <XIcon size={22} />
          </button>
        </div>
        <p className={styles.emptyText}>
          {mission === 'error' ? '사진을 불러오지 못했어요' : '볼 수 있는 사진이 없어요'}
        </p>
      </main>
    );
  }
  if (!mission || !photo) {
    return <LoadingScreen />;
  }

  const detail = details[photo.photoId];
  const me = mission.members.find((member) => member.me);
  const isMine = !!me && photo.submittedByUserId === me.userId;
  const isGroup = mission.scope === 'GROUP';
  const placeName = detail?.place?.placeName ?? mission.placeName;
  const imageBroken = Boolean(brokenImages[photo.imageUrl]);
  // 백엔드 규칙과 같아요: 그룹 미션은 대표 사진을 지울 때만 미완료로 돌아가요.
  // AI로 완료했으면 대신할 판정 성공 사진이 없어서, 직접 완료했으면 남은 사진이 없을 때 돌아가요.
  const deleteRevertsMission =
    !isGroup ||
    (photo.representative &&
      (mission.completionMethod !== 'MANUAL' || mission.photos.length <= 1));
  const deleteClosesMission =
    deleteRevertsMission && (mission.completionMethod === 'MANUAL' || mission.retryCount >= 3);

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD) goTo(index + 1);
    if (delta >= SWIPE_THRESHOLD) goTo(index - 1);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteMissionPhoto(mission.missionId, photo.photoId);
      toast.success('사진을 삭제했어요.');
      setConfirmingDelete(false);
      close();
    } catch {
      toast.error('사진을 삭제하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className={styles.viewer}>
      <div className={styles.topBar}>
        <span className={styles.counter} aria-live="polite">
          {index + 1} / {photos.length}
        </span>
        <button type="button" className={styles.iconButton} onClick={close} aria-label="닫기">
          <XIcon size={22} />
        </button>
      </div>

      <section className={styles.stage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {imageBroken ? (
          <div className={styles.photoFallback}>
            <ImageOffIcon size={32} aria-hidden="true" />
            <p className={styles.photoFallbackText}>사진을 불러오지 못했어요</p>
            <button
              type="button"
              className={styles.photoFallbackButton}
              onClick={() => setReloadCount((count) => count + 1)}
            >
              <RotateCwIcon size={16} aria-hidden="true" />
              다시 불러오기
            </button>
          </div>
        ) : (
          <img
            src={photo.imageUrl}
            alt={`${photo.submittedByUsername}님이 올린 '${mission.description}' 사진`}
            className={styles.photo}
            onError={() =>
              setBrokenImages((previous) => ({ ...previous, [photo.imageUrl]: true }))
            }
          />
        )}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navButton} ${styles.prev}`}
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="이전 사진"
            >
              <ChevronLeftIcon size={22} />
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.next}`}
              onClick={() => goTo(index + 1)}
              disabled={index === photos.length - 1}
              aria-label="다음 사진"
            >
              <ChevronRightIcon size={22} />
            </button>
          </>
        )}
        <span className={styles.time}>{formatMissionTime(photo.submittedAt)}</span>
      </section>

      {photos.length > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {photos.map((item, dotIndex) => (
            <span
              key={item.photoId}
              className={dotIndex === index ? styles.dotActive : styles.dot}
            />
          ))}
        </div>
      )}

      <section className={styles.info}>
        <h1 className={styles.title}>
          {mission.description}
          <span className={styles.badge}>{SCOPE_LABELS[mission.scope]}</span>
          {photo.representative && <span className={styles.badgeStrong}>대표</span>}
        </h1>
        <p className={styles.uploader}>
          <Avatar name={photo.submittedByUsername} size="xs" muted />
          {isMine ? '내가 올렸어요' : `${photo.submittedByUsername}님이 올렸어요`}
        </p>
        {placeName && (
          <p className={styles.place}>
            <MapPinIcon size={18} aria-hidden="true" />
            <span>
              <span className={styles.placeLabel}>미션 장소</span>
              {placeName}
            </span>
          </p>
        )}
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={() => void savePhotos([photo.imageUrl])}
          disabled={imageBroken}
        >
          <DownloadIcon size={18} aria-hidden="true" />
          저장
        </button>
        <button
          type="button"
          className={styles.action}
          disabled={imageBroken}
          onClick={() =>
            void sharePhotos(
              [photo.imageUrl],
              `포토미션 '${mission.description}'`,
              window.location.href,
            )
          }
        >
          <ShareIcon size={18} aria-hidden="true" />
          공유
        </button>
        {isMine && !mission.expired && (
          <button
            type="button"
            className={`${styles.action} ${styles.danger}`}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2Icon size={18} aria-hidden="true" />
            삭제
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        media={<img src={photo.imageUrl} alt="" className={styles.deleteThumb} />}
        title="사진을 삭제할까요?"
        description={
          deleteClosesMission
            ? `'${mission.description}' 미션은\n다시 진행할 수 없고 앨범에서도 사라져요`
            : deleteRevertsMission
              ? `'${mission.description}' 미션이\n미완료로 돌아가고 앨범에서도 사라져요`
              : '앨범에서 사라져요. 미션은 완료 상태로 유지돼요'
        }
        confirmTone="danger"
        confirmAction={{ label: '삭제', onClick: confirmDelete, disabled: deleting }}
        cancelAction={{
          label: '취소',
          onClick: () => setConfirmingDelete(false),
          disabled: deleting,
        }}
        onClose={() => !deleting && setConfirmingDelete(false)}
      />
    </main>
  );
}
