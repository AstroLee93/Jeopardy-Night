import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Copy, 
  Check, 
  Tv, 
  Smartphone, 
  HardDrive, 
  ShieldCheck, 
  WifiOff, 
  ExternalLink 
} from 'lucide-react';

interface DeployHubModalProps {
  onClose: () => void;
}

export const DeployHubModal: React.FC<DeployHubModalProps> = ({ onClose }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeDeployMode, setActiveDeployMode] = useState<'fullstack' | 'static'>('fullstack');

  // Full-Stack Node.js (Vite + Express) - Includes Gemini AI Generator + Real-time Multi-Screen Sync
  const fullstackComposeCode = `version: '3.8'

services:
  family-jeopardy:
    build: .
    container_name: family-jeopardy
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=AQ.Ab8YourAuthenticationKeyHere`;

  const fullstackDockerRunCode = `docker run -d \\
  --name family-jeopardy \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e PORT=3000 \\
  -e GEMINI_API_KEY="AQ.Ab8YourAuthenticationKeyHere" \\
  family-jeopardy`;

  // Static Nginx fallback (Offline only - no AI backend)
  const staticComposeCode = `version: '3.8'

services:
  anime-jeopardy:
    image: nginx:alpine
    container_name: anime-jeopardy
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./standalone:/usr/share/nginx/html:ro
      - ./images:/usr/share/nginx/html/images:ro
    environment:
      - TZ=America/New_York`;

  const piKioskCommand = `DISPLAY=:0 chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 "http://localhost:3000?role=tv"`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/94 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-8 shadow-2xl flex flex-col text-left max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-jeopardy-display text-2xl sm:text-3xl text-white uppercase tracking-wider">
                  Docker & Raspberry Pi Hub
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded">
                  100% Offline Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Deploy Family Jeopardy on your Raspberry Pi, Portainer, or Home Server for local family game nights
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-slate-200 text-xs sm:text-sm leading-relaxed">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveDeployMode('fullstack')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeDeployMode === 'fullstack'
                  ? 'bg-[#ffcc00] text-[#02052c] shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Full-Stack Node.js (AI Trivia Generator + Wi-Fi Sync) [Recommended]</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDeployMode('static')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeDeployMode === 'static'
                  ? 'bg-[#ffcc00] text-[#02052c] shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <WifiOff className="w-4 h-4" />
              <span>Static Nginx (100% Offline, No AI API)</span>
            </button>
          </div>

          {/* Gemini API Key Guidance Callout */}
          {activeDeployMode === 'fullstack' && (
            <div className="bg-amber-950/40 border border-[#ffcc00]/50 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#ffcc00] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white mb-0.5">Google Gemini API Key Support:</span>
                <p className="text-slate-300 leading-relaxed">
                  The Node.js server fully supports Google's newest and most secure <code className="text-[#ffcc00] font-mono font-bold">AQ.Ab8...</code> Authentication Keys, as well as legacy <code className="text-slate-300 font-mono">AIzaSy...</code> keys from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-amber-300 font-bold">Google AI Studio</a>. Set this in Portainer's Environment variables as <code className="text-[#ffcc00] font-mono">GEMINI_API_KEY</code>.
                </p>
              </div>
            </div>
          )}

          {/* Architecture Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#02052c] border border-cyan-500/40 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-cyan-300 font-bold">
                  <Tv className="w-4 h-4" />
                  <span>1. Living Room TV</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Runs full screen on your TV or projector. Clean interface where clues and timers display with answers hidden.
                </p>
              </div>
              <code className="text-[10px] text-cyan-400 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono">
                {activeDeployMode === 'fullstack' ? 'http://<pi-ip>:3000?role=tv' : 'http://<pi-ip>:8080?role=tv'}
              </code>
            </div>

            <div className="bg-[#02052c] border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-[#ffcc00] font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>2. Host Controller</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Open on your phone or laptop. Private answer key, scoring controls, timer, and "Reveal on TV" button.
                </p>
              </div>
              <code className="text-[10px] text-amber-300 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono">
                {activeDeployMode === 'fullstack' ? 'http://<pi-ip>:3000?role=host' : 'http://<pi-ip>:8080?role=host'}
              </code>
            </div>

            <div className="bg-[#02052c] border border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-emerald-300 font-bold">
                  <WifiOff className="w-4 h-4" />
                  <span>3. Wi-Fi Multi-Screen Sync</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {activeDeployMode === 'fullstack'
                    ? 'Includes local Express server with SSE & BroadcastChannel for real-time TV updates across your home network.'
                    : 'Static Nginx mode operates 100% offline with synthesized audio. BroadcastChannel operates across local tabs.'}
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-2 block">
                {activeDeployMode === 'fullstack' ? '✓ Full-Stack Node.js (Port 3000)' : '✓ Ultra lightweight Nginx (Port 8080)'}
              </span>
            </div>
          </div>

          {/* Section 1: Portainer / Docker Compose Stack */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-jeopardy-display text-sm sm:text-base text-[#ffcc00] uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4" /> Portainer Stack / Docker Compose
              </span>
              <button
                type="button"
                onClick={() => handleCopy(activeDeployMode === 'fullstack' ? fullstackComposeCode : staticComposeCode, 'compose')}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedTab === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'compose' ? 'Copied!' : 'Copy YAML'}</span>
              </button>
            </div>
            <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
              {activeDeployMode === 'fullstack' ? fullstackComposeCode : staticComposeCode}
            </pre>
          </div>

          {/* Section 2: Direct Docker Run Command */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-jeopardy-display text-sm sm:text-base text-[#ffcc00] uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4" /> Docker CLI Command
              </span>
              <button
                type="button"
                onClick={() => handleCopy(activeDeployMode === 'fullstack' ? fullstackDockerRunCode : staticComposeCode, 'dockerrun')}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedTab === 'dockerrun' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'dockerrun' ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
            <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
              {activeDeployMode === 'fullstack' ? fullstackDockerRunCode : staticComposeCode}
            </pre>
          </div>

          {/* Section 3: Raspberry Pi Kiosk Auto-Start */}
          <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-jeopardy-display text-sm sm:text-base text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-4 h-4" /> Raspberry Pi HDMI TV Kiosk Command
              </span>
              <button
                type="button"
                onClick={() => handleCopy(piKioskCommand, 'kiosk')}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedTab === 'kiosk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'kiosk' ? 'Copied!' : 'Copy Kiosk CLI'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Add this to <code className="text-amber-300">~/.config/lxsession/LXDE-pi/autostart</code> to have the Pi boot straight into full-screen TV game night mode:
            </p>
            <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-cyan-200 font-mono overflow-x-auto leading-relaxed">
              {piKioskCommand}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Standalone files are located in <code className="text-amber-300 font-mono">./standalone/</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#ffcc00] hover:bg-[#ffe066] text-[#030852] font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
