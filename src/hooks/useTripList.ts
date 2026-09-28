import { useCallback, useEffect, useRef, useState } from 'react';
import { getTrips, type TripSummary } from '../api/trips';

const FIRST_PAGE_SIZE = 10;
const NEXT_PAGE_SIZE = 5;

type TripListStatus = 'loading' | 'success' | 'error';

/** 참여 중인 여행방 목록을 처음 10개, 이후 5개씩 불러옵니다. */
export default function useTripList() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [status, setStatus] = useState<TripListStatus>('loading');
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchFirstPage = useCallback(() => {
    const requestId = ++requestIdRef.current;

    return getTrips({ size: FIRST_PAGE_SIZE }).then(
      (page) => {
        if (requestId !== requestIdRef.current) return;
        setTrips(page.trips);
        setHasNext(page.hasNext);
        cursorRef.current = page.nextCursor;
        setStatus('success');
      },
      () => {
        if (requestId === requestIdRef.current) setStatus('error');
      },
    );
  }, []);

  /** 목록을 처음부터 다시 불러옵니다. */
  const reload = useCallback(() => {
    setStatus('loading');
    setLoadMoreFailed(false);
    return fetchFirstPage();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !cursorRef.current) return;
    const requestId = requestIdRef.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreFailed(false);

    try {
      const page = await getTrips({ cursor: cursorRef.current, size: NEXT_PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      setTrips((previous) => {
        const knownIds = new Set(previous.map((trip) => trip.tripId));
        return [...previous, ...page.trips.filter((trip) => !knownIds.has(trip.tripId))];
      });
      setHasNext(page.hasNext);
      cursorRef.current = page.nextCursor;
    } catch {
      if (requestId === requestIdRef.current) setLoadMoreFailed(true);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  const removeTrip = useCallback((tripId: string) => {
    setTrips((previous) => previous.filter((trip) => trip.tripId !== tripId));
  }, []);

  useEffect(() => {
    void fetchFirstPage();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchFirstPage]);

  return {
    trips,
    status,
    hasNext,
    isLoadingMore,
    loadMoreFailed,
    reload,
    loadMore,
    removeTrip,
  };
}
