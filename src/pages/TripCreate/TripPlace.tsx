import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageHeader from '../../components/PageHeader/PageHeader';
import { TRIP_DESTINATIONS, toSelectedRegion } from '../../constants/regions';
import { useTripCreate } from './tripCreateContext';
import styles from './TripPicker.module.css';

/** 여행지를 하나 고르는 화면입니다. AI 일정 생성을 지원하는 도시만 보여줍니다. */
export default function TripPlace() {
  const navigate = useNavigate();
  const { form, updateForm } = useTripCreate();
  const [subRegionId, setSubRegionId] = useState<number | null>(form.region?.subRegionId ?? null);
  const completingRef = useRef(false);

  const destination = TRIP_DESTINATIONS.find((item) => item.subRegionId === subRegionId);

  // 같은 여행지를 다시 누르면 선택이 해제됩니다.
  const toggleDestination = (id: number) => {
    setSubRegionId((current) => (current === id ? null : id));
  };

  const complete = () => {
    if (!destination || completingRef.current) return;
    completingRef.current = true;
    updateForm({ region: toSelectedRegion(destination) });
    navigate('/trips/new');
  };

  return (
    <main className={styles.container}>
      <PageHeader title="여행 장소 등록" centered onBack={() => navigate('/trips/new')} />

      <div className={styles.body}>
        <div className={styles.optionGrid} role="radiogroup" aria-label="여행지">
          {TRIP_DESTINATIONS.map((item) => (
            <button
              key={item.subRegionId}
              type="button"
              role="radio"
              aria-checked={item.subRegionId === subRegionId}
              className={`${styles.option} ${item.subRegionId === subRegionId ? styles.optionSelected : ''}`}
              onClick={() => toggleDestination(item.subRegionId)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          disabled={!destination}
          onClick={complete}
        >
          선택 완료
        </Button>
      </div>
    </main>
  );
}
