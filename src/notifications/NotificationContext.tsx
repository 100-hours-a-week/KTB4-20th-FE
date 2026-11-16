import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  acknowledgeNotificationDelivery,
  getPendingNotificationDeliveries,
  getUnreadNotificationCount,
  markNotificationAsRead,
  type IncomingNotification,
} from '../api/notifications';
import { getTripDetail, type TripMemberRole } from '../api/trips';
import { useAiJobs } from '../aiJobs/AiJobContext';
import { useAuth } from '../auth/AuthContext';
import NotificationPopup from '../components/NotificationPopup/NotificationPopup';
import { connectNotificationSocket } from '../realtime/notificationSocket';
import { clearExpiredDeliveries, markDelivered, wasDelivered } from './deliveredStore';

interface PopupEntry {
  notification: IncomingNotification;
  /** 이상 기후 알림 버튼을 방장·멤버로 나누기 위한 역할. 확인 전에는 undefined. */
  role?: TripMemberRole;
}

interface NotificationContextValue {
  /** 읽지 않은 알림 수. 아직 모르면 null */
  unreadCount: number | null;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  /** 알림 목록에서 이상 기후 알림을 눌렀을 때처럼 팝업을 다시 띄운다. */
  openPopup: (notification: IncomingNotification) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function tripPath(notification: IncomingNotification, suffix = ''): string | null {
  if (notification.target?.type !== 'TRIP') return null;
  return `/trips/${encodeURIComponent(notification.target.id)}${suffix}`;
}

function photoMissionPath(notification: IncomingNotification): string | null {
  if (notification.target?.type !== 'PHOTO_MISSION') return null;
  return `/photo-missions/missions/${encodeURIComponent(notification.target.id)}`;
}

/** 알림 종류별 팝업 이동 버튼. 이상 기후 알림의 방장 선택은 호출하는 쪽에서 따로 정한다. */
function primaryActionOf(
  notification: IncomingNotification,
  goTo: (path: string | null) => void,
): { label: string; onClick: () => void } {
  switch (notification.type) {
    case 'SCHEDULE_GENERATION_SUCCEEDED':
      return { label: '코스 보러가기', onClick: () => goTo(tripPath(notification, '/courses')) };
    case 'SCHEDULE_GENERATION_FAILED':
      return { label: '여행방으로 가기', onClick: () => goTo(tripPath(notification)) };
    case 'PHOTO_MISSION_EVALUATION_SUCCEEDED':
      return { label: '결과 확인하기', onClick: () => goTo(photoMissionPath(notification)) };
    case 'PHOTO_MISSION_EVALUATION_FAILED':
      return { label: '다시 시도하기', onClick: () => goTo(photoMissionPath(notification)) };
    default:
      return { label: '일정 확인하기', onClick: () => goTo(tripPath(notification, '/schedule')) };
  }
}

/** "D-1, 경주 지역에 폭우가 예보되었어요. 일정을 변경할까요?"처럼 두 문장이면 줄을 나눈다. */
function toPopupDescription(body: string): string {
  return body.replace(/([.!?]) (?=\S)/g, '$1\n');
}

/**
 * 로그인한 동안 알림 채널을 연결해 미읽음 수와 D-1·이상 기후 알림 팝업을 관리한다.
 * 연결 → 구독 완료 → 당일 미전달 알림 복구 순서로 진행하고, 화면에 반영한 알림마다 ACK를 보낸다.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [queue, setQueue] = useState<PopupEntry[]>([]);
  const { consumeNotification } = useAiJobs();
  const userPublicId = status === 'authenticated' ? (user?.publicId ?? null) : null;

  // 로그아웃하거나 다른 계정으로 바뀌면 이전 사용자의 미읽음 수와 팝업을 비운다.
  const [previousUserPublicId, setPreviousUserPublicId] = useState(userPublicId);
  if (previousUserPublicId !== userPublicId) {
    setPreviousUserPublicId(userPublicId);
    setUnreadCount(null);
    setQueue([]);
  }

  const refreshUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadNotificationCount());
    } catch {
      // 다음 갱신 때 다시 불러온다.
    }
  }, []);

  const enqueue = useCallback((notification: IncomingNotification) => {
    setQueue((previous) =>
      previous.some((entry) => entry.notification.notificationId === notification.notificationId)
        ? previous
        : [
            ...previous,
            {
              notification,
              role: notification.type === 'TRIP_WEATHER_ALERT' ? undefined : 'MEMBER',
            },
          ],
    );
  }, []);

  useEffect(() => {
    if (!userPublicId) return;

    const handleIncoming = (notification: IncomingNotification) => {
      // 이미 띄운 알림은 다시 띄우지 않지만, 이전 ACK 실패를 복구하기 위해 ACK는 다시 보낸다.
      if (!wasDelivered(userPublicId, notification)) {
        markDelivered(userPublicId, notification);
        // 내가 요청한 AI 작업의 결과를 진행 카드가 보여줬으면 같은 내용의 팝업은 띄우지 않는다.
        if (!consumeNotification(notification)) enqueue(notification);
        void refreshUnreadCount();
      }
      void acknowledgeNotificationDelivery(notification.notificationId).catch(() => {
        // ACK에 실패하면 다음 진입 때 pending 복구로 다시 받아 ACK한다.
      });
    };

    clearExpiredDeliveries();
    void refreshUnreadCount();
    return connectNotificationSocket({
      onNotification: handleIncoming,
      onSubscribed: () => {
        getPendingNotificationDeliveries()
          .then((items) => items.forEach(handleIncoming))
          .catch(() => {
            // 복구에 실패해도 알림 목록과 미읽음 수로 확인할 수 있다.
          });
      },
    });
  }, [userPublicId, enqueue, refreshUnreadCount, consumeNotification]);

  const current = queue[0];

  // 이상 기후 알림은 방장에게만 일정 변경 선택을 보여주므로 내 역할을 확인한 뒤 띄운다.
  useEffect(() => {
    if (!current || current.role !== undefined) return;
    const { notificationId, target } = current.notification;
    let cancelled = false;

    const setRole = (role: TripMemberRole) => {
      if (cancelled) return;
      setQueue((previous) =>
        previous.map((entry) =>
          entry.notification.notificationId === notificationId ? { ...entry, role } : entry,
        ),
      );
    };
    if (!target || target.type !== 'TRIP') {
      setRole('MEMBER');
      return;
    }
    getTripDetail(target.id)
      .then((trip) => setRole(trip.myRole))
      // 확인하지 못하면 일정 변경을 할 수 없는 멤버 화면으로 보여준다.
      .catch(() => setRole('MEMBER'));
    return () => {
      cancelled = true;
    };
  }, [current]);

  const closeCurrent = useCallback(() => setQueue((previous) => previous.slice(1)), []);

  const markCurrentAsRead = useCallback(
    (notification: IncomingNotification) => {
      markNotificationAsRead(notification.notificationId)
        .then(() => refreshUnreadCount())
        .catch(() => {
          // 읽음 처리에 실패해도 목록에서 다시 선택하면 읽음으로 바뀐다.
        });
    },
    [refreshUnreadCount],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      refreshUnreadCount,
      setUnreadCount,
      openPopup: enqueue,
    }),
    [unreadCount, refreshUnreadCount, enqueue],
  );

  const popup = current?.role ? current : null;
  const notification = popup?.notification;
  const isHostDecision = notification?.type === 'TRIP_WEATHER_ALERT' && popup?.role === 'HOST';

  const goTo = (path: string | null) => {
    if (!notification) return;
    markCurrentAsRead(notification);
    closeCurrent();
    if (path) navigate(path);
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <NotificationPopup
          key={notification.notificationId}
          open
          type={notification.type}
          weatherCondition={notification.weatherCondition}
          title={notification.title}
          description={toPopupDescription(notification.body)}
          secondaryAction={
            isHostDecision
              ? {
                  label: '그대로 둘게요',
                  onClick: () => {
                    markCurrentAsRead(notification);
                    closeCurrent();
                    toast('기존 일정을 그대로 유지해요.');
                  },
                }
              : { label: '닫기', onClick: closeCurrent }
          }
          primaryAction={
            isHostDecision
              ? {
                  label: '일정 변경하기',
                  onClick: () => goTo(tripPath(notification, '/weather-replan')),
                }
              : primaryActionOf(notification, goTo)
          }
          onClose={closeCurrent}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications는 NotificationProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
