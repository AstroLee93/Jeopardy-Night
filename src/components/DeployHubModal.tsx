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
  RefreshCw, 
  Terminal, 
  Calendar,
  ExternalLink,
  KeyRound
} from 'lucide-react';

interface DeployHubModalProps {
  onClose: () => void;
}

export const DeployHubModal: React.FC<DeployHubModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'portainer' | 'python' | 'cli' | 'updates' | 'urls' | 'kiosk'>('portainer');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dockerComposeCode = `version: '3.8'

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
      - GEMINI_API_KEY=\${GEMINI_API_KEY}`;

  const pythonComposeCode = `version: '3.8'

services:
  family-jeopardy-python:
    build:
      context: .
      dockerfile: Dockerfile.python
    container_name: family-jeopardy-python
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - GEMINI_API_KEY=\${GEMINI_API_KEY}`;

  const pythonCliCode = `# 1. Enter project folder on Raspberry Pi
cd ~/family-jeopardy

# 2. Build and run using the Python (google-genai) Dockerfile
docker compose -f docker-compose.python.yml up -d --build

# 3. View live Python FastAPI & google-genai logs
docker logs -f family-jeopardy-python`;

  const cliDeployCode = `# 1. Create project directory on your Raspberry Pi & navigate into it
mkdir -p ~/family-jeopardy
cd ~/family-jeopardy

# 2. Clone your repository into the folder
git clone <YOUR_GIT_REPO_URL> .

# 3. Add your Gemini API key (AQ.Ab8... or AIzaSy...)
echo "GEMINI_API_KEY=AQ.Ab8YourActualKeyHere" > .env

# 4. Build and launch container in background
docker compose up -d --build

# 5. View container logs
docker logs -f family-jeopardy`;

  const cronCode = `# Automatically update Family Jeopardy every morning at 4:00 AM
0 4 * * * /bin/bash /home/pi/family-jeopardy/update.sh >> /home/pi/family-jeopardy/update.log 2>&1`;

  const manualUpdateCode = `cd ~/family-jeopardy && ./update.sh`;

  const piKioskCommand = `DISPLAY=:0 chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 "http://localhost:3000?role=tv"`;

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/94 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-8 shadow-2xl flex flex-col text-left max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-jeopardy-display text-2xl sm:text-3xl text-white uppercase tracking-wider">
                  Raspberry Pi & Docker Deployment Guide
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded">
                  Portainer + ARM64/ARMv7
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                A-Z instructions for deploying and running Family Jeopardy with Gemini AI on your Raspberry Pi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Key Note */}
        <div className="mb-4 bg-amber-950/40 border border-[#ffcc00]/50 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
          <KeyRound className="w-5 h-5 text-[#ffcc00] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs sm:text-sm">API Key Requirement:</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-amber-300 hover:text-amber-100 flex items-center gap-1 font-semibold underline"
              >
                <span>Get Key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Family Jeopardy supports Google's newest and most secure <code className="text-[#ffcc00] font-mono font-bold">AQ.Ab8...</code> Authentication Keys, as well as legacy <code className="text-slate-300 font-mono">AIzaSy...</code> keys. Enter your key in the environment as <code className="text-[#ffcc00] font-mono font-bold">GEMINI_API_KEY</code> without quotes.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-700 rounded-xl mb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('portainer')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'portainer'
                ? 'bg-[#ffcc00] text-[#02052c] shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>1. Node.js Stack</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'python'
                ? 'bg-[#ffcc00] text-[#02052c] shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Python (google-genai)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'bg-[#ffcc00] text-[#02052c] shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Terminal (SSH)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'updates'
                ? 'bg-[#ffcc00] text-[#02052c] shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>3. Auto-Updates</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('urls')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'urls'
                ? 'bg-[#ffcc00] text-[#02052c] shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>4. Game Night Roles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kiosk')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'kiosk'
                ? 'bg-[#ffcc00] text-[#02052c] shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>5. TV Kiosk Mode</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-200 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: Portainer Stack (Node.js) */}
          {activeTab === 'portainer' && (
            <div className="space-y-4">
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#ffcc00] text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> Step-by-Step Portainer Deployment (Node.js)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs">
                  <li>
                    <strong className="text-white">Create project directory (Pi Host):</strong> If storing compose files or cloning locally on the Raspberry Pi:
                    <code className="text-emerald-300 bg-slate-900 px-2 py-0.5 rounded font-mono text-[11px] block mt-1">
                      mkdir -p ~/family-jeopardy && cd ~/family-jeopardy
                    </code>
                  </li>
                  <li>
                    <strong className="text-white">Clean up old containers:</strong> In Portainer, go to <span className="text-amber-300">Containers</span>. If any old container is using port 3000 or 8080 (e.g. <code className="text-red-300">anime-jeopardy</code>), select and remove it.
                  </li>
                  <li>
                    <strong className="text-white">Create the Stack:</strong> Navigate to <span className="text-amber-300">Stacks ➔ Add stack</span>. Name it <code className="text-[#ffcc00]">family-jeopardy</code>.
                  </li>
                  <li>
                    <strong className="text-white">Build Method:</strong> Choose either <strong>Repository</strong> (enter your Git repo URL) or <strong>Web Editor</strong> and paste the Compose configuration below.
                  </li>
                  <li>
                    <strong className="text-white">Add Environment Variable:</strong> Under the editor in <span className="text-amber-300">Environment variables</span>, add:
                    <div className="bg-black/60 p-2 rounded mt-1 font-mono text-[11px] text-amber-200">
                      Name: GEMINI_API_KEY<br />
                      Value: AQ.Ab8YourActualKeyHere
                    </div>
                  </li>
                  <li>
                    <strong className="text-white">Deploy:</strong> If updating an existing stack, toggle <em>"Re-pull image and redeploy"</em> to ON, then click <strong className="text-emerald-400">Deploy the stack</strong>.
                  </li>
                </ol>
              </div>

              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-jeopardy-display text-sm text-[#ffcc00] uppercase tracking-wider flex items-center gap-1.5">
                    docker-compose.yml
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(dockerComposeCode, 'compose')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'compose' ? 'Copied!' : 'Copy YAML'}</span>
                  </button>
                </div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
                  {dockerComposeCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Python Backend (google-genai) */}
          {activeTab === 'python' && (
            <div className="space-y-4">
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#ffcc00] text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> Python (FastAPI + official google-genai)
                </h3>
                <p className="text-xs text-slate-300">
                  Runs the full-stack app using Python 3.11 with the official Google GenAI Python SDK (<code className="text-amber-300">from google import genai</code>) and FastAPI.
                </p>
                <div className="bg-black/60 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <span className="text-white font-bold block">1-Click Launch on Raspberry Pi (Terminal / SSH):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">SSH Commands</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pythonCliCode, 'python-cli')}
                      className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'python-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'python-cli' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <pre className="text-emerald-300 font-mono text-[11px] overflow-x-auto p-2 bg-slate-900 rounded">
                    {pythonCliCode}
                  </pre>
                </div>
              </div>

              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-jeopardy-display text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    docker-compose.python.yml
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(pythonComposeCode, 'python-compose')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'python-compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'python-compose' ? 'Copied!' : 'Copy Python YAML'}</span>
                  </button>
                </div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                  {pythonComposeCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Terminal CLI (SSH) */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#ffcc00] text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Direct Raspberry Pi Terminal Commands
                </h3>
                <p className="text-xs text-slate-300">
                  Run these commands in an SSH session on your Raspberry Pi:
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Terminal Script</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(cliDeployCode, 'cli')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cli' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                  {cliDeployCode}
                </pre>
              </div>

              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
                <span className="font-bold text-white text-xs block mb-1">Verify Server Health:</span>
                <p className="text-xs text-slate-300">
                  Inspect active logs anytime to confirm the AI Question generator and screen sync are listening:
                </p>
                <code className="text-amber-300 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono text-xs">
                  docker logs -f family-jeopardy
                </code>
              </div>
            </div>
          )}

          {/* TAB 3: Automated Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#ffcc00] text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Option 1: One-Command Manual Update
                </h3>
                <p className="text-xs text-slate-300">
                  The repository includes an <code className="text-amber-300">update.sh</code> script that pulls the latest git commits, rebuilds the Docker container, prunes dangling images to save SD card space, and verifies health:
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Run in ~/family-jeopardy</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(manualUpdateCode, 'manualUpdate')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'manualUpdate' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'manualUpdate' ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-[#ffcc00] font-mono">
                  {manualUpdateCode}
                </pre>
              </div>

              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-[#ffcc00] text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Option 2: Automated Nightly Cron Job
                </h3>
                <p className="text-xs text-slate-300">
                  To have your Raspberry Pi check for updates and rebuild automatically every day at 4:00 AM, edit crontab:
                </p>
                <code className="text-cyan-300 bg-slate-900 px-2 py-1 rounded block font-mono text-xs">
                  crontab -e
                </code>
                <p className="text-xs text-slate-300">Add the following line at the bottom:</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Crontab Entry</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(cronCode, 'cron')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'cron' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cron' ? 'Copied!' : 'Copy Cron'}</span>
                  </button>
                </div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                  {cronCode}
                </pre>
              </div>

              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
                <span className="font-bold text-white text-xs block mb-1">Option 3: Portainer Automatic Polling</span>
                <p className="text-xs text-slate-300">
                  If deployed via the <strong>Git Repository</strong> method in Portainer, open your stack, toggle <strong className="text-amber-300">"Automatic updates"</strong> to ON, and select a polling interval (e.g. 1d). Portainer will poll GitHub and redeploy automatically.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Game Night Roles & URLs */}
          {activeTab === 'urls' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Once the container is running on port 3000, access these URLs from any phone, tablet, laptop, or TV connected to your local network:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#02052c] border border-cyan-500/40 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 text-cyan-300 font-bold">
                      <Tv className="w-4 h-4" />
                      <span>1. Living Room TV</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Fullscreen board for players. Clues, dollar values, and timers display, but answers remain hidden.
                    </p>
                  </div>
                  <code className="text-[10px] text-cyan-400 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono">
                    http://&lt;pi-ip&gt;:3000?role=tv
                  </code>
                </div>

                <div className="bg-[#02052c] border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 text-[#ffcc00] font-bold">
                      <Smartphone className="w-4 h-4" />
                      <span>2. Host Controller</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Open on phone or tablet. Private answer sheet, score controls, buzzer lockouts, and "Reveal on TV" button.
                    </p>
                  </div>
                  <code className="text-[10px] text-amber-300 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono">
                    http://&lt;pi-ip&gt;:3000?role=host
                  </code>
                </div>

                <div className="bg-[#02052c] border border-emerald-500/40 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 text-emerald-300 font-bold">
                      <Server className="w-4 h-4" />
                      <span>3. Main Game Board</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Standard interactive board with top navigation, audio synthesizer, and AI Question Generator modal.
                    </p>
                  </div>
                  <code className="text-[10px] text-emerald-400 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono">
                    http://&lt;pi-ip&gt;:3000
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TV Kiosk Mode */}
          {activeTab === 'kiosk' && (
            <div className="space-y-4">
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4 space-y-3">
                <span className="font-jeopardy-display text-sm sm:text-base text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-4 h-4" /> Raspberry Pi HDMI TV Kiosk Auto-Start
                </span>
                <p className="text-xs text-slate-300">
                  To have your Raspberry Pi automatically launch Chromium into full-screen TV mode whenever it powers on connected to your living room TV:
                </p>
                <p className="text-xs text-slate-400">
                  Add this command to <code className="text-amber-300">~/.config/lxsession/LXDE-pi/autostart</code>:
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Kiosk Command</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(piKioskCommand, 'kiosk')}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'kiosk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'kiosk' ? 'Copied!' : 'Copy Kiosk CLI'}</span>
                  </button>
                </div>
                <pre className="bg-black/60 border border-slate-800 rounded-lg p-3 text-[11px] text-cyan-200 font-mono overflow-x-auto leading-relaxed">
                  {piKioskCommand}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Port 3000 &bull; Automated Updates script: <code className="text-amber-300 font-mono">update.sh</code></span>
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
