import { BellIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../notifications/NotificationContext';
import styles from './NotificationBell.module.css';

const MAX_DISPLAY_COUNT = 99;

/** 알림 목록으로 가는 버튼. 읽지 않은 알림 수를 배지로 보여주고 99개를 넘으면 99+로 줄인다. */
export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const count = unreadCount ?? 0;
  const badge = count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(count);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => navigate('/notifications')}
      aria-label={count > 0 ? `알림, 읽지 않은 알림 ${badge}개` : '알림'}
    >
      <BellIcon size={17} strokeWidth={1.9} aria-hidden="true" />
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      )}
    </button>
  );
}
