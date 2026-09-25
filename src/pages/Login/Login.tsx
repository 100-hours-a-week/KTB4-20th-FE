import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleAlert, MessageCircle } from 'lucide-react';
import { buildKakaoLoginUrl } from '../../auth/authSession';
import { isValidReturnTo } from '../../auth/returnTo';
import { getPendingInvitation } from '../../utils/pendingInvitation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import styles from './Login.module.css';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  OAUTH_ACCESS_DENIED: '카카오 로그인이 취소됐어요.',
  OAUTH_STATE_INVALID: '로그인 요청이 만료됐어요. 다시 시도해 주세요.',
  OAUTH_CODE_EXCHANGE_FAILED: '서버 오류로 인해 인증이 취소되었어요.',
  OAUTH_USER_INFO_FAILED: '카카오 사용자 정보를 가져오지 못했어요.',
  OAUTH_LOGIN_FAILED: '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
};
const DEFAULT_LOGIN_ERROR_MESSAGE = '서버 오류로 인해 인증이 취소되었어요.';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const errorCode = searchParams.get('error');
  const errorMessage = errorCode
    ? (LOGIN_ERROR_MESSAGES[errorCode] ?? DEFAULT_LOGIN_ERROR_MESSAGE)
    : null;

  // 초대 링크로 들어온 경우 로그인 후 초대 화면으로 돌아간다.
  // 로그인에 실패하면 백엔드가 `/login?error=`로만 돌려보내므로, 보관해 둔 초대 경로를 이어서 쓴다.
  const requestedReturnTo = searchParams.get('returnTo') ?? getPendingInvitation();
  const returnTo =
    requestedReturnTo && isValidReturnTo(requestedReturnTo) ? requestedReturnTo : '/';
  const isInvitation = returnTo !== '/';
  const alertedRef = useRef(false);

  useEffect(() => {
    // 초대 링크로 처음 들어왔다면 왜 로그인해야 하는지 알려준다. (화면설계서 초대 1-b)
    if (!isInvitation || errorCode !== null || alertedRef.current) {
      return;
    }
    alertedRef.current = true;
    window.alert('여행에 참여하려면 먼저 로그인 해주세요.');
  }, [isInvitation, errorCode]);

  function handleKakaoLogin() {
    window.location.href = buildKakaoLoginUrl(returnTo);
  }

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo} aria-hidden="true" />
        <h1 className={styles.title}>플랜잇</h1>

        <Button type="button" size="lg" className={styles.kakaoButton} onClick={handleKakaoLogin}>
          <MessageCircle className="size-4" />
          카카오로 계속하기
        </Button>
      </div>

      <Dialog
        open={Boolean(errorMessage) && !dismissed}
        onOpenChange={(open) => !open && setDismissed(true)}
      >
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
              <CircleAlert className="size-5 text-foreground" />
            </div>
            <DialogTitle>로그인이 완료되지 않았어요</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="!mx-0 !mb-0 !rounded-none border-t-0 !bg-transparent !p-0">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setDismissed(true)}
            >
              취소
            </Button>
            <Button type="button" className="flex-1" onClick={handleKakaoLogin}>
              다시 로그인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
