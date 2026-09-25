import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getKakaoLoginUrl, isValidReturnTo, OAUTH_ERROR_CODES } from '../../api/auth';
import AlertDialog from '../../components/AlertDialog/AlertDialog';
import Button from '../../components/Button/Button';
import kakaoIcon from '../../assets/icons/kakao-bubble.svg';
import { getPendingInvitation } from '../../utils/pendingInvitation';
import styles from './Login.module.css';

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const errorCode = searchParams.get('error');
  // 로그인에 실패해 돌아오면 URL에서 returnTo가 사라지므로, 보관해 둔 초대 경로를 이어서 씁니다.
  const returnTo = searchParams.get('returnTo') ?? getPendingInvitation() ?? undefined;
  const isInvitation = returnTo !== undefined && returnTo !== '/' && isValidReturnTo(returnTo);
  const alertedRef = useRef(false);
  const cameBackWithError = errorCode !== null;

  useEffect(() => {
    // 초대 링크로 처음 들어왔다면 왜 로그인해야 하는지 알려줍니다. (설계서 1-b)
    if (!isInvitation || cameBackWithError || alertedRef.current) return;
    alertedRef.current = true;
    window.alert('여행에 참여하려면 먼저 로그인 해주세요.');
  }, [isInvitation, cameBackWithError]);

  // 사용자가 카카오 동의 화면에서 직접 취소한 경우는 서버 오류가 아니므로 팝업을 띄우지 않습니다.
  const hasError = errorCode !== null && errorCode !== OAUTH_ERROR_CODES.accessDenied;

  const closeErrorDialog = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('error');
    setSearchParams(nextParams, { replace: true });
  };

  const startKakaoLogin = () => {
    window.location.assign(getKakaoLoginUrl(returnTo));
  };

  return (
    <main className={styles.container}>
      <div className={styles.brand}>
        <div className={styles.logo} aria-hidden="true" />
        <h1 className={styles.serviceName}>플랜잇</h1>
      </div>

      <Button size="lg" fullWidth className={styles.kakaoButton} onClick={startKakaoLogin}>
        <img src={kakaoIcon} alt="" width={20} height={20} className={styles.kakaoIcon} />
        카카오로 계속하기
      </Button>

      <AlertDialog
        open={hasError}
        title="로그인이 완료되지 않았어요"
        description="서버 오류로 인해 인증이 취소되었어요."
        primaryAction={{ label: '다시 로그인', onClick: startKakaoLogin }}
        secondaryAction={{ label: '취소', onClick: closeErrorDialog }}
        onClose={closeErrorDialog}
      />
    </main>
  );
}
