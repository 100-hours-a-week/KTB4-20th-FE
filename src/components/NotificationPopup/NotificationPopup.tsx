import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { NotificationType, WeatherCondition } from '../../api/notifications';
import { NotificationTypeIcon } from '../../notifications/notificationDisplay';
import type { DialogAction } from '../AlertDialog/AlertDialog';

interface NotificationPopupProps {
  open: boolean;
  type: NotificationType;
  weatherCondition: WeatherCondition | null;
  title: string;
  description: string;
  secondaryAction: DialogAction;
  primaryAction: DialogAction;
  /** ESC 키나 배경 클릭으로 닫힐 때 호출됩니다. */
  onClose: () => void;
}

/** 여행 D-1·이상 기후 알림 팝업. 유형(날씨) 아이콘, 제목, 설명과 나란한 두 버튼을 가집니다. */
export default function NotificationPopup({
  open,
  type,
  weatherCondition,
  title,
  description,
  secondaryAction,
  primaryAction,
  onClose,
}: NotificationPopupProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 rounded-[var(--radius-lg)] p-5 pt-6 text-center sm:max-w-xs"
      >
        <DialogHeader className="items-center gap-2">
          <span
            className="mb-1 flex size-12 items-center justify-center rounded-full bg-[var(--color-point-soft)] text-[var(--color-point-text)]"
            aria-hidden="true"
          >
            <NotificationTypeIcon
              type={type}
              weatherCondition={weatherCondition}
              className="size-6"
              strokeWidth={1.8}
            />
          </span>
          <DialogTitle className="text-base leading-snug font-bold">{title}</DialogTitle>
          <DialogDescription className="text-sm break-keep whitespace-pre-line">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="secondary"
            className="h-11 flex-1"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </Button>
          <Button
            size="lg"
            className="h-11 flex-1"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            {primaryAction.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
