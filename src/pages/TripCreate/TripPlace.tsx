import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchRegions, type Region } from '../../api/regions';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatusMessage from '../../components/StatusMessage/StatusMessage';
import { useTripCreate } from './tripCreateContext';
import styles from './TripPicker.module.css';

type RegionsState =
  { status: 'loading' } | { status: 'ready'; regions: Region[] } | { status: 'error' };

/** 여행지를 하나 고르는 화면입니다. 백엔드 지역 목록(AI 일정 생성 지원 지역)을 불러와 보여줍니다. */
export default function TripPlace() {
  const navigate = useNavigate();
  const { form, updateForm } = useTripCreate();
  const [regionsState, setRegionsState] = useState<RegionsState>({ status: 'loading' });
  const [regionId, setRegionId] = useState<number | null>(form.region?.regionId ?? null);
  const completingRef = useRef(false);

  const loadRegions = useCallback(
    () =>
      fetchRegions().then(
        (regions) => setRegionsState({ status: 'ready', regions }),
        () => setRegionsState({ status: 'error' }),
      ),
    [],
  );

  useEffect(() => {
    void loadRegions();
  }, [loadRegions]);

  const regions = regionsState.status === 'ready' ? regionsState.regions : [];
  const selected = regions.find((region) => Number(region.regionId) === regionId);

  // 같은 여행지를 다시 누르면 선택이 해제됩니다.
  const toggleRegion = (id: number) => {
    setRegionId((current) => (current === id ? null : id));
  };

  const complete = () => {
    if (!selected || completingRef.current) return;
    completingRef.current = true;
    updateForm({ region: { regionId: Number(selected.regionId), label: selected.regionName } });
    navigate('/trips/new');
  };

  return (
    <main className={styles.container}>
      <PageHeader title="여행 장소 등록" centered onBack={() => navigate('/trips/new')} />

      <div className={styles.body}>
        {regionsState.status === 'loading' && (
          <div className={styles.optionGrid} aria-busy="true" aria-label="여행지를 불러오는 중">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-11 rounded-[var(--radius-md)] bg-accent" />
            ))}
          </div>
        )}

        {regionsState.status === 'error' && (
          <StatusMessage
            icon={<CircleAlertIcon size={20} strokeWidth={1.6} />}
            title="여행지를 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요"
          >
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full"
              onClick={() => {
                setRegionsState({ status: 'loading' });
                void loadRegions();
              }}
            >
              다시 불러오기
            </Button>
          </StatusMessage>
        )}

        {regionsState.status === 'ready' && (
          <div className={styles.optionGrid} role="radiogroup" aria-label="여행지">
            {regions.map((region) => {
              const id = Number(region.regionId);
              const isSelected = id === regionId;
              return (
                <button
                  key={region.regionId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                  onClick={() => toggleRegion(id)}
                >
                  {region.regionName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          disabled={!selected}
          onClick={complete}
        >
          선택 완료
        </Button>
      </div>
    </main>
  );
}
