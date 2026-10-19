import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BellIcon, CircleAlertIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationListItem,
} from '../../api/notifications';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { useNotifications } from '../../notifications/NotificationContext';
import {
  isResponseClosed,
  NotificationTypeIcon,
  RESPONSE_CLOSED_MESSAGE,
} from '../../notifications/notificationDisplay';
import { formatRelativeTime } from '../../utils/relativeTime';
import styles from './Notifications.module.css';

type LoadStatus = 'loading' | 'success' | 'error';

const EXPIRED_TARGET_MESSAGE = '더 이상 확인할 수 없는 항목이에요.';

/** 이동 대상이 없어졌거나, 이상 기후 알림의 응답 기한(여행 시작)이 지난 알림 (BR-NOTI-06) */
function isClosed(item: NotificationListItem): boolean {
  if (item.target?.status === 'EXPIRED') return true;
  return item.type === 'TRIP_WEATHER_ALERT' && isResponseClosed(item.createdAt);
}

/** 알림 목록 화면. 최신순으로 처음 20개, 마지막에 닿으면 10개씩 더 불러옵니다. (BR-NOTI-04) */
export default function Notifications() {
  const navigate = useNavigate();
  const { unreadCount, refreshUnreadCount, setUnreadCount, openPopup } = useNotifications();
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.page.hasNext ? page.page.nextCursor : null);
        setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    void refreshUnreadCount();
    return () => {
      cancelled = true;
    };
  }, [refreshUnreadCount]);

  const loadMore = useCallback(async () => {
    // 다음 페이지를 불러오는 동안에는 중복 요청을 막는다.
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const page = await getNotifications(nextCursor);
      setItems((previous) => {
        const seen = new Set(previous.map((item) => item.notificationId));
        return [...previous, ...page.items.filter((item) => !seen.has(item.notificationId))];
      });
      setNextCursor(page.page.hasNext ? page.page.nextCursor : null);
    } catch {
      setLoadMoreFailed(true);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [nextCursor]);

  const canLoadMore = status === 'success' && nextCursor !== null && !loadMoreFailed;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, loadMore, items.length]);

  const markLocallyAsRead = (notificationId: string) =>
    setItems((previous) =>
      previous.map((item) =>
        item.notificationId === notificationId ? { ...item, read: true } : item,
      ),
    );

  const handleSelect = (item: NotificationListItem) => {
    if (!item.read) {
      markLocallyAsRead(item.notificationId);
      markNotificationAsRead(item.notificationId)
        .then(() => refreshUnreadCount())
        .catch(() => {
          // 실패해도 다음에 목록을 열면 서버 상태로 다시 보여준다.
        });
    }

    if (!item.target || isClosed(item)) {
      toast(EXPIRED_TARGET_MESSAGE);
      return;
    }
    if (item.type === 'TRIP_WEATHER_ALERT') {
      // 방장은 일정 유지·변경을, 멤버는 일정 확인을 고를 수 있게 팝업을 다시 띄운다.
      openPopup({
        notificationId: item.notificationId,
        type: item.type,
        weatherCondition: item.weatherCondition,
        title: item.title,
        body: item.body,
        target: { type: item.target.type, id: item.target.id },
        createdAt: item.createdAt,
      });
      return;
    }
    navigate(`/trips/${encodeURIComponent(item.target.id)}`);
  };

  const hasUnread = (unreadCount ?? 0) > 0 || items.some((item) => !item.read);

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsRead();
      setItems((previous) => previous.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      toast.error('모두 읽음 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <main className={styles.container}>
      <PageHeader
        title="알림"
        centered
        onBack={() => navigate(-1)}
        action={
          <button
            type="button"
            className={styles.readAllButton}
            onClick={() => void handleReadAll()}
            disabled={!hasUnread}
          >
            모두 읽음
          </button>
        }
      />

      {status === 'loading' && (
        <div className={styles.list} aria-busy="true" aria-label="알림을 불러오는 중">
          {[0, 1, 2].map((index) => (
            <NotificationItemSkeleton key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className={styles.statusArea}>
          <StatusMessage
            icon={<CircleAlertIcon size={26} strokeWidth={1.8} />}
            title="알림을 가져오지 못했어요"
            description="잠시 후 다시 시도해 주세요"
          />
        </div>
      )}

      {status === 'success' && items.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <BellIcon size={28} strokeWidth={1.6} />
          </span>
          <p className={styles.emptyText}>아직 새로운 알림이 없어요.</p>
        </div>
      )}

      {status === 'success' && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.notificationId}>
              <NotificationItem item={item} onSelect={() => handleSelect(item)} />
            </li>
          ))}
        </ul>
      )}

      {isLoadingMore && (
        <div className={styles.list} aria-busy="true" aria-label="알림을 더 불러오는 중">
          <NotificationItemSkeleton />
        </div>
      )}
      {loadMoreFailed && (
        <button type="button" className={styles.retryButton} onClick={() => void loadMore()}>
          알림을 더 불러오지 못했어요. 다시 시도
        </button>
      )}
      <div ref={sentinelRef} className={styles.sentinel} />
    </main>
  );
}

function NotificationItem({
  item,
  onSelect,
}: {
  item: NotificationListItem;
  onSelect: () => void;
}) {
  const closed = isClosed(item);
  // 응답 기한이 지난 이상 기후 알림은 일정 변경 질문 대신 기한 안내를 보여준다.
  const body = closed && item.type === 'TRIP_WEATHER_ALERT' ? RESPONSE_CLOSED_MESSAGE : item.body;
  const muted = item.read || closed;

  return (
    <button
      type="button"
      className={`${styles.item} ${muted ? styles.itemMuted : ''}`}
      onClick={onSelect}
    >
      <span className={styles.itemIcon} aria-hidden="true">
        <NotificationTypeIcon
          type={item.type}
          weatherCondition={item.weatherCondition}
          size={20}
          strokeWidth={1.8}
        />
      </span>
      <span className={styles.itemText}>
        <span className={styles.itemTitle}>
          {item.title}
          {!item.read && <span className={styles.unreadDot} aria-label="읽지 않음" />}
        </span>
        <span className={styles.itemBody}>{body}</span>
        <time className={styles.itemTime} dateTime={item.createdAt}>
          {formatRelativeTime(item.createdAt)}
        </time>
      </span>
    </button>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className={styles.item}>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
