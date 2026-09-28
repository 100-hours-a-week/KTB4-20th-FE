import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DialogAction } from '../AlertDialog/AlertDialog';

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

/** 가운데 정렬된 제목·설명과 가로로 나란한 취소/확인 버튼을 가진 확인 팝업입니다. (shadcn Dialog 기반) */
export default function ConfirmDialog({
  open,
  icon,
  title,
  description,
  confirmAction,
  cancelAction,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showCloseButton={false} className="gap-5 p-5 text-center sm:max-w-xs">
        <DialogHeader className="items-center gap-2">
          {icon && (
            <span
              className="mb-1 flex size-9 items-center justify-center rounded-full bg-accent text-muted-foreground"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <DialogTitle className="leading-snug font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs break-keep">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="secondary"
            className="h-11 flex-1"
            onClick={cancelAction.onClick}
            disabled={cancelAction.disabled}
          >
            {cancelAction.label}
          </Button>
          <Button
            size="lg"
            className="h-11 flex-1"
            onClick={confirmAction.onClick}
            disabled={confirmAction.disabled}
          >
            {confirmAction.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
