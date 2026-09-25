import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import { REGION_GROUPS, toSelectedRegion } from '../../constants/regions';
import { useTripCreate } from './tripCreateContext';
import styles from './TripPicker.module.css';

/** 여행지를 대분류(탭) → 소분류(칩) 순서로 하나 고르는 화면입니다. */
export default function TripPlace() {
  const navigate = useNavigate();
  const { form, updateForm } = useTripCreate();
  const [groupKey, setGroupKey] = useState(form.region?.groupKey ?? REGION_GROUPS[0].key);
  const [subRegionId, setSubRegionId] = useState<number | null>(form.region?.subRegionId ?? null);
  const completingRef = useRef(false);

  const group = REGION_GROUPS.find((item) => item.key === groupKey) ?? REGION_GROUPS[0];
  const subRegion = group.subRegions.find((item) => item.id === subRegionId);

  const selectGroup = (key: string) => {
    // 이미 선택된 대분류를 다시 눌러도 해제되지 않고, 다른 대분류로 바꾸면 소분류 선택은 초기화됩니다.
    if (key === groupKey) return;
    setGroupKey(key);
    setSubRegionId(null);
  };

  const toggleSubRegion = (id: number) => {
    setSubRegionId((current) => (current === id ? null : id));
  };

  const complete = () => {
    if (!subRegion || completingRef.current) return;
    completingRef.current = true;
    updateForm({ region: toSelectedRegion(group, subRegion) });
    navigate('/trips/new');
  };

  return (
    <main className={styles.container}>
      <PageHeader title="여행 장소 등록" centered onBack={() => navigate('/trips/new')} />

      <div className={styles.tabs} role="tablist" aria-label="지역">
        {REGION_GROUPS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.key === groupKey}
            className={`${styles.tab} ${item.key === groupKey ? styles.tabSelected : ''}`}
            onClick={() => selectGroup(item.key)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        <div className={styles.optionGrid} role="radiogroup" aria-label={`${group.name} 세부 지역`}>
          {group.subRegions.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === subRegionId}
              className={`${styles.option} ${item.id === subRegionId ? styles.optionSelected : ''}`}
              onClick={() => toggleSubRegion(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <Button shape="pill" size="lg" fullWidth disabled={!subRegion} onClick={complete}>
          선택 완료
        </Button>
      </div>
    </main>
  );
}
