import React, { useState } from 'react';
import { ScreenRole } from '../utils/gameSync';
import { Tv, Crown, ExternalLink, Copy, Check, X, Smartphone, Monitor } from 'lucide-react';

interface RoleDesignationModalProps {
  currentRole: ScreenRole;
  onSelectRole: (role: ScreenRole) => void;
  onClose: () => void;
}

export const RoleDesignationModal: React.FC<RoleDesignationModalProps> = ({
  currentRole,
  onSelectRole,
  onClose
}) => {
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const getUrlForRole = (role: ScreenRole) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    return url.toString();
  };

  const handleCopyLink = (role: ScreenRole) => {
    const url = getUrlForRole(role);
    navigator.clipboard.writeText(url);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const handleOpenNewWindow = (role: ScreenRole) => {
    const url = getUrlForRole(role);
    window.open(url, `_blank_${role}`, 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/94 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-8 shadow-2xl flex flex-col text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-jeopardy-display text-2xl sm:text-3xl text-white uppercase tracking-wider">
                Screen Role Designation
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Configure whether this device is the <strong>TV Display</strong> for players or the <strong>Host Controller</strong> for you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two Big Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: TV Display Mode */}
          <div
            onClick={() => onSelectRole('tv')}
            className={`border-2 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
              currentRole === 'tv'
                ? 'bg-gradient-to-b from-cyan-950/80 to-[#02052c] border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] scale-[1.02]'
                : 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/60'
            }`}
          >
            {currentRole === 'tv' && (
              <span className="absolute -top-3 right-4 bg-cyan-500 text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow">
                ✓ Currently Active on this Screen
              </span>
            )}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-jeopardy-display text-xl text-cyan-300 uppercase tracking-wide">
                    📺 TV / Big Screen Display
                  </h3>
                  <span className="text-[11px] text-slate-400">Put this on living room TV or projector</span>
                </div>
              </div>

              <ul className="text-xs text-slate-300 space-y-1.5 my-3 pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span> High-contrast, clean board with large fonts
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span> Clues open automatically when chosen by Host
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-400">✓</span> Displays live 15s timer and buzzer lockouts
                </li>
                <li className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span className="text-red-400">🔒</span> Answers are strictly hidden until Host reveals them
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole('tv');
                  onClose();
                }}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Set This Screen as TV
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink('tv');
                }}
                title="Copy TV screen link"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedRole === 'tv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card 2: Host Controller Mode */}
          <div
            onClick={() => onSelectRole('host')}
            className={`border-2 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
              currentRole === 'host'
                ? 'bg-gradient-to-b from-amber-950/80 to-[#02052c] border-[#ffcc00] shadow-[0_0_25px_rgba(255,204,0,0.35)] scale-[1.02]'
                : 'bg-slate-900/80 border-slate-700 hover:border-amber-500/60'
            }`}
          >
            {currentRole === 'host' && (
              <span className="absolute -top-3 right-4 bg-[#ffcc00] text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow">
                ✓ Currently Active on this Screen
              </span>
            )}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-jeopardy-display text-xl text-[#ffcc00] uppercase tracking-wide">
                    👑 Host Controller (Admin)
                  </h3>
                  <span className="text-[11px] text-slate-400">Keep on your laptop, tablet, or phone</span>
                </div>
              </div>

              <ul className="text-xs text-slate-300 space-y-1.5 my-3 pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#ffcc00]">✓</span> Immediate Private Answer Key in every clue
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#ffcc00]">✓</span> Control TV remotely (Open clues, pause timer)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#ffcc00]">✓</span> Award/deduct points and manage team buzz-ins
                </li>
                <li className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <span className="text-emerald-400">📢</span> Press "Reveal on TV" once the team answers
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole('host');
                  onClose();
                }}
                className="flex-1 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Set This Screen as Host
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink('host');
                }}
                title="Copy Host Controller link"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedRole === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* How to use dual-screen setup */}
        <div className="bg-[#02052c] border border-slate-700/80 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-[#ffcc00] uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Two Ways to Run Dual-Screen Game Night:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <strong className="text-white block mb-0.5">Option A: Two Devices on Local Wi-Fi</strong>
              <span>Open the TV link on your Raspberry Pi/smart TV (<code className="text-cyan-300 font-mono">?role=tv</code>), and open the Host link on your phone/laptop (<code className="text-amber-300 font-mono">?role=host</code>). All actions sync in real time over your local network!</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <strong className="text-white block mb-0.5">Option B: Laptop Plugged into TV via HDMI</strong>
              <span>In Windows/Mac, set display to <em>"Extend"</em>. Drag a TV window to the TV screen and keep the Host window on your laptop screen. They synchronize with 0ms latency!</span>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => handleOpenNewWindow('tv')}
                  className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-cyan-900"
                >
                  <ExternalLink className="w-3 h-3" /> Open TV Window in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
