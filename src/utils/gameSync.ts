/**
 * Real-time Multi-Device Synchronization for Anime Jeopardy
 * Synchronizes TV Display (Player Screen) and Host Controller (Host Laptop/Phone)
 * Works over BroadcastChannel (instant for multi-tab/extended display)
 * AND Server Sync via REST/SSE (for separate devices across local Wi-Fi/Raspberry Pi).
 */

export type ScreenRole = 'tv' | 'host';

export interface SyncedGameState {
  version: number;
  phase: 'SETUP' | 'BOARD' | 'FINAL_JEOPARDY' | 'PODIUM';
  gameDataTitle: string;
  teams: Array<{
    id: number;
    name: string;
    score: number;
    avatar?: string;
    color: { bg: string; border: string };
  }>;
  usedClues: string[];
  activeClue: {
    catIndex: number;
    clueIndex: number;
    value: number;
    clue: string;
    answer: string;
    categoryTitle: string;
    isDailyDouble?: boolean;
    image?: string | null;
    imageAlt?: string;
    isAnswerRevealedOnTv: boolean;
  } | null;
  timer: {
    timeLeft: number;
    isRunning: boolean;
    isThinkMusic: boolean;
  };
  buzzedTeamId: number | null;
  lockedOutTeamIds: number[];
  finalStage: 'WAGER' | 'CLUE' | 'REVEAL' | 'DONE';
  timestamp: number;
}

export type SyncAction =
  | { type: 'SET_ROLE'; role: ScreenRole }
  | { type: 'START_GAME'; teams: any[]; gameData?: any }
  | { type: 'OPEN_CLUE'; catIndex: number; clueIndex: number; clue: any; categoryTitle: string }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER'; seconds?: number }
  | { type: 'SET_TIME_LEFT'; timeLeft: number }
  | { type: 'TOGGLE_THINK_MUSIC'; active: boolean }
  | { type: 'BUZZ_IN'; teamId: number }
  | { type: 'CLEAR_BUZZER' }
  | { type: 'REVEAL_ANSWER_ON_TV' }
  | { type: 'AWARD_SCORE'; teamId: number; delta: number }
  | { type: 'CLOSE_CLUE' }
  | { type: 'GO_TO_FINAL_JEOPARDY' }
  | { type: 'FINISH_GAME'; finalTeams: any[] }
  | { type: 'RESET_GAME' }
  | { type: 'SYNC_FULL_STATE'; state: SyncedGameState };

class GameSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(action: SyncAction) => void> = [];
  private sseSource: EventSource | null = null;
  public currentRole: ScreenRole = 'host';

  constructor() {
    // Check URL query param first: ?role=tv or ?role=host
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'tv' || urlRole === 'host') {
        this.currentRole = urlRole;
      } else {
        const saved = localStorage.getItem('anime_jeopardy_screen_role') as ScreenRole;
        if (saved === 'tv' || saved === 'host') {
          this.currentRole = saved;
        }
      }

      // Initialize BroadcastChannel for 0ms same-machine sync
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('anime_jeopardy_multiscreen_sync');
          this.channel.onmessage = (event) => {
            if (event.data) {
              this.notifyListeners(event.data as SyncAction);
            }
          };
        }
      } catch {}

      // Connect to server-sent events for cross-device Wi-Fi sync
      this.initServerEvents();
    }
  }

  public setRole(role: ScreenRole) {
    this.currentRole = role;
    if (typeof window !== 'undefined') {
      localStorage.setItem('anime_jeopardy_screen_role', role);
      // Update URL without reload for easy sharing
      const url = new URL(window.location.href);
      url.searchParams.set('role', role);
      window.history.replaceState({}, '', url.toString());
    }
    this.broadcast({ type: 'SET_ROLE', role });
  }

  public getRole(): ScreenRole {
    return this.currentRole;
  }

  // Subscribe to actions sent from other screen
  public subscribe(listener: (action: SyncAction) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Broadcast action to all other tabs and network devices
  public broadcast(action: SyncAction) {
    // 1. Broadcast locally
    if (this.channel) {
      try {
        this.channel.postMessage(action);
      } catch {}
    }

    // 2. Also notify local listeners in current window
    this.notifyListeners(action);

    // 3. Post to server for cross-device Wi-Fi synchronization
    if (typeof window !== 'undefined') {
      fetch('/api/sync/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      }).catch(() => {
        // Offline or standalone static fallback
      });
    }
  }

  private notifyListeners(action: SyncAction) {
    this.listeners.forEach((listener) => {
      try {
        listener(action);
      } catch (err) {
        console.error('Error in gameSync listener:', err);
      }
    });
  }

  private initServerEvents() {
    if (typeof window === 'undefined') return;

    try {
      this.sseSource = new EventSource('/api/sync/events');
      this.sseSource.onmessage = (event) => {
        try {
          const action = JSON.parse(event.data);
          this.notifyListeners(action);
        } catch {}
      };
      this.sseSource.onerror = () => {
        // Fallback or retry handled automatically by browser EventSource
      };
    } catch {}
  }
}

export const gameSync = new GameSyncManager();
