import { useEffect, useRef, useState } from 'react';
import type { ScheduleStop } from '../../api/schedule';
import { loadGoogleMaps } from '../../lib/googleMaps';
import styles from './TripSchedule.module.css';

interface RouteMapProps {
  stops: ScheduleStop[];
}

const MAP_BOUNDS_PADDING = 40;

const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

/** 방문 순서대로 번호 마커를 찍고 점선으로 잇는 지도입니다. */
export default function RouteMap({ stops }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (stops.length === 0) return;
    let cancelled = false;

    async function render() {
      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          disableDefaultUI: true,
          zoomControl: true,
          styles: MAP_STYLE,
        });

        const bounds = new google.maps.LatLngBounds();
        stops.forEach((stop) => {
          const position = { lat: stop.latitude, lng: stop.longitude };
          bounds.extend(position);
          new google.maps.Marker({
            map,
            position,
            label: {
              text: String(stop.order),
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: '#03001c',
              fillOpacity: 1,
              strokeWeight: 0,
            },
          });
        });

        new google.maps.Polyline({
          map,
          path: stops.map((stop) => ({ lat: stop.latitude, lng: stop.longitude })),
          strokeOpacity: 0,
          icons: [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#6a6a6a', scale: 3 },
              offset: '0',
              repeat: '12px',
            },
          ],
        });

        map.fitBounds(bounds, MAP_BOUNDS_PADDING);
        if (!cancelled) setStatus('ready');
      } catch (error) {
        console.error('[RouteMap] failed to render map', error);
        if (!cancelled) setStatus('error');
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [stops]);

  return (
    <div className={styles.mapCard}>
      <div ref={containerRef} className={styles.mapCanvas} />
      {status !== 'ready' && (
        <p className={styles.mapStatus}>
          {status === 'loading' ? '지도를 불러오는 중이에요.' : '지도를 불러오지 못했어요.'}
        </p>
      )}
    </div>
  );
}
