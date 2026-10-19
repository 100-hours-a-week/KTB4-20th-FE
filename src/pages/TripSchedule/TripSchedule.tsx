import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownIcon, MapIcon, ShareIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/errors';
import { getSchedule, SCHEDULE_ERROR_CODES, type ScheduleDetail } from '../../api/schedule';
import {
  getTripDetail,
  TRIP_DETAIL_ERROR_CODES,
  type TripDetail as TripDetailData,
} from '../../api/trips';
import { Button } from '@/components/ui/button';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { formatDotDate, formatSlashDateWithWeekday, getToday } from '../../utils/date';
import RouteMap from './RouteMap';
import styles from './TripSchedule.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; trip: TripDetailData; schedule: ScheduleDetail }
  | { status: 'notFound' }
  | { status: 'invalid' }
  | { status: 'error' };

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
}

/** 여행방이 만든 AI 일정을 지도와 방문 순서 목록으로 보여줍니다. */
export default function TripSchedule() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

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
          setState({ status: 'notFound' });
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
  }, [tripId]);

  const goBack = () =>
    navigate(tripId ? `/trips/${encodeURIComponent(tripId)}` : '/', { replace: true });

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status !== 'ready') {
    const copy = {
      invalid: {
        title: '여행방을 찾을 수 없어요',
        description: '여행방 멤버만 일정을 볼 수 있어요',
      },
      notFound: {
        title: '아직 만든 일정이 없어요',
        description: '여행방에서 AI 일정을 먼저 만들어 주세요',
      },
      error: { title: '일정을 불러오지 못했어요', description: '잠시 후 다시 시도해 주세요' },
    }[state.status];

    return (
      <main className={styles.centerScreen}>
        <StatusMessage
          icon={<MapIcon size={20} strokeWidth={1.6} />}
          title={copy.title}
          description={copy.description}
        >
          <Button size="lg" className="h-13 w-full" onClick={goBack}>
            여행방으로 돌아가기
          </Button>
        </StatusMessage>
      </main>
    );
  }

  const { trip, schedule } = state;
  // 다일 여행은 Day마다 일정이 따로 와요. 처음에는 여행 중이면 오늘, 아니면 Day 1을 보여줘요.
  const today = getToday();
  const defaultDay = schedule.days.find((item) => item.date === today) ?? schedule.days[0] ?? null;
  const day = schedule.days.find((item) => item.dayNumber === selectedDayNumber) ?? defaultDay;

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
        subtitle={
          trip.endDate === trip.startDate
            ? formatDotDate(trip.startDate)
            : `${formatDotDate(trip.startDate)} ~ ${formatDotDate(trip.endDate)}`
        }
        onBack={goBack}
      />

      {day ? (
        <>
          {schedule.days.length > 1 && (
            <div className={styles.dayTabs} role="tablist" aria-label="여행 날짜">
              {schedule.days.map((item) => (
                <button
                  key={item.dayId}
                  type="button"
                  role="tab"
                  aria-selected={item.dayNumber === day.dayNumber}
                  className={styles.dayTab}
                  onClick={() => setSelectedDayNumber(item.dayNumber)}
                >
                  Day {item.dayNumber}
                </button>
              ))}
            </div>
          )}

          <RouteMap stops={day.stops} />

          <h2 className={styles.dayHeader}>
            Day {day.dayNumber} · {formatSlashDateWithWeekday(day.date)}
            {day.stops.length > 0 && ` · ${day.stops.length}곳`}
            {day.totalDistanceMeters > 0 && ` · ${formatDistance(day.totalDistanceMeters)}`}
          </h2>

          <ol className={styles.stopList}>
            {day.stops.map((stop) => {
              const leg = day.legs.find((item) => item.fromStopId === stop.stopId);
              return (
                <li key={stop.stopId}>
                  <div className={styles.stopCard}>
                    <span className={styles.stopBadge}>{stop.order}</span>
                    <div className={styles.stopBody}>
                      <p className={styles.stopName}>{stop.name}</p>
                      <p className={styles.stopMeta}>
                        {[stop.categoryName, stop.address].filter(Boolean).join(' · ')}
                      </p>
                      {stop.selectionReason && (
                        <p className={styles.stopReason}>{stop.selectionReason}</p>
                      )}
                    </div>
                  </div>
                  {leg && (
                    <p className={styles.legRow}>
                      <ArrowDownIcon size={14} aria-hidden="true" />
                      {formatDistance(leg.distanceMeters)}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <StatusMessage
          icon={<MapIcon size={20} strokeWidth={1.6} />}
          title="아직 만든 일정이 없어요"
          description="여행방에서 AI 일정을 먼저 만들어 주세요"
        />
      )}

      <div className={styles.footer}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={handleShare}
        >
          <ShareIcon className="size-4" />
          공유하기
        </Button>
      </div>
    </main>
  );
}
