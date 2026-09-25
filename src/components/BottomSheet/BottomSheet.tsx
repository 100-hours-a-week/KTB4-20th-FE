import type { ReactNode } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

interface BottomSheetProps {
  open: boolean;
  /** 화면에 보이지 않는 제목입니다. 스크린 리더가 시트 이름으로 읽습니다. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 화면 아래에서 올라오는 시트입니다. 바깥 영역을 누르거나 ESC 키로 닫힙니다.
 * shadcn Dialog와 같은 base-ui Dialog 위에 만들었습니다.
 */
export default function BottomSheet({ open, label, onClose, children }: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[480px] flex-col rounded-t-[var(--radius-lg)] bg-background px-4 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))] text-foreground outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom motion-reduce:animate-none">
          <span className="mb-4 h-1 w-9 self-center rounded-full bg-border" aria-hidden="true" />
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
