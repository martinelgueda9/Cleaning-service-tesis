import { useEffect, useRef, useState } from 'react';

export function useMinDuration(active: boolean, ms = 1000): boolean {
  const [held, setHeld] = useState(active);
  const startedAt = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    if (active) {
      startedAt.current = Date.now();
      setHeld(true);
      return;
    }
    if (startedAt.current === null) {
      setHeld(false);
      return;
    }
    const remaining = ms - (Date.now() - startedAt.current);
    const release = () => {
      startedAt.current = null;
      setHeld(false);
    };
    if (remaining <= 0) {
      release();
      return;
    }
    const t = setTimeout(release, remaining);
    return () => clearTimeout(t);
  }, [active, ms]);

  return active || held;
}
