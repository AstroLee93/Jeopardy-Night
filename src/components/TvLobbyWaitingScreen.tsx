import React, { useState } from 'react';
import { Tv, Crown, ExternalLink, Copy, Check, RefreshCw, Smartphone, Monitor, ShieldCheck, Sparkles } from 'lucide-react';

interface TvLobbyWaitingScreenProps {
  gameTitle: string;
  gameSubtitle: string;
  onSwitchToHost: () => void;
  onCheckSync: () => void;
}

export const TvLobbyWaitingScreen: React.FC<TvLobbyWaitingScreenProps> = ({
  gameTitle,
  gameSubtitle,
  onSwitchToHost,
  onCheckSync
}) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const getHostUrl = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'host');
    return url.toString();
  };

  const handleCopyHostUrl = () => {
    const url = getHostUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualCheck = () => {
    setIsChecking(true);
    onCheckSync();
    setTimeout(() => setIsChecking(false), 800);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-6 px-3">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#0b15c9]/35 via-[#04097a]/50 to-[#02052c] border-2 sm:border-4 border-cyan-400 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(34,211,238,0.25)] text-center backdrop-blur-md relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#ffcc00]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-xs font-black uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" />
          <span>📺 TV DISPLAY SCREEN CONNECTED</span>
        </div>

        <h1 className="font-jeopardy-display text-3xl sm:text-5xl md:text-6xl text-[#ffcc00] uppercase tracking-wider mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          Family Game Night
        </h1>
        <p className="text-slate-300 text-sm sm:text-lg mb-6 max-w-2xl mx-auto">
          {gameTitle} · {gameSubtitle}
        </p>

        {/* Big Waiting Callout Box */}
        <div className="mb-6 p-5 sm:p-7 rounded-2xl bg-[#02052c]/90 border-2 border-cyan-500/50 shadow-inner text-left max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Waiting for Host to Start the Game...
              </h2>
              <p className="text-xs text-slate-300">
                This display will automatically transition to the game board the moment the Host taps <strong>Start Game Night</strong>!
              </p>
            </div>
          </div>

          {/* Host Connection URL box */}
          <div className="mt-4 pt-4 border-t border-slate-700/80">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Open Host Controller on your Phone / Laptop:
            </span>
            <div className="flex items-center gap-2 bg-black/80 border border-slate-700 rounded-xl p-2 sm:p-2.5">
              <input
                type="text"
                readOnly
                value={getHostUrl()}
                className="bg-transparent text-xs sm:text-sm text-cyan-300 font-mono flex-1 outline-none truncate select-all px-1"
              />
              <button
                type="button"
                onClick={handleCopyHostUrl}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#02052c] text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-transform hover:scale-105 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Host Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action bar: Switch to Host & Manual Re-sync check */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
          <button
            type="button"
            onClick={onSwitchToHost}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#02052c] font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-105"
          >
            <Crown className="w-4 h-4 fill-current" />
            <span>Are you the Host? Switch This Screen to Host</span>
          </button>

          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check for Active Game</span>
          </button>
        </div>

        {/* TV Mode Features list */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs text-slate-300 max-w-3xl mx-auto">
          <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-cyan-400 text-base">🔒</span>
            <div>
              <strong className="text-white block">Cheat-Proof</strong>
              <span className="text-[11px] text-slate-400">Answers remain strictly hidden on this screen until Host taps "Reveal".</span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-amber-400 text-base">⚡</span>
            <div>
              <strong className="text-white block">Real-Time Sync</strong>
              <span className="text-[11px] text-slate-400">Clues, buzzers, and timers sync automatically across Wi-Fi or local network.</span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-emerald-400 text-base">🖥️</span>
            <div>
              <strong className="text-white block">Living Room TV</strong>
              <span className="text-[11px] text-slate-400">Press F for Fullscreen to fill your TV or projector screen.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
