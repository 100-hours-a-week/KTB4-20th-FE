import { Navigate, useNavigate } from 'react-router-dom';
import { getInvitationUrl } from '../../api/trips';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import RegionIllustration from '../../components/RegionIllustration/RegionIllustration';
import { formatTripDate, getDaysUntil } from '../../components/TripCard/tripDisplay';
import { useTripCreate } from './tripCreateContext';
import styles from './TripCreated.module.css';

const TOAST_DURATION_MS = 2000;

/** 여행방 생성 완료 화면입니다. 초대 링크를 복사하거나 메인으로 돌아갈 수 있어요. */
export default function TripCreated() {
  const navigate = useNavigate();
  const { createdTrip } = useTripCreate();

  if (!createdTrip) {
    return <Navigate to="/trips/new" replace />;
  }

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(getInvitationUrl(createdTrip.invitationToken));
      toast.success('초대 링크를 복사했어요.', { duration: TOAST_DURATION_MS });
    } catch {
      toast.error('링크를 복사하지 못했어요. 다시 시도해 주세요.', { duration: TOAST_DURATION_MS });
    }
  };

  const daysUntil = getDaysUntil(createdTrip.startDate, 'SURVEY_IN_PROGRESS');

  // 만들기 흐름을 벗어나면 TripCreateLayout이 사라지면서 입력값도 함께 지워집니다.
  const goHome = () => navigate('/', { replace: true });

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <span className={styles.checkCircle} aria-hidden="true">
          <CheckIcon size={30} strokeWidth={2.5} />
        </span>
        <h1 className={styles.title}>여행방이 만들어졌어요!</h1>
        <p className={styles.subtitle}>친구를 초대해 모두의 취향을 모아보세요.</p>
      </div>

      {/* 만든 여행방을 탑승권처럼 보여준다. 위에 여행지 풍경, 아래 이름·출발일과 D-day 칸 */}
      <section className={styles.ticket} aria-label="만든 여행방 정보">
        <div className={styles.ticketScene} aria-hidden="true">
          <RegionIllustration regionName={createdTrip.regionLabel} />
        </div>
        <div className={styles.ticketBody}>
          <div className={styles.ticketMain}>
            <p className={styles.region}>{createdTrip.regionLabel}</p>
            <h2 className={styles.roomName}>{createdTrip.name}</h2>
            <p className={styles.meta}>
              {formatTripDate(createdTrip.startDate, true)} 출발 · 최대 {createdTrip.capacity}명
            </p>
          </div>
          <span className={styles.ticketStub}>D-{daysUntil ?? 0}</span>
        </div>
      </section>

      <div className={styles.actions}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={copyInvitationLink}
        >
          초대 링크 복사하기
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={goHome}
        >
          처음 화면으로 돌아가기
        </Button>
      </div>
    </main>
  );
}
