import { useId } from 'react';
import useModalDialog from '../../hooks/useModalDialog';
import Button from '../Button/Button';
import styles from './AlertDialog.module.css';

export interface DialogAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface AlertDialogProps {
  open: boolean;
  title: string;
  description?: string;
  primaryAction: DialogAction;
  secondaryAction?: DialogAction;
  /** ESC 키나 배경 클릭으로 닫힐 때 호출됩니다. */
  onClose: () => void;
}

/** 경고 아이콘, 제목, 설명과 세로로 쌓인 액션 버튼을 가진 모달 다이얼로그입니다. */
export default function AlertDialog({
  open,
  title,
  description,
  primaryAction,
  secondaryAction,
  onClose,
}: AlertDialogProps) {
  const dialogProps = useModalDialog(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <dialog
      {...dialogProps}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          !
        </span>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
        <div className={styles.actions}>
          <Button
            shape="pill"
            fullWidth
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button
              variant="secondary"
              shape="pill"
              fullWidth
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
