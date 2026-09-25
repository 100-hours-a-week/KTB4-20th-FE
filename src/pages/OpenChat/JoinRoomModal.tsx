import { useEffect, useState } from 'react';
import {
  consentToChatPolicy,
  fetchChatPolicy,
  getApiErrorCode,
  joinRegionalChatRoom,
  type ChatPolicy,
  type RegionalChatRoomItem,
} from '../../api/chat';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface JoinRoomModalProps {
  room: RegionalChatRoomItem;
  onClose: () => void;
  onJoined: (room: RegionalChatRoomItem) => void;
}

const SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  CHAT_POLICY_VERSION_NOT_ACTIVE: '채팅 운영 원칙이 갱신됐어요. 다시 시도해 주세요.',
  CHAT_POLICY_CONSENT_REQUIRED: '채팅 운영 원칙에 동의해야 입장할 수 있어요.',
  REGIONAL_CHAT_ROOM_NOT_FOUND: '채팅방을 찾을 수 없어요. 목록을 새로고침해 주세요.',
  AUTHENTICATION_REQUIRED: '로그인이 필요해요.',
};
const DEFAULT_SUBMIT_ERROR_MESSAGE = '입장하지 못했어요. 잠시 후 다시 시도해 주세요.';

export default function JoinRoomModal({ room, onClose, onJoined }: JoinRoomModalProps) {
  const [policy, setPolicy] = useState<ChatPolicy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [policyError, setPolicyError] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPolicy() {
      setLoadingPolicy(true);
      setPolicyError(false);
      try {
        const data = await fetchChatPolicy();
        if (cancelled) {
          return;
        }
        setPolicy(data);
        setAgreed(data.consented);
      } catch {
        if (!cancelled) {
          setPolicyError(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingPolicy(false);
        }
      }
    }

    void loadPolicy();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleJoin() {
    if (!policy || submitting) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!policy.consented) {
        await consentToChatPolicy(policy.policyVersionId);
      }
      await joinRegionalChatRoom(room.roomId);
      onJoined(room);
    } catch (error) {
      const code = getApiErrorCode(error);
      setSubmitError((code && SUBMIT_ERROR_MESSAGES[code]) ?? DEFAULT_SUBMIT_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !loadingPolicy && !policyError && agreed && !submitting;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{room.name} 여행자방에 참여할까요?</DialogTitle>
          <DialogDescription>정확한 위치는 공개하지 않습니다.</DialogDescription>
        </DialogHeader>

        {loadingPolicy && <p className="text-sm text-muted-foreground">운영 원칙을 불러오는 중이에요.</p>}

        {!loadingPolicy && policyError && (
          <p className="text-sm text-muted-foreground">운영 원칙을 불러오지 못했어요.</p>
        )}

        {!loadingPolicy && !policyError && (
          <label className="flex items-center gap-3 rounded-lg bg-muted p-3 text-sm font-medium">
            <Checkbox checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
            오픈 채팅 운영 원칙에 동의합니다
          </label>
        )}

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <DialogFooter className="!mx-0 !mb-0 !rounded-none border-t-0 !bg-transparent !p-0 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button type="button" className="flex-1" onClick={handleJoin} disabled={!canSubmit}>
            {submitting ? '입장하는 중...' : '입장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
