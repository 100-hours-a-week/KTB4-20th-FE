import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapIcon, ShareIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import {
  addScheduleStop,
  deleteScheduleStop,
  getSchedule,
  SCHEDULE_ERROR_CODES,
  SCHEDULE_MAX_STOPS,
  SCHEDULE_MIN_STOPS,
  type ScheduleDay,
  type ScheduleDetail,
  type ScheduleStop,
} from '../../api/schedule';
import {
  getTripDetail,
  TRIP_DETAIL_ERROR_CODES,
  type TripDetail as TripDetailData,
} from '../../api/trips';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { getPlaceSearchArea } from '../../constants/placeSearchAreas';
import type { PlaceSearchResult } from '../../lib/placeSearch';
import { formatDotDate } from '../../utils/date';
import PlaceSearch from './PlaceSearch';
import ScheduleDayView, { DayNavButtons } from './ScheduleDayView';
import styles from './TripSchedule.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; trip: TripDetailData; schedule: ScheduleDetail }
  | { status: 'invalid' }
  | { status: 'error' };

/** 추가 팝업에 띄울 장소와 끼워 넣을 위치 */
interface PendingAdd {
  dayId: string;
  position: number;
  place: PlaceSearchResult;
}

const DAY_PARAM = 'day';
/** 장소 검색 화면이 열려 있을 때 끼워 넣을 방문 순서를 담는 주소 파라미터 */
const ADD_POSITION_PARAM = 'add';

