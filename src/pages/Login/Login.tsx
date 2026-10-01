import { useEffect, useRef, useState, type PointerEvent } from 'react';
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
import RegionIllustration from '../../components/RegionIllustration/RegionIllustration';
import planitSymbol from '../../assets/logo/planit-symbol.svg';
import styles from './Login.module.css';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  OAUTH_ACCESS_DENIED: '카카오 로그인이 취소됐어요.',
  OAUTH_STATE_INVALID: '로그인 요청이 만료됐어요. 다시 시도해 주세요.',
  OAUTH_CODE_EXCHANGE_FAILED: '서버 오류로 인해 인증이 취소되었어요.',
  OAUTH_USER_INFO_FAILED: '카카오 사용자 정보를 가져오지 못했어요.',
  OAUTH_LOGIN_FAILED: '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
};
const DEFAULT_LOGIN_ERROR_MESSAGE = '서버 오류로 인해 인증이 취소되었어요.';

/** 스플래시가 걷히는 데 걸리는 시간(Login.module.css의 스플래시 애니메이션과 맞춘다)과 소개 한 장이 머무는 시간 */
const SPLASH_DURATION_MS = 1700;
const SLIDE_INTERVAL_MS = 2000;
/** 이만큼 옆으로 밀면 한 장 넘긴다 */
const SWIPE_THRESHOLD_PX = 40;

interface FeatureSlide {
  region: string;
  stub: string;
  /** 두 줄 문구. 강조 단어는 highlight로 따로 둔다. */
  lead: string;
  before: string;
  highlight: string;
  description: string;
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    region: '제주',
    stub: 'D-12',
    lead: '친구들의 취향으로',
    before: '완성하는 ',
    highlight: '여행 계획',
    description: '설문만 하면 일정은 AI가 짜드려요',
  },
  {
    region: '부산',
    stub: '초대',
    lead: '링크 하나로',
    before: '',
    highlight: '친구를 불러요',
    description: '단톡방에 보내면 바로 여행방에 들어와요',
  },
  {
    region: '경주',
    stub: 'AI',
    lead: '모두의 취향을 모아',
    before: 'AI가 ',
    highlight: '일정을 짜요',
    description: '설문이 모이면 동선까지 한 번에',
  },
  {
    region: '서울',
    stub: '채팅',
    lead: '같은 곳으로 떠나는',
    before: '',
    highlight: '사람들과 이야기해요',
    description: '지역 오픈 채팅에서 여행 정보를 나눠요',
  },
];

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * 로그인 화면의 기능 소개. 스플래시가 끝나면 2초마다 옆으로 넘어가 마지막 장에서 멈춘다.
 * 옆으로 밀거나 아래 점을 눌러 직접 넘길 수 있고, 그러면 자동 넘김은 멈춘다.
 * 움직임 줄이기 설정이면 자동으로 넘기지 않는다.
 */
function FeatureSlides() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStartRef = useRef<number | null>(null);
  const lastIndex = FEATURE_SLIDES.length - 1;

  // 한 장씩 넘기다가 마지막 장에서 멈춘다. 처음 장은 스플래시가 걷힐 때까지 기다린다.
  useEffect(() => {
    if (paused || index >= lastIndex || prefersReducedMotion()) return;
    const timer = window.setTimeout(
      () => setIndex((value) => Math.min(value + 1, lastIndex)),
      // 첫 장도 스플래시가 걷힌 뒤 다른 장과 같은 시간만큼 보여준다.
      index === 0 ? SPLASH_DURATION_MS + SLIDE_INTERVAL_MS : SLIDE_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [index, paused, lastIndex]);

  /** 사람이 직접 넘기면 자동 넘김은 멈춘다. */
  const goTo = (next: number) => {
    setPaused(true);
    setIndex(Math.max(0, Math.min(next, lastIndex)));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (start === null) return;
    const distance = event.clientX - start;
    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) return;
    goTo(distance < 0 ? index + 1 : index - 1);
  };

  return (
    <section
      className={styles.slides}
      aria-roledescription="carousel"
      aria-label="PlanIt 기능 소개"
    >
      <div
        className={styles.slideViewport}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStartRef.current = null;
        }}
      >
        <div className={styles.slideTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
          {FEATURE_SLIDES.map((slide, slideIndex) => (
            <div
              key={slide.region}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} / ${FEATURE_SLIDES.length}`}
              aria-hidden={slideIndex !== index}
            >
              {/* 여행지 풍경이 담긴 탑승권 그림. 장식이라 화면 낭독기는 읽지 않습니다. */}
              <div className={styles.ticket} aria-hidden="true">
                <div className={styles.ticketScene}>
                  <RegionIllustration regionName={slide.region} />
                </div>
                <div className={styles.ticketRow}>
                  <span className={styles.ticketCity}>{slide.region}</span>
                  <span className={styles.ticketStub}>{slide.stub}</span>
                </div>
              </div>
              <p className={styles.headline}>
                {slide.lead}
                <br />
                {slide.before}
                <span className={styles.highlight}>{slide.highlight}</span>
              </p>
              <p className={styles.tagline}>{slide.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.dots}>
        {FEATURE_SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.region}
            type="button"
            className={`${styles.dot} ${slideIndex === index ? styles.dotActive : ''}`}
            onClick={() => goTo(slideIndex)}
            aria-label={`${slideIndex + 1}번째 소개 보기`}
            aria-current={slideIndex === index}
          />
        ))}
      </div>
    </section>
  );
}

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
      {/*
        스플래시: 로고가 가운데 먼저 뜨고, 이어서 설명이 잠깐 보인 뒤 사라지며 로그인 화면이 올라온다.
        CSS 애니메이션만으로 움직이고, 움직임 줄이기 설정이면 바로 로그인 화면을 보여준다. 장식이라 낭독하지 않는다.
      */}
      <div className={styles.splash} aria-hidden="true">
        <span className={styles.splashLogo}>
          <img src={planitSymbol} alt="" width={88} height={88} />
        </span>
        <span className={styles.splashName}>PlanIt</span>
        <span className={styles.splashTagline}>취향을 모으면, 여행이 완성돼요</span>
      </div>

      {/* 서비스 이름 "PlanIt"이 화면 낭독기가 읽는 제목이라 로고 이미지는 장식으로 둡니다. */}
      <header className={`${styles.brand} ${styles.reveal}`}>
        <span className={styles.logoTile}>
          <img src={planitSymbol} alt="" width={34} height={34} />
        </span>
        <h1 className={styles.title}>PlanIt</h1>
      </header>

      <div className={`${styles.content} ${styles.reveal}`}>
        <FeatureSlides />
      </div>

      <div className={`${styles.bottom} ${styles.reveal} ${styles.revealLate}`}>
        <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
          <MessageCircle className="size-5" fill="currentColor" aria-hidden="true" />
          카카오로 계속하기
        </button>
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
