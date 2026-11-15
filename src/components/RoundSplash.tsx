import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RoundSplashProps {
  title: string;
  subtitle?: string;
  onDone: () => void;
  durationMs?: number;
}

/** Full-screen round title card shown on every screen at each round change. */
export const RoundSplash: React.FC<RoundSplashProps> = ({ title, subtitle, onDone, durationMs = 2800 }) => {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    const skip = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') onDone();
    };
    window.addEventListener('keydown', skip);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, durationMs]);

  return createPortal(
    <div
      data-modal-overlay
      onClick={onDone}
      className="round-splash fixed inset-0 z-[200] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      style={{ animationDuration: `${durationMs}ms` }}
    >
      <div className="round-splash-rays" />
      <h1 className="round-splash-title font-jeopardy-display text-center px-4">{title}</h1>
      {subtitle && <p className="round-splash-sub font-jeopardy-serif text-center px-6">{subtitle}</p>}
    </div>,
    document.body
  );
};
