import { useEffect, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/** 현재 브라우저 창의 너비와 높이를 반환합니다. */
export default function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
