'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

type HoverInfoProps = {
  text: string;
};

const HIDE_DELAY_MS = 100;

export function HoverInfo({ text }: HoverInfoProps) {
  const [open, setOpen] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const show = () => {
    clearHideTimeout();
    setOpen(true);
  };

  const hideWithDelay = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, HIDE_DELAY_MS);
  };

  useEffect(() => {
    return () => clearHideTimeout();
  }, []);

  return (
    <span
      className='relative inline-flex'
      onMouseEnter={show}
      onMouseLeave={hideWithDelay}
    >
      <Info
        className='ml-1 inline-block h-4 w-4 text-(--muted) hover:text-[#cfe2ff]'
        aria-label='Metric info'
      />
      {open ? (
        <span className='pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-56 -translate-x-1/2 rounded-md border border-(--border) bg-[rgba(10,16,28,0.96)] px-2.5 py-2 text-xs font-medium leading-snug text-[#dce9ff] shadow-[0_10px_24px_rgba(0,0,0,0.35)]'>
          {text}
        </span>
      ) : null}
    </span>
  );
}
