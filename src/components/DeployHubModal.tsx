import React, { useState } from 'react';
import { Copy, Check, Download, Server, Cpu, Layers, FileCode, FolderArchive, X } from 'lucide-react';

interface DeployHubModalProps {
  onClose: () => void;
}

const COMPOSE_CONTENT = `services:
  anime-jeopardy:
    # Use official lightweight multi-architecture image (works on Pi arm64/armv7)
    image: nginx:alpine
    container_name: anime_jeopardy
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      # Map the standalone web folder directly to Nginx root:
      - ./standalone:/usr/share/nginx/html:ro
      # Bind mount for your custom anime images (.jpg, .png):
      - ./images:/usr/share/nginx/html/images:ro
    environment:
      - NGINX_PORT=80
`;

const DOCKERFILE_CONTENT = `FROM nginx:alpine

LABEL maintainer="Anime Jeopardy Game Night"
LABEL description="Offline Anime Jeopardy game for Raspberry Pi and Portainer"

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY standalone/ /usr/share/nginx/html/
RUN mkdir -p /usr/share/nginx/html/images

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

const NGINX_CONTENT = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /images/ {
        alias /usr/share/nginx/html/images/;
        expires 1h;
        try_files $uri $uri/ =404;
    }
}
`;

export const DeployHubModal: React.FC<DeployHubModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'dockerfile' | 'portainer' | 'images'>('portainer');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#010314]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#07116b] to-[#02052c] border-2 sm:border-4 border-[#ffcc00] rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-[#ffcc00] flex items-center justify-center text-[#ffcc00]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-jeopardy-display text-xl sm:text-2xl text-white uppercase tracking-wider">
                Raspberry Pi & Portainer Hub
              </h2>
              <p className="text-xs text-slate-300">
                Lightweight Docker deployment specs (~15MB RAM · ARM64/ARMv7 compatible)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('portainer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'portainer'
                ? 'bg-[#ffcc00] text-[#030852] font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Portainer Deploy Guide
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'compose'
                ? 'bg-[#ffcc00] text-[#030852] font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" /> docker-compose.yml
          </button>
          <button
            onClick={() => setActiveTab('dockerfile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'dockerfile'
                ? 'bg-[#ffcc00] text-[#030852] font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" /> Dockerfile
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-[#ffcc00] text-[#030852] font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FolderArchive className="w-4 h-4" /> Custom Images Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 text-left pr-1">
          {activeTab === 'portainer' && (
            <div className="space-y-4 text-sm text-slate-200">
              <div className="bg-[#02052c] border border-amber-500/40 rounded-xl p-4">
                <h3 className="font-bold text-[#ffcc00] text-base mb-2">
                  🚀 4 Simple Steps to Deploy in Portainer on your Raspberry Pi:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    <strong className="text-white">Copy the standalone files</strong>: Place this repository folder (containing <code className="text-amber-300">standalone/</code> and <code className="text-amber-300">images/</code>) onto your Raspberry Pi (e.g. into <code className="text-amber-300">/home/pi/anime-jeopardy</code>).
                  </li>
                  <li>
                    <strong className="text-white">Open Portainer</strong> in your web browser: <code className="text-amber-300">http://&lt;raspberry-pi-ip&gt;:9000</code>.
                  </li>
                  <li>
                    Go to <strong className="text-white">Stacks</strong> &rarr; Click <strong className="text-white">+ Add stack</strong> &rarr; Name it <code className="text-amber-300">anime-jeopardy</code>.
                  </li>
                  <li>
                    Select the <strong className="text-white">Web editor</strong> tab, paste the contents of <code className="text-amber-300">docker-compose.yml</code>, and click <strong className="text-emerald-400">Deploy the stack</strong>!
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Local Network Access
                  </div>
                  <p className="text-xs text-slate-300">
                    Once deployed, anyone on your home Wi-Fi can play by visiting:
                  </p>
                  <code className="block bg-black/60 p-2 rounded text-emerald-400 font-mono text-sm mt-2 border border-slate-700">
                    http://&lt;raspberry-pi-ip&gt;:8080
                  </code>
                </div>

                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Resource Efficiency
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• Alpine Linux + Nginx: <strong>&lt; 18 MB RAM</strong></li>
                    <li>• Multi-arch: <strong>ARM64, ARMv7, x86_64</strong></li>
                    <li>• Zero runtime Node.js or build tools needed on Pi</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">docker-compose.yml</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(COMPOSE_CONTENT, 'compose')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-white flex items-center gap-1 border border-slate-600 transition-colors"
                  >
                    {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'compose' ? 'Copied!' : 'Copy Compose'}
                  </button>
                  <button
                    onClick={() => handleDownloadFile('docker-compose.yml', COMPOSE_CONTENT, 'text/yaml')}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold rounded text-[#ffcc00] flex items-center gap-1 border border-amber-500/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
              <pre className="bg-[#010314] border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {COMPOSE_CONTENT}
              </pre>
            </div>
          )}

          {activeTab === 'dockerfile' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Dockerfile</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(DOCKERFILE_CONTENT, 'dockerfile')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-white flex items-center gap-1 border border-slate-600 transition-colors"
                  >
                    {copiedKey === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'dockerfile' ? 'Copied!' : 'Copy Dockerfile'}
                  </button>
                  <button
                    onClick={() => handleDownloadFile('Dockerfile', DOCKERFILE_CONTENT)}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold rounded text-[#ffcc00] flex items-center gap-1 border border-amber-500/40 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
              <pre className="bg-[#010314] border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {DOCKERFILE_CONTENT}
              </pre>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4 text-sm text-slate-200">
              <div className="bg-[#02052c] border border-slate-700 rounded-xl p-4">
                <h3 className="font-bold text-[#ffcc00] text-base mb-2">
                  🖼️ Adding Custom Anime Pictures:
                </h3>
                <p className="text-slate-300 text-xs mb-3">
                  The container mounts the local <code className="text-amber-300">./images</code> directory into <code className="text-amber-300">/usr/share/nginx/html/images/</code>.
                </p>
                <div className="space-y-3 text-xs">
                  <div>
                    <strong className="text-white">1. Save pictures onto your Raspberry Pi:</strong>
                    <div className="bg-black/50 p-2.5 rounded font-mono text-slate-300 border border-slate-800 mt-1">
                      /home/pi/anime-jeopardy/images/luffy.jpg<br />
                      /home/pi/anime-jeopardy/images/rasengan.png<br />
                      /home/pi/anime-jeopardy/images/totoro.webp
                    </div>
                  </div>
                  <div>
                    <strong className="text-white">2. In game-data.js, reference the local path:</strong>
                    <div className="bg-black/50 p-2.5 rounded font-mono text-emerald-400 border border-slate-800 mt-1">
                      image: "/images/luffy.jpg"
                    </div>
                  </div>
                  <div>
                    <strong className="text-white">3. Reload the page on your TV or browser:</strong>
                    <p className="text-slate-400 mt-1">
                      Nginx automatically serves the image with HTTP cache headers. No restart required!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>All files ready in repository root: <code className="text-amber-400">Dockerfile</code>, <code className="text-amber-400">docker-compose.yml</code>, <code className="text-amber-400">standalone/</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
