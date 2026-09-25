import { useEffect, useRef, type MouseEvent, type SyntheticEvent } from 'react';

/**
 * `<dialog>` 요소를 `open` 값에 맞춰 열고 닫습니다.
 * ESC 키와 배경 클릭은 `onClose`로 전달합니다.
 */
export default function useModalDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return { ref: dialogRef, onCancel, onClick };
}