const STOP_CHANGE_ERROR_MESSAGES: Record<string, string> = {
  [SCHEDULE_ERROR_CODES.minimumStopsRequired]: `하루 일정에는 장소가 ${SCHEDULE_MIN_STOPS}개 이상 있어야 해요.`,
  [SCHEDULE_ERROR_CODES.maximumStopsExceeded]: `하루에 장소는 최대 ${SCHEDULE_MAX_STOPS}개까지 넣을 수 있어요.`,
  [SCHEDULE_ERROR_CODES.placeAlreadyExists]: '이미 일정에 있는 장소예요.',
  [SCHEDULE_ERROR_CODES.changeNotAllowed]: '여행이 시작돼서 일정을 바꿀 수 없어요.',
  [SCHEDULE_ERROR_CODES.hostRequired]: '방장만 일정을 바꿀 수 있어요.',
  [SCHEDULE_ERROR_CODES.dayNotFound]: '일정이 바뀌었어요. 새로고침 후 다시 시도해 주세요.',
  [SCHEDULE_ERROR_CODES.stopNotFound]: '일정이 바뀌었어요. 새로고침 후 다시 시도해 주세요.',
};

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** 여행방의 확정 일정을 날짜별로 보여주고, 방장은 여행 시작 전까지 장소를 추가·제거할 수 있어요. */
export default function TripSchedule() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [pendingRemove, setPendingRemove] = useState<ScheduleStop | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setState({ status: 'invalid' });
      return;
    }
    let cancelled = false;

    async function load() {
      setState({ status: 'loading' });
      try {
        const [trip, schedule] = await Promise.all([getTripDetail(tripId!), getSchedule(tripId!)]);
        if (!cancelled) setState({ status: 'ready', trip, schedule });
      } catch (error) {
        if (cancelled) return;
        const code = getApiErrorCode(error);
        if (code === SCHEDULE_ERROR_CODES.notFound) {
          // 아직 코스를 확정하지 않았으면 코스 선택 화면에서 후보를 보여줘요. (그룹원은 보기만 해요)
          navigate(`/trips/${encodeURIComponent(tripId!)}/courses`, { replace: true });
        } else if (
          code === TRIP_DETAIL_ERROR_CODES.memberRequired ||
          code === TRIP_DETAIL_ERROR_CODES.notFound
        ) {
          setState({ status: 'invalid' });
        } else {
          setState({ status: 'error' });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate, tripId]);

  const goBack = () =>
    navigate(tripId ? `/trips/${encodeURIComponent(tripId)}` : '/', { replace: true });

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status !== 'ready') {
    const copy = {
      invalid: { title: '여행방을 찾을 수 없어요', description: '여행방 멤버만 일정을 볼 수 있어요' },
      error: { title: '일정을 불러오지 못했어요', description: '잠시 후 다시 시도해 주세요' },
    }[state.status];

    return (
      <main className={styles.centerScreen}>
        <StatusMessage icon={<MapIcon size={20} strokeWidth={1.6} />} title={copy.title} description={copy.description}>
          <Button size="lg" className="h-13 w-full" onClick={goBack}>
            여행방으로 돌아가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  const { trip, schedule } = state;
  const days = schedule.days;
  const requestedDay = parsePositiveInt(searchParams.get(DAY_PARAM)) ?? 1;
  const dayIndex = Math.min(Math.max(requestedDay, 1), Math.max(days.length, 1)) - 1;
  const day: ScheduleDay | undefined = days[dayIndex];

  // 장소 수 제한은 하루 단위예요. 지금 보고 있는 날의 장소만 셉니다.
  const dayStopCount = day?.stops.length ?? 0;
  // 방장이고 변경 기한(여행 시작 10분 전) 전일 때만 백엔드가 true로 보내요.
  const editable = schedule.editable;
  const searchArea = getPlaceSearchArea(trip.region.regionCode);
  const addPosition = editable ? parsePositiveInt(searchParams.get(ADD_POSITION_PARAM)) : null;

  const moveToDay = (index: number) => {
    setSearchParams({ [DAY_PARAM]: String(index + 1) }, { replace: true });
    window.scrollTo({ top: 0 });
  };

  const replaceDay = (updated: ScheduleDay) => {
    setState((current) =>
      current.status === 'ready'
        ? {
            ...current,
            schedule: {
              ...current.schedule,
              days: current.schedule.days.map((item) =>
                item.dayId === updated.dayId ? updated : item,
              ),
            },
          }
        : current,
    );
  };

  const showStopChangeError = (error: unknown, fallback: string) => {
    const code = getApiErrorCode(error);
    toast.error((code && STOP_CHANGE_ERROR_MESSAGES[code]) ?? fallback);
  };

  const openPlaceSearch = (position: number) => {
    if (!searchArea) {
      toast.error('이 지역은 장소 검색을 지원하지 않아요.');
      return;
    }
    if (dayStopCount >= SCHEDULE_MAX_STOPS) {
      toast.error(STOP_CHANGE_ERROR_MESSAGES[SCHEDULE_ERROR_CODES.maximumStopsExceeded]);
      return;
    }
    // 검색 화면도 기록에 남겨서 휴대폰 뒤로가기로 닫을 수 있게 해요.
    setSearchParams(
      { [DAY_PARAM]: String(dayIndex + 1), [ADD_POSITION_PARAM]: String(position) },
      { state: { placeSearchOpened: true } },
    );
  };

  const closePlaceSearch = () => {
    // 이 화면에서 연 검색이면 기록을 되돌리고, 주소로 바로 들어온 경우에는 파라미터만 지워요.
    if ((location.state as { placeSearchOpened?: boolean } | null)?.placeSearchOpened) {
      navigate(-1);
    } else {
      setSearchParams({ [DAY_PARAM]: String(dayIndex + 1) }, { replace: true });
    }
  };

  const handleSelectPlace = (place: PlaceSearchResult) => {
    if (!day || addPosition === null) return;
    setPendingAdd({ dayId: day.dayId, position: addPosition, place });
    closePlaceSearch();
  };

  const requestRemove = (stop: ScheduleStop) => {
    if (dayStopCount <= SCHEDULE_MIN_STOPS) {
      toast.error(STOP_CHANGE_ERROR_MESSAGES[SCHEDULE_ERROR_CODES.minimumStopsRequired]);
      return;
    }
    setPendingRemove(stop);
  };

  const confirmAdd = async () => {
    if (!tripId || !pendingAdd) return;
    const { place } = pendingAdd;
    setSubmitting(true);
    try {
      const result = await addScheduleStop(tripId, {
        scheduleDayId: Number(pendingAdd.dayId),
        position: pendingAdd.position,
        place: {
          googlePlaceId: place.googlePlaceId,
          name: place.name,
          categoryName: place.categoryName,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          phone: place.phone,
          placeUrl: place.placeUrl,
        },
      });
      replaceDay(result.day);
      setPendingAdd(null);
      toast.success(`${place.name}을(를) 일정에 추가했어요.`);
    } catch (error) {
      showStopChangeError(error, '장소를 추가하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = async () => {
    if (!tripId || !pendingRemove) return;
    setSubmitting(true);
    try {
      const result = await deleteScheduleStop(tripId, pendingRemove.stopId);
      replaceDay(result.day);
      toast.success(`${pendingRemove.name}을(를) 일정에서 제거했어요.`);
      setPendingRemove(null);
    } catch (error) {
      showStopChangeError(error, '장소를 제거하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${trip.name} 여행 일정`, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success('일정 링크를 복사했어요.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('공유하지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <main className={styles.container}>
      <PageHeader
        title={trip.name}
        subtitle={formatDotDate(day?.date ?? trip.startDate)}
        onBack={goBack}
      />

      {day ? (
        <ScheduleDayView
          key={day.dayId}
          day={day}
          edit={editable ? { onAdd: openPlaceSearch, onRemove: requestRemove } : undefined}
        />
      ) : (
        <StatusMessage
          icon={<MapIcon size={20} strokeWidth={1.6} />}
          title="아직 확정된 일정이 없어요"
          description="방장이 코스를 정하면 여기에서 일정을 볼 수 있어요"
        />
      )}

      <div className={styles.footer}>
        <DayNavButtons dayIndex={dayIndex} dayCount={days.length} onMove={moveToDay} />
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={handleShare}
        >
          <ShareIcon className="size-4" />
          공유하기
        </Button>
      </div>

      {addPosition !== null && searchArea && (
        <PlaceSearch
          area={searchArea}
          regionName={trip.region.regionName}
          onBack={closePlaceSearch}
          onSelect={handleSelectPlace}
        />
      )}

      <ConfirmDialog
        open={pendingAdd !== null}
        title="해당 장소를 추가할까요?"
        confirmAction={{ label: '추가', onClick: () => void confirmAdd(), disabled: submitting }}
        cancelAction={{ label: '취소', onClick: () => setPendingAdd(null), disabled: submitting }}
        onClose={() => !submitting && setPendingAdd(null)}
      >
        {pendingAdd && <span className={styles.placeChip}>{pendingAdd.place.name}</span>}
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="해당 장소를 제거할까요?"
        confirmAction={{ label: '제거', onClick: () => void confirmRemove(), disabled: submitting }}
        cancelAction={{ label: '취소', onClick: () => setPendingRemove(null), disabled: submitting }}
        onClose={() => !submitting && setPendingRemove(null)}
      >
        {pendingRemove && (
          <>
            <span className={styles.placeChip}>{pendingRemove.name}</span>
            <p className={styles.dialogNote}>삭제한 후에는 되돌릴 수 없습니다.</p>
          </>
        )}
      </ConfirmDialog>
    </main>
  );
}
