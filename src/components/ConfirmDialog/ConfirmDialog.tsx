import { useId, type ReactNode } from 'react';
import useModalDialog from '../../hooks/useModalDialog';
import type { DialogAction } from '../AlertDialog/AlertDialog';
import Button from '../Button/Button';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  /** 제목 위에 둘 아이콘 (선택) */
  icon?: ReactNode;
  title: string;
  description?: string;
  confirmAction: DialogAction;
  cancelAction: DialogAction;
  onClose: () => void;
}

/** 가운데 정렬된 제목·설명과 가로로 나란한 취소/확인 버튼을 가진 확인 다이얼로그입니다. */
export default function ConfirmDialog({
  open,
  icon,
  title,
  description,
  confirmAction,
  cancelAction,
  onClose,
}: ConfirmDialogProps) {
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
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
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
            variant="secondary"
            fullWidth
            onClick={cancelAction.onClick}
            disabled={cancelAction.disabled}
          >
            {cancelAction.label}
          </Button>
          <Button fullWidth onClick={confirmAction.onClick} disabled={confirmAction.disabled}>
            {confirmAction.label}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
