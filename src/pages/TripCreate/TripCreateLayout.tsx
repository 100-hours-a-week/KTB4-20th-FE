import { useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  INITIAL_FORM,
  TripCreateContext,
  type CreatedTrip,
  type TripCreateContextValue,
  type TripCreateForm,
} from './tripCreateContext';

/**
 * 여행방 만들기 → 장소 등록 → 일정 등록 → 생성 완료 화면이 입력값을 함께 쓰도록 묶습니다.
 * 이 흐름을 벗어나면(메인으로 돌아가면) 입력값은 사라집니다.
 */
export default function TripCreateLayout() {
  const [form, setForm] = useState<TripCreateForm>(INITIAL_FORM);
  const [createdTrip, setCreatedTrip] = useState<CreatedTrip | null>(null);

  const updateForm = useCallback((patch: Partial<TripCreateForm>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo<TripCreateContextValue>(
    () => ({ form, updateForm, createdTrip, setCreatedTrip }),
    [form, updateForm, createdTrip],
  );

  return (
    <TripCreateContext value={value}>
      <Outlet />
    </TripCreateContext>
  );
}
