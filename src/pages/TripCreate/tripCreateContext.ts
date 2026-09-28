import { createContext, useContext } from 'react';
import type { TripCreateResponse } from '../../api/trips';

/** 고른 여행지. 백엔드 지역 번호와 화면에 보여줄 이름입니다. */
export interface SelectedRegion {
  regionId: number;
  label: string;
}

export type DeadlineOption = 'oneDay' | 'threeDays' | 'dayBefore' | 'custom';

export interface TripCreateForm {
  region: SelectedRegion | null;
  /** YYYY-MM-DD */
  startDate: string | null;
  capacity: number;
  name: string;
  deadlineOption: DeadlineOption;
  /** '직접 선택'으로 고른 날짜 (YYYY-MM-DD) */
  customDeadline: string | null;
}

export interface CreatedTrip extends TripCreateResponse {
  name: string;
  regionLabel: string;
  startDate: string;
  capacity: number;
}

export const MIN_CAPACITY = 2;
export const MAX_CAPACITY = 8;

export const INITIAL_FORM: TripCreateForm = {
  region: null,
  startDate: null,
  capacity: MIN_CAPACITY,
  name: '',
  deadlineOption: 'dayBefore',
  customDeadline: null,
};

export interface TripCreateContextValue {
  form: TripCreateForm;
  updateForm: (patch: Partial<TripCreateForm>) => void;
  createdTrip: CreatedTrip | null;
  setCreatedTrip: (trip: CreatedTrip) => void;
}

export const TripCreateContext = createContext<TripCreateContextValue | null>(null);

/** 여행방 만들기 화면들이 함께 쓰는 입력값입니다. */
export function useTripCreate(): TripCreateContextValue {
  const context = useContext(TripCreateContext);
  if (!context) {
    throw new Error('useTripCreate는 TripCreateLayout 안에서 사용해야 합니다.');
  }
  return context;
}
