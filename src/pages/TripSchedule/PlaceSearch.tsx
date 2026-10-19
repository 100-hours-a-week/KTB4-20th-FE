import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, SearchIcon } from 'lucide-react';
import type { PlaceSearchCircle } from '../../constants/placeSearchAreas';
import { searchPlacesInArea, type PlaceSearchResult } from '../../lib/placeSearch';
import styles from './PlaceSearch.module.css';

interface PlaceSearchProps {
  /** 검색을 허용하는 지역 범위 */
  area: PlaceSearchCircle[];
  regionName: string;
  onBack: () => void;
  onSelect: (place: PlaceSearchResult) => void;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; results: PlaceSearchResult[] }
  | { status: 'error' };

/** 입력을 멈추고 이만큼 지나면 검색해요. (요청 수를 줄이기 위함) */
const SEARCH_DEBOUNCE_MS = 400;

/** 여행 지역 범위 안에서 장소를 검색해 일정에 추가할 장소를 고르는 화면입니다. (화면설계서 7번) */
export default function PlaceSearch({ area, regionName, onBack, onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [searchState, setState] = useState<SearchState>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 늦게 도착한 이전 검색 결과가 최신 결과를 덮지 않도록 요청 번호로 걸러요.
  const runSearch = useCallback(
    async (keyword: string) => {
      const requestId = ++requestIdRef.current;
      setState({ status: 'loading' });
      try {
        const results = await searchPlacesInArea(keyword, area);
        if (requestId === requestIdRef.current) setState({ status: 'ready', results });
      } catch (error) {
        console.error('[PlaceSearch] failed to search places', error);
        if (requestId === requestIdRef.current) setState({ status: 'error' });
      }
    },
    [area],
  );

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      // 검색어를 지우면 진행 중인 검색 결과도 버려요.
      requestIdRef.current += 1;
      return;
    }
    const timer = window.setTimeout(() => void runSearch(keyword), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const state: SearchState = query.trim() ? searchState : { status: 'idle' };

  return (
    <div className={styles.screen} role="dialog" aria-modal="true" aria-label="장소 검색">
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="뒤로가기">
          <ChevronLeftIcon size={22} />
        </button>
      </header>

      <form
        className={styles.searchBox}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const keyword = query.trim();
          if (keyword) void runSearch(keyword);
        }}
      >
        <SearchIcon size={18} className={styles.searchIcon} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="장소를 검색해서 추가하세요"
          aria-label="장소 검색어"
          enterKeyHint="search"
        />
      </form>

      <div className={styles.results} aria-live="polite">
        {state.status === 'idle' && (
          <p className={styles.message}>{regionName} 안의 장소만 검색할 수 있어요.</p>
        )}
        {state.status === 'loading' && <p className={styles.message}>장소를 찾는 중이에요.</p>}
        {state.status === 'error' && (
          <p className={styles.message}>장소를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        )}
        {state.status === 'ready' && state.results.length === 0 && (
          <p className={styles.message}>{regionName} 안에서 찾은 장소가 없어요.</p>
        )}
        {state.status === 'ready' && state.results.length > 0 && (
          <ul className={styles.resultList}>
            {state.results.map((place) => (
              <li key={place.googlePlaceId}>
                <button type="button" className={styles.resultCard} onClick={() => onSelect(place)}>
                  <span className={styles.resultName}>{place.name}</span>
                  {place.categoryName && (
                    <span className={styles.resultCategory}>{place.categoryName}</span>
                  )}
                  {place.address && <span className={styles.resultAddress}>{place.address}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
