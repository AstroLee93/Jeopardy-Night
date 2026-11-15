import React, { useState } from 'react';
import { Crown, Copy, Check, RefreshCw, Tv } from 'lucide-react';

interface TvLobbyWaitingScreenProps {
  gameTitle: string;
  gameSubtitle: string;
  onSwitchToHost: () => void;
  onCheckSync: () => void;
  onEnterBoard?: () => void;
}

/** What the TV shows before the host starts: an empty set waiting for lights. */
export const TvLobbyWaitingScreen: React.FC<TvLobbyWaitingScreenProps> = ({
  gameTitle,
  gameSubtitle,
  onSwitchToHost,
  onCheckSync,
  onEnterBoard
}) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const hostUrl = (() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'host');
    return url.toString();
  })();

  return (
    <section className="stage-setup lobby">
      <p className="stage-kicker">{gameSubtitle || gameTitle}</p>
      <h1 className="stage-headline">The show starts soon</h1>
      <p className="stage-lede">
        This screen is the TV. It switches to the game board as soon as the host presses Start the show.
      </p>

      <div className="lobby-board" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="lobby-tile" style={{ animationDelay: `${(i * 137) % 1800}ms` }} />
        ))}
      </div>

      <div className="lobby-host">
        <p>To host, open this link on your phone or laptop:</p>
        <div className="lobby-link">
          <input readOnly value={hostUrl} aria-label="Host link" onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(hostUrl).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="stage-secondary">
        {onEnterBoard && (
          <button type="button" onClick={onEnterBoard}>
            <Tv className="w-4 h-4" /> Join a game in progress
          </button>
        )}
        <button
          type="button"
          disabled={isChecking}
          onClick={() => {
            setIsChecking(true);
            onCheckSync();
            setTimeout(() => setIsChecking(false), 800);
          }}
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} /> Check again
        </button>
        <button type="button" onClick={onSwitchToHost}>
          <Crown className="w-4 h-4" /> Host from this screen
        </button>
      </div>
      <p className="finale-hint">Press F to fill the TV screen.</p>
    </section>
  );
};
