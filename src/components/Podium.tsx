import React, { useEffect, useRef, useState } from 'react';

interface PodiumProps {
  name: string;
  color: string;
  score?: number;
  active?: boolean;
  /** When provided, the name plate becomes a text field you write on. */
  onNameChange?: (name: string) => void;
  placeholder?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  size?: 'sm' | 'lg';
}

/**
 * A contestant podium: score screen on top, a strip of light in the team's
 * colour, and a name plate written in "light pen" handwriting.
 */
export const Podium: React.FC<PodiumProps> = ({
  name,
  color,
  score,
  active,
  onNameChange,
  placeholder = 'Write a name',
  onClick,
  children,
  size = 'sm'
}) => {
  // Flash the score screen green or red when the score changes.
  const prev = useRef(score);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    if (score === undefined || prev.current === undefined || score === prev.current) {
      prev.current = score;
      return;
    }
    setFlash(score > prev.current ? 'up' : 'down');
    prev.current = score;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [score]);

  const negative = (score ?? 0) < 0;

  return (
    <div
      className={`podium podium-${size} ${active ? 'podium-active' : ''}`}
      style={{ '--team': color } as React.CSSProperties}
      onClick={onClick}
    >
      {score !== undefined && (
        <div className={`podium-screen ${flash ? `podium-flash-${flash}` : ''}`}>
          <span className={`podium-score ${negative ? 'podium-score-negative' : ''}`}>
            {negative ? '-' : ''}${Math.abs(score).toLocaleString()}
          </span>
        </div>
      )}
      <div className="podium-light" aria-hidden="true" />
      <div className="podium-plate">
        {onNameChange ? (
          <input
            className="podium-name podium-name-input"
            value={name}
            maxLength={22}
            placeholder={placeholder}
            aria-label="Contestant name"
            onChange={(e) => onNameChange(e.target.value)}
          />
        ) : (
          <span className="podium-name" title={name}>
            {name}
          </span>
        )}
      </div>
      {children && (
        <div className="podium-controls" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
      <div className="podium-base" aria-hidden="true" />
    </div>
  );
};
