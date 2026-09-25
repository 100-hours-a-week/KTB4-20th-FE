import { useId, type ReactNode } from 'react';
import useModalDialog from '../../hooks/useModalDialog';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  open: boolean;
  /** 화면에 보이지 않는 제목입니다. 스크린 리더가 시트 이름으로 읽습니다. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/** 화면 아래에서 올라오는 시트입니다. 바깥 영역을 누르거나 ESC 키로 닫힙니다. */
export default function BottomSheet({ open, label, onClose, children }: BottomSheetProps) {
  const dialogProps = useModalDialog(open, onClose);
  const labelId = useId();

  return (
    <dialog {...dialogProps} className={styles.sheet} aria-labelledby={labelId}>
      <div className={styles.content}>
        <span className={styles.handle} aria-hidden="true" />
        <h2 id={labelId} className={styles.srOnly}>
          {label}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
