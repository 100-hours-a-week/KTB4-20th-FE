import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

/** 경고 아이콘, 제목, 설명과 세로로 쌓인 버튼을 가진 안내 팝업입니다. (shadcn Dialog 기반) */
export default function AlertDialog({
  open,
  title,
  description,
  primaryAction,
  secondaryAction,
  onClose,
}: AlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showCloseButton={false} className="gap-5 rounded-[var(--radius-lg)] p-5 pt-6">
        <DialogHeader className="items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent">
            <CircleAlert className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="leading-snug">{title}</DialogTitle>
          {description && (
            <DialogDescription className="break-keep">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-12 w-full rounded-full"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button
              size="lg"
              variant="secondary"
              className="h-12 w-full rounded-full"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
