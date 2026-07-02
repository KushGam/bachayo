'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedCountUp({
  target,
  suffix = '',
  durationMs = 1500,
  delay = 0,
}: {
  target: number;
  suffix?: string;
  durationMs?: number;
  delay?: number;
}) {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let started = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (started) return;
        started = true;

        const start = Date.now() + delay;
        timer = setInterval(() => {
          const now = Date.now();
          const t = Math.min(1, (now - start) / durationMs);
          const next = Math.round(target * t);
          setValue(next);
          if (t >= 1) {
            if (timer) clearInterval(timer);
            timer = null;
          }
        }, 30);
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [delay, durationMs, target]);

  return (
    <span ref={elRef}>
      {value}
      {suffix}
    </span>
  );
}

