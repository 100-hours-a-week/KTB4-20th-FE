import { ArrowDownIcon, MinusIcon, PlusIcon } from 'lucide-react';
import type { ScheduleDay, ScheduleStop } from '../../api/schedule';
import { Button } from '@/components/ui/button';
import { formatSlashDateWithWeekday } from '../../utils/date';
import { formatDistance } from '../../utils/distance';
import RouteMap from './RouteMap';
import styles from './TripSchedule.module.css';

interface ScheduleDayEditActions {
  onRemove: (stop: ScheduleStop) => void;
  /** position은 1부터 시작하는 끼워 넣을 방문 순서예요. */
  onAdd: (position: number) => void;
}

interface ScheduleDayViewProps {
  day: ScheduleDay;
  /** 넘기면 장소마다 제거(−)·추가(+) 버튼을 보여줘요. */
  edit?: ScheduleDayEditActions;
}

/** 하루치 동선을 지도와 방문 순서 목록으로 보여줍니다. */
export default function ScheduleDayView({ day, edit }: ScheduleDayViewProps) {
  return (
    <>
      {day.stops.length > 0 && <RouteMap stops={day.stops} />}

      <h2 className={styles.dayHeader}>
        Day {day.dayNumber} · {formatSlashDateWithWeekday(day.date)}
      </h2>

      {day.stops.length === 0 ? (
        <div className={styles.emptyDay}>
          <p>이 날은 아직 방문할 장소가 없어요.</p>
          {edit && (
            <button type="button" className={styles.emptyDayAdd} onClick={() => edit.onAdd(1)}>
              <PlusIcon size={16} aria-hidden="true" />
              장소 추가하기
            </button>
          )}
        </div>
      ) : (
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
                  {edit && (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => edit.onRemove(stop)}
                      aria-label={`${stop.name} 일정에서 제거`}
                    >
                      <MinusIcon size={20} />
                    </button>
                  )}
                </div>
                {(leg || edit) && (
                  <div className={styles.legRow}>
                    {leg ? (
                      <span className={styles.legDistance}>
                        <ArrowDownIcon size={14} aria-hidden="true" />
                        {formatDistance(leg.distanceMeters)}
                      </span>
                    ) : (
                      <span />
                    )}
                    {edit && (
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => edit.onAdd(stop.order + 1)}
                        aria-label={`${stop.name} 다음에 장소 추가`}
                      >
                        <PlusIcon size={20} />
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

interface DayNavButtonsProps {
  dayIndex: number;
  dayCount: number;
  onMove: (index: number) => void;
}

/** 첫날은 "다음 날", 마지막 날은 "전 날", 그 사이는 두 버튼을 모두 보여줘요. 하루짜리 여행이면 아무것도 그리지 않아요. */
export function DayNavButtons({ dayIndex, dayCount, onMove }: DayNavButtonsProps) {
  const hasPrevDay = dayIndex > 0;
  const hasNextDay = dayIndex < dayCount - 1;
  if (!hasPrevDay && !hasNextDay) return null;

  return (
    <div className={styles.dayNav}>
      {hasPrevDay && (
        <Button
          size="lg"
          variant="secondary"
          className="h-13 flex-1 rounded-full text-base font-semibold"
          onClick={() => onMove(dayIndex - 1)}
        >
          전 날 일정
        </Button>
      )}
      {hasNextDay && (
        <Button
          size="lg"
          className="h-13 flex-1 rounded-full text-base font-semibold"
          onClick={() => onMove(dayIndex + 1)}
        >
          다음 날 일정
        </Button>
      )}
    </div>
  );
}
