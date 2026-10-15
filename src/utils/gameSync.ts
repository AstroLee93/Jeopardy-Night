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
  | { type: 'SET_GAME_MODE'; mode: 'JEOPARDY' | 'FEUD' }
  | { type: 'START_GAME'; teams: any[]; gameData?: any }
  | { type: 'OPEN_CLUE'; catIndex: number; clueIndex: number; clue: any; categoryTitle: string }
  | {
      type: 'DAILY_DOUBLE_REVEAL';
      catIndex: number;
      clueIndex: number;
      clue: any;
      categoryTitle: string;
    }
  | {
      type: 'DAILY_DOUBLE_CONFIRM_WAGER';
      wager: number;
      teamId: number;
      teamName: string;
    }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER'; seconds?: number }
  | { type: 'SET_TIME_LEFT'; timeLeft: number }
  | {
      type: 'SYNC_TIMER';
      isRunning: boolean;
      timeLeft: number;
      endTime: number | null;
      initialDuration: number;
      isThinkMusic?: boolean;
    }
  | {
      type: 'SYNC_FINAL_STAGE';
      stage: 'WAGER' | 'CLUE' | 'JUDGE';
      timeLeft?: number;
      timerRunning?: boolean;
      endTime?: number | null;
    }
  | { type: 'TOGGLE_THINK_MUSIC'; active: boolean }
  | { type: 'BUZZ_IN'; teamId: number }
  | { type: 'CLEAR_BUZZER' }
  | { type: 'REVEAL_ANSWER_ON_TV' }
  | { type: 'AWARD_SCORE'; teamId: number; delta: number }
  | { type: 'CLOSE_CLUE' }
  | { type: 'GO_TO_FINAL_JEOPARDY' }
  | { type: 'FINISH_GAME'; finalTeams: any[] }
  | { type: 'RESET_GAME' }
  | { type: 'FEUD_SET_ROUND'; roundIdx: number }
  | { type: 'FEUD_TOGGLE_ANSWER'; answerId: string; revealed: boolean; points: number; newBank: number }
  | { type: 'FEUD_REVEAL_ALL'; allIds: string[]; newBank: number }
  | { type: 'FEUD_STRIKE'; strikes: number }
  | { type: 'FEUD_RESET_STRIKES' }
  | { type: 'FEUD_SET_PLAYING_TEAM'; teamIdx: number }
  | { type: 'FEUD_AWARD_BANK'; teamIndex: 0 | 1; updatedTeams: any[] }
  | { type: 'FEUD_APPLY_GAME'; game: any }
  | { type: 'FEUD_SYNC_STATE'; state: any }
  | { type: 'FAST_MONEY_OPEN' }
  | { type: 'FAST_MONEY_CLOSE' }
  | { type: 'FAST_MONEY_SET_STAGE'; stage: 'PLAYER1' | 'PLAYER2' | 'REVEAL' | 'RESULTS' }
  | { type: 'FAST_MONEY_SET_PLAYER'; player: 1 | 2; timerSeconds: number }
  | { type: 'FAST_MONEY_TIMER'; isRunning: boolean; timerSeconds: number }
  | { type: 'FAST_MONEY_SET_ACTIVE_Q'; qIndex: number }
  | { type: 'FAST_MONEY_SET_ANSWER'; player: 1 | 2; qIndex: number; text: string; points: number }
  | { type: 'FAST_MONEY_REVEAL_ANSWER'; player: 1 | 2; qIndex: number; points: number }
  | { type: 'FAST_MONEY_DUPLICATE_TRIGGER'; qIndex: number; text: string }
  | { type: 'FAST_MONEY_WIN'; totalPoints: number }
  | { type: 'FAST_MONEY_SYNC_STATE'; state: any }
  | { type: 'UPDATE_TEAMS'; teams: any[] }
  | { type: 'SET_GAME_DATA'; gameData: any }
  | { type: 'REQUEST_STATE' }
  | { type: 'SYNC_FULL_STATE'; state: any };

export type SyncConnectionStatus = 'connected' | 'connecting' | 'disconnected';

class GameSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(action: SyncAction) => void> = [];
  private statusListeners: Array<(status: SyncConnectionStatus) => void> = [];
  private sseSource: EventSource | null = null;
  public currentRole: ScreenRole = 'host';
  private clientId: string = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  private isDispatching: boolean = false;
  private pendingActions: SyncAction[] = [];
  private seenActionIds: Set<string> = new Set();
  public connectionStatus: SyncConnectionStatus = 'disconnected';

  constructor() {
    // Check URL query param first: ?role=tv or ?role=host takes strict priority!
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
              const data = event.data as any;
              // Ignore actions originating from this client tab
              if (data._senderId === this.clientId) {
                return;
              }
              this.notifyListeners(data as SyncAction);
            }
          };
        }
      } catch {}

      // Connect to server-sent events for cross-device Wi-Fi sync
      this.initServerEvents();

      // Immediately fetch authoritative server state on startup
      this.fetchServerState();
    }
  }

  // Fetch state snapshot from the server (critical for TV or secondary screens joining late)
  public async fetchServerState() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/sync/state');
      if (res.ok) {
        const data = await res.json();
        // Accept authoritative state whenever provided (do not reject SETUP phase!)
        if (data && data.state) {
          this.notifyListeners({
            type: 'SYNC_FULL_STATE',
            state: data.state
          });
        }
      }
    } catch {}

    // Also ask any active Host tab to share its live state
    this.broadcast({ type: 'REQUEST_STATE' });
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

  // Subscribe to actions sent from other screens
  public subscribe(listener: (action: SyncAction) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Broadcast action to all other tabs and network devices
  public broadcast(action: SyncAction) {
    const actionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const envelope = {
      ...action,
      _senderId: this.clientId,
      _actionId: actionId,
      _timestamp: Date.now()
    };

    // Track own action ID so echoes are discarded
    this.seenActionIds.add(actionId);
    if (this.seenActionIds.size > 200) {
      const first = this.seenActionIds.values().next().value;
      if (first) this.seenActionIds.delete(first);
    }

    // 1. Broadcast to other tabs in this browser via BroadcastChannel
    if (this.channel) {
      try {
        // Deep clone safe plain JSON to guarantee no circular references or DOM nodes reach postMessage
        const safePayload = JSON.parse(JSON.stringify(envelope));
        this.channel.postMessage(safePayload);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. Post to server for cross-device Wi-Fi synchronization
    if (typeof window !== 'undefined') {
      try {
        const safePayload = JSON.parse(JSON.stringify(envelope));
        fetch('/api/sync/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safePayload)
        }).catch(() => {
          // Offline or standalone static fallback
        });
      } catch {}
    }
  }

  private notifyListeners(action: SyncAction) {
    const actionWithMeta = action as any;
    // Deduplication check: ignore if we already handled this exact action ID
    if (actionWithMeta._actionId) {
      if (this.seenActionIds.has(actionWithMeta._actionId)) {
        return;
      }
      this.seenActionIds.add(actionWithMeta._actionId);
      if (this.seenActionIds.size > 200) {
        const first = this.seenActionIds.values().next().value;
        if (first) this.seenActionIds.delete(first);
      }
    }

    // Re-entrancy & stack overflow guard: queue action if currently dispatching
    if (this.isDispatching) {
      this.pendingActions.push(action);
      return;
    }

    this.isDispatching = true;
    try {
      this.listeners.forEach((listener) => {
        try {
          listener(action);
        } catch (err) {
          console.error('Error in gameSync listener:', err);
        }
      });
    } finally {
      this.isDispatching = false;
      // Drain any queued actions asynchronously to guarantee a fresh call stack
      if (this.pendingActions.length > 0) {
        const nextAction = this.pendingActions.shift();
        if (nextAction) {
          setTimeout(() => this.notifyListeners(nextAction), 0);
        }
      }
    }
  }

  private initServerEvents() {
    if (typeof window === 'undefined') return;

    try {
      this.connectionStatus = 'connecting';
      this.notifyStatusListeners('connecting');

      this.sseSource = new EventSource('/api/sync/events');
      
      this.sseSource.onopen = () => {
        this.connectionStatus = 'connected';
        this.notifyStatusListeners('connected');
      };

      this.sseSource.onmessage = (event) => {
        try {
          this.connectionStatus = 'connected';
          const action = JSON.parse(event.data);
          // If this event was sent by this exact tab/client, ignore it
          if (action._senderId === this.clientId) {
            return;
          }
          this.notifyListeners(action);
        } catch {}
      };

      this.sseSource.onerror = () => {
        this.connectionStatus = 'disconnected';
        this.notifyStatusListeners('disconnected');
      };
    } catch {
      this.connectionStatus = 'disconnected';
      this.notifyStatusListeners('disconnected');
    }
  }

  public subscribeStatus(listener: (status: SyncConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.connectionStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatusListeners(status: SyncConnectionStatus) {
    this.statusListeners.forEach((l) => {
      try {
        l(status);
      } catch {}
    });
  }
}

export const gameSync = new GameSyncManager();
