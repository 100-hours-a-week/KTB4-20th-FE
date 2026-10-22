import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CameraIcon,
  CameraOffIcon,
  CheckIcon,
  ClockIcon,
  ImagesIcon,
  PlusIcon,
} from 'lucide-react';
import { getApiErrorCode } from '../../api/errors';
import {
  getPhotoMissions,
  PHOTO_MISSION_ERROR_CODES,
  type PhotoMissionCard,
  type PhotoMissionList as PhotoMissionListData,
} from '../../api/photoMissions';
import { getSchedule, SCHEDULE_ERROR_CODES } from '../../api/schedule';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { getToday } from '../../utils/date';
import {
  formatMissionContext,
  formatMonthDayWeekday,
  formatTripRange,
  SCOPE_LABELS,
  shortenName,
} from './photoMissionFormat';
import styles from './PhotoMission.module.css';

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      data: PhotoMissionListData;
      hasSchedule: boolean;
    }
  | { status: 'invalid' }
  | { status: 'error' };

interface PhotoMissionListProps {
  tripId: string;
  /** 포토미션 첫 화면으로 돌아가요. */
  onBack: () => void;
}

/** 진행 중인 여행의 Day별 포토미션 목록입니다. */
export default function PhotoMissionList({ tripId, onBack }: PhotoMissionListProps) {
  const navigate = useNavigate();
  const [day, setDay] = useState<number | undefined>(undefined);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPhotoMissions(tripId, day);
        // 미션이 하나도 없으면 일정 없이 시작한 여행인지, 생성에 실패했는지 일정 API로 구분해요.
        let hasSchedule = true;
        if (data.selectedDay.published && data.selectedDay.missions.length === 0) {
          hasSchedule = await getSchedule(tripId).then(
            () => true,
            (error: unknown) => getApiErrorCode(error) !== SCHEDULE_ERROR_CODES.notFound,
          );
        }
        if (!cancelled) setState({ status: 'ready', data, hasSchedule });
      } catch (error) {
        if (cancelled) return;
        const code = getApiErrorCode(error);
        const invalid =
          code === PHOTO_MISSION_ERROR_CODES.tripNotFound ||
          code === PHOTO_MISSION_ERROR_CODES.memberRequired;
        setState({ status: invalid ? 'invalid' : 'error' });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tripId, day, reloadKey]);

  // 이미 보고 있는 Day를 다시 누르면 아무것도 하지 않아요. 다른 Day는 화면을 지우지 않고 바꿔요.
  const selectDay = (dayNumber: number) => {
    if (state.status === 'ready' && state.data.selectedDay.dayNumber === dayNumber) return;
    setDay(dayNumber);
  };

  if (state.status === 'loading') {
    return <ListSkeleton />;
  }

  if (state.status === 'invalid' || state.status === 'error') {
    return (
      <>
        <PageHeader title="포토미션" onBack={onBack} />
        <div className={styles.centerBody}>
          <StatusMessage
            icon={<CameraIcon size={20} strokeWidth={1.6} />}
            title={
              state.status === 'invalid' ? '여행방을 찾을 수 없어요' : '미션을 불러오지 못했어요'
            }
            description={
              state.status === 'invalid'
                ? '여행방 멤버만 포토미션을 볼 수 있어요'
                : '잠시 후 다시 시도해 주세요'
            }
          >
            <Button size="lg" className="h-13 w-full" onClick={reload}>
              다시 불러오기
            </Button>
          </StatusMessage>
        </div>
      </>
    );
  }

  const { data, hasSchedule } = state;
  const { trip, days, selectedDay } = data;
  // 다른 Day를 불러오는 동안에는 누른 탭을 먼저 선택해 보여주고 목록을 흐리게 둬요.
  const activeDay = day ?? selectedDay.dayNumber;
  const switchingDay = activeDay !== selectedDay.dayNumber;
  const isToday = selectedDay.date === getToday();
  const progress =
    selectedDay.totalMissionCount > 0
      ? (selectedDay.completedMissionCount / selectedDay.totalMissionCount) * 100
      : 0;
  // 지난 Day를 다시 볼 때는 "오늘"·"내일" 대신 Day 번호로 말해요.
  // 앨범은 여행 마지막 날이 지난 뒤에 열어요. (백엔드는 막지 않아서 화면에서만 막아요)
  const albumOpen = getToday() > trip.endDate;
  const albumHint = albumOpen
    ? '앨범에서 함께 남긴 사진을 볼 수 있어요'
    : '여행이 끝나면 앨범에서 다시 볼 수 있어요';
  const doneCopy = !selectedDay.nextDayExists
    ? { title: '여행 미션을 다 끝냈어요', description: albumHint }
    : isToday
      ? {
          title: '오늘 미션을 다 끝냈어요',
          description: `내일 아침에 Day ${selectedDay.dayNumber + 1} 미션이 도착해요`,
        }
      : {
          title: `Day ${selectedDay.dayNumber} 미션을 다 끝냈어요`,
          description: albumHint,
        };
  const goToAlbum = () => navigate(`/photo-missions/album?tripId=${encodeURIComponent(tripId)}`);

  return (
    <>
      <div className={styles.listHeader}>
        <PageHeader
          title={trip.name}
          subtitle={`${formatTripRange(trip.startDate, trip.endDate)} · ${trip.memberCount}명`}
          onBack={onBack}
        />
      </div>

      {days.length > 1 && (
        <div className={styles.dayTabs} role="tablist" aria-label="여행 날짜">
          {days.map((tab) => (
            <button
              key={tab.dayNumber}
              type="button"
              role="tab"
              aria-selected={tab.dayNumber === activeDay}
              className={styles.dayTab}
              disabled={!tab.selectable}
              onClick={() => selectDay(tab.dayNumber)}
            >
              Day {tab.dayNumber}
            </button>
          ))}
        </div>
      )}
      <p className={styles.dayDate}>
        {isToday ? '오늘 · ' : ''}
        {formatMonthDayWeekday(selectedDay.date)}
      </p>

      {!selectedDay.published ? (
        // 백엔드는 여행 첫날 0시~0시 30분에 전체 일정의 미션을 만들고, 각 날 0시 30분에 공개해요.
        <div className={styles.inlineStatus}>
          <StatusMessage
            icon={<ClockIcon size={20} strokeWidth={1.6} />}
            title="0시 30분에 미션이 열려요"
            description="조금만 기다리면 오늘 동선에 맞는 사진 미션이 도착해요"
          />
        </div>
      ) : selectedDay.missions.length === 0 ? (
        // 공개 시각이 지났는데 미션이 없으면 앞으로도 생기지 않아요. (생성은 첫날 0시 30분 전에만 해요)
        <div className={styles.inlineStatus}>
          <StatusMessage
            icon={<CameraOffIcon size={20} strokeWidth={1.6} />}
            title="이번 여행에는 미션이 없어요"
            description={
              hasSchedule
                ? '미션을 만들지 못했어요'
                : '일정 없이 시작한 여행이라 미션이 만들어지지 않았어요'
            }
          />
        </div>
      ) : (
        <>
          {selectedDay.completed && (
            <section className={styles.doneBanner}>
              <span className={styles.doneIcon} aria-hidden="true">
                <CheckIcon size={18} strokeWidth={2.4} />
              </span>
              <div>
                <p className={styles.doneTitle}>{doneCopy.title}</p>
                <p className={styles.doneDescription}>{doneCopy.description}</p>
              </div>
            </section>
          )}

          <section className={styles.progressBlock} aria-label="미션 진행">
            <div className={styles.progressRow}>
              <span>미션 진행</span>
              <strong>
                {selectedDay.completedMissionCount}/{selectedDay.totalMissionCount} 완료
              </strong>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={selectedDay.totalMissionCount}
              aria-valuenow={selectedDay.completedMissionCount}
            >
              <span className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </section>

          <section
            aria-labelledby="mission-list-title"
            aria-busy={switchingDay}
            className={switchingDay ? styles.switching : undefined}
          >
            <h2 id="mission-list-title" className={styles.sectionTitle}>
              {isToday ? '오늘의 미션' : `Day ${selectedDay.dayNumber} 미션`}
            </h2>
            <ul className={styles.missionList}>
              {selectedDay.missions.map((mission) => (
                <li key={mission.missionId}>
                  <MissionRow
                    mission={mission}
                    onOpen={() =>
                      navigate(
                        `/photo-missions/missions/${mission.missionId}?tripId=${encodeURIComponent(tripId)}`,
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* 앨범 버튼은 여행 마지막 Day에서만 보여줘요. */}
      {selectedDay.missions.length > 0 && !selectedDay.nextDayExists && (
        <div className={styles.listFooter}>
          <Button
            size="lg"
            variant={albumOpen ? 'default' : 'outline'}
            className="h-13 w-full text-base font-semibold"
            disabled={!albumOpen}
            aria-describedby={albumOpen ? undefined : 'album-locked-hint'}
            onClick={goToAlbum}
          >
            <ImagesIcon className="size-4" aria-hidden="true" />
            미션 앨범 보기
          </Button>
          {!albumOpen && (
            <p id="album-locked-hint" className={styles.footerHint}>
              앨범은 여행이 끝난 다음 날 열려요
            </p>
          )}
        </div>
      )}
    </>
  );
}

function MissionRow({ mission, onOpen }: { mission: PhotoMissionCard; onOpen: () => void }) {
  const done = mission.status === 'COMPLETED';
  const context = formatMissionContext(mission.placeName, mission.primaryCategory);
  const progressText =
    mission.scope === 'GROUP'
      ? done && mission.completedBy
        ? `${shortenName(mission.completedBy.username)}님이 완료했어요`
        : null
      : mission.totalMemberCount !== null
        ? `${mission.completedMemberCount ?? 0}/${mission.totalMemberCount}명 완료`
        : null;

  return (
    <button type="button" className={styles.missionRow} onClick={onOpen}>
      {done && mission.thumbnailUrl ? (
        <img src={mission.thumbnailUrl} alt="" className={styles.missionThumb} />
      ) : (
        <span className={styles.missionThumbEmpty} aria-hidden="true">
          {done ? <CameraIcon size={18} /> : <PlusIcon size={18} />}
        </span>
      )}
      <span className={styles.missionBody}>
        <span className={styles.missionTitleRow}>
          <span className={styles.missionTitle}>{mission.description}</span>
          <span className={styles.scopeBadge}>{SCOPE_LABELS[mission.scope]}</span>
        </span>
        {context && <span className={styles.missionContext}>{context}</span>}
        {progressText && <span className={styles.missionProgress}>{progressText}</span>}
      </span>
      <span className={done ? styles.statusDone : styles.statusTodo}>
        {done ? '완료' : '미완료'}
      </span>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="포토미션을 불러오는 중">
      <Skeleton className="h-7 w-[140px] bg-accent" />
      <Skeleton className="h-4 w-[180px] bg-accent" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-[72px] rounded-full bg-accent" />
        <Skeleton className="h-10 w-[72px] rounded-full bg-accent" />
      </div>
      <Skeleton className="h-2 w-full bg-accent" />
      <Skeleton className="h-[300px] w-full rounded-[var(--radius-lg)] bg-accent" />
    </div>
  );
}
