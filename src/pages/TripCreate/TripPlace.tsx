import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRegions, type RegionItem } from '../../api/regions';
import { Button } from '@/components/ui/button';
import PageHeader from '../../components/PageHeader/PageHeader';
import { useTripCreate } from './tripCreateContext';
import styles from './TripPicker.module.css';

/** 여행지를 하나 고르는 화면입니다. AI 일정 생성을 지원하는 도시만 보여줍니다. */
export default function TripPlace() {
  const navigate = useNavigate();
  const { form, updateForm } = useTripCreate();
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [regionId, setRegionId] = useState<string | null>(form.region?.regionId ?? null);
  const completingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRegions() {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getRegions();
        if (!cancelled) {
          setRegions(data);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRegions();
    return () => {
      cancelled = true;
    };
  }, []);

  const destination = regions.find((item) => item.regionId === regionId);

  // 같은 여행지를 다시 누르면 선택이 해제됩니다.
  const toggleDestination = (id: string) => {
    setRegionId((current) => (current === id ? null : id));
  };

  const complete = () => {
    if (!destination || completingRef.current) return;
    completingRef.current = true;
    updateForm({ region: destination });
    navigate('/trips/new');
  };

  return (
    <main className={styles.container}>
      <PageHeader title="여행 장소 등록" centered onBack={() => navigate('/trips/new')} />

      <div className={styles.body}>
        {loading && <p className={styles.status}>여행지를 불러오는 중이에요.</p>}
        {!loading && loadError && <p className={styles.status}>여행지를 불러오지 못했어요.</p>}

        {!loading && !loadError && (
          <div className={styles.optionGrid} role="radiogroup" aria-label="여행지">
            {regions.map((item) => (
              <button
                key={item.regionId}
                type="button"
                role="radio"
                aria-checked={item.regionId === regionId}
                className={`${styles.option} ${item.regionId === regionId ? styles.optionSelected : ''}`}
                onClick={() => toggleDestination(item.regionId)}
              >
                {item.regionName}
              </button>
            ))}
          </div>
        )}
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
