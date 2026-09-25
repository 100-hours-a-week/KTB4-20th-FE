import { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  badgeCount?: number;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function Toast({ message, badgeCount, onDismiss, autoDismissMs = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, autoDismissMs, message]);

  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.toast}>
        {badgeCount != null && <span className={styles.badge}>{badgeCount}</span>}
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
