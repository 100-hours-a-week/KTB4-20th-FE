import { CheckIcon } from '../Icon/icons';
import styles from './Toast.module.css';

interface ToastProps {
  message: string | null;
  showCheck?: boolean;
}

/** 화면 아래쪽에 잠깐 떠오르는 알림입니다. 표시 시간은 부르는 쪽에서 정합니다. */
export default function Toast({ message, showCheck = false }: ToastProps) {
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message && (
        <p className={styles.toast}>
          {showCheck && <CheckIcon size={14} strokeWidth={2.5} />}
          {message}
        </p>
      )}
    </div>
  );
}
