import React, { useState, useEffect } from 'react';
import { FeudGameData, FeudQuestion, FeudAnswer } from '../data/familyFeudData';
import { CURATED_FEUD_GAMES } from '../data/curatedFeudData';
import { Team } from './ScoreBoard';
import { FastMoneyModal } from './FastMoneyModal';
import { AiFeudGeneratorModal } from './AiFeudGeneratorModal';
import { soundFx } from '../utils/audioSynth';
import { gameSync, ScreenRole } from '../utils/gameSync';
import { 
  Trophy, 
  X, 
  Sparkles, 
  RefreshCw, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Check, 
  Award, 
  Tv, 
  Zap, 
  Crown,
  Eye,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface FamilyFeudBoardProps {
  teams: Team[];
  role?: ScreenRole;
  onUpdateTeams: (updated: Team[]) => void;
  onSwitchToJeopardy: () => void;
}

export const FamilyFeudBoard: React.FC<FamilyFeudBoardProps> = ({
  teams,
  role = 'host',
  onUpdateTeams,
  onSwitchToJeopardy,
}) => {
  const [currentGame, setCurrentGame] = useState<FeudGameData>(CURATED_FEUD_GAMES['anime-all-stars']);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);

  // Round state
  const [revealedAnswerIds, setRevealedAnswerIds] = useState<Set<string>>(new Set());
  const [roundBank, setRoundBank] = useState<number>(0);
  const [strikes, setStrikes] = useState<number>(0);
  const [showStrikeFlash, setShowStrikeFlash] = useState<boolean>(false);
  const [activePlayingTeamIdx, setActivePlayingTeamIdx] = useState<number>(0); // 0 = Team 1, 1 = Team 2

  // Modals
  const [showFastMoneyModal, setShowFastMoneyModal] = useState<boolean>(false);
  const [showAiFeudModal, setShowAiFeudModal] = useState<boolean>(false);

  // Teams in play (Family 1 vs Family 2)
  const team1 = teams[0] || { id: 1, name: 'Family 1', score: 0, color: { bg: '#dc2626', border: '#f87171' } };
  const team2 = teams[1] || { id: 2, name: 'Family 2', score: 0, color: { bg: '#0284c7', border: '#38bdf8' } };

  const currentRound: FeudQuestion = currentGame.rounds[currentRoundIdx] || currentGame.rounds[0];
  const multiplier = currentRound.multiplier || 1;

  // Reset round state when switching rounds
  const handleSelectRound = (idx: number) => {
    setCurrentRoundIdx(idx);
    setRevealedAnswerIds(new Set());
    setRoundBank(0);
    setStrikes(0);
    gameSync.broadcast({ type: 'FEUD_SET_ROUND', roundIdx: idx });
  };

  // Toggle or reveal an answer
  const handleToggleAnswer = (answer: FeudAnswer) => {
    const isAlreadyRevealed = revealedAnswerIds.has(answer.id);
    if (!isAlreadyRevealed) {
      soundFx.playFeudReveal();
      const updated = new Set(revealedAnswerIds);
      updated.add(answer.id);
      setRevealedAnswerIds(updated);
      const newBank = roundBank + answer.points * multiplier;
      setRoundBank(newBank);
      gameSync.broadcast({
        type: 'FEUD_TOGGLE_ANSWER',
        answerId: answer.id,
        revealed: true,
        points: answer.points,
        newBank
      });
    } else if (role === 'host') {
      // Allow host to re-hide
      const updated = new Set(revealedAnswerIds);
      updated.delete(answer.id);
      setRevealedAnswerIds(updated);
      const newBank = Math.max(0, roundBank - answer.points * multiplier);
      setRoundBank(newBank);
      gameSync.broadcast({
        type: 'FEUD_TOGGLE_ANSWER',
        answerId: answer.id,
        revealed: false,
        points: answer.points,
        newBank
      });
    }
  };

  // Trigger a strike
  const handleAddStrike = () => {
    if (strikes < 3) {
      soundFx.playFeudStrike();
      const nextStrikes = strikes + 1;
      setStrikes(nextStrikes);
      setShowStrikeFlash(true);
      setTimeout(() => setShowStrikeFlash(false), 1200);
      gameSync.broadcast({ type: 'FEUD_STRIKE', strikes: nextStrikes });
    }
  };

  // Reset strikes
  const handleResetStrikes = () => {
    setStrikes(0);
    gameSync.broadcast({ type: 'FEUD_RESET_STRIKES' });
  };

  // Set active playing team
  const handleSelectPlayingTeam = (teamIdx: number) => {
    setActivePlayingTeamIdx(teamIdx);
    gameSync.broadcast({ type: 'FEUD_SET_PLAYING_TEAM', teamIdx });
  };

  // Award round bank to team 1 or team 2
  const handleAwardBank = (teamIndex: 0 | 1) => {
    soundFx.playFeudWin();
    const updated = [...teams];
    if (updated[teamIndex]) {
      updated[teamIndex].score += roundBank;
    }
    onUpdateTeams(updated);
    setRoundBank(0);
    gameSync.broadcast({
      type: 'FEUD_AWARD_BANK',
      teamIndex,
      updatedTeams: updated
    });
  };

  // Reveal all answers
  const handleRevealAll = () => {
    soundFx.playFeudReveal();
    const allIds = currentRound.answers.map((a) => a.id);
    setRevealedAnswerIds(new Set(allIds));
    const totalRoundPoints = currentRound.answers.reduce((acc, a) => acc + a.points * multiplier, 0);
    setRoundBank(totalRoundPoints);
    gameSync.broadcast({
      type: 'FEUD_REVEAL_ALL',
      allIds,
      newBank: totalRoundPoints
    });
  };

  // Switch curated game
  const handleSwitchGame = (gameKey: string) => {
    const selected = CURATED_FEUD_GAMES[gameKey] || CURATED_FEUD_GAMES['anime-all-stars'];
    setCurrentGame(selected);
    setCurrentRoundIdx(0);
    setRevealedAnswerIds(new Set());
    setRoundBank(0);
    setStrikes(0);
    gameSync.broadcast({ type: 'FEUD_APPLY_GAME', game: selected });
  };

  // Subscribe to real-time multi-device sync
  useEffect(() => {
    const unsubscribe = gameSync.subscribe((action) => {
      switch (action.type) {
        case 'FEUD_SET_ROUND':
          setCurrentRoundIdx(action.roundIdx);
          setRevealedAnswerIds(new Set());
          setRoundBank(0);
          setStrikes(0);
          break;

        case 'FEUD_TOGGLE_ANSWER': {
          setRevealedAnswerIds((prev) => {
            const next = new Set(prev);
            if (action.revealed) {
              next.add(action.answerId);
              soundFx.playFeudReveal();
            } else {
              next.delete(action.answerId);
            }
            return next;
          });
          setRoundBank(action.newBank);
          break;
        }

        case 'FEUD_REVEAL_ALL':
          setRevealedAnswerIds(new Set(action.allIds));
          setRoundBank(action.newBank);
          soundFx.playFeudReveal();
          break;

        case 'FEUD_STRIKE':
          soundFx.playFeudStrike();
          setStrikes(action.strikes);
          setShowStrikeFlash(true);
          setTimeout(() => setShowStrikeFlash(false), 1200);
          break;

        case 'FEUD_RESET_STRIKES':
          setStrikes(0);
          break;

        case 'FEUD_SET_PLAYING_TEAM':
          setActivePlayingTeamIdx(action.teamIdx);
          break;

        case 'FEUD_AWARD_BANK':
          soundFx.playFeudWin();
          onUpdateTeams(action.updatedTeams);
          setRoundBank(0);
          break;

        case 'FEUD_APPLY_GAME':
          setCurrentGame(action.game);
          setCurrentRoundIdx(0);
          setRevealedAnswerIds(new Set());
          setRoundBank(0);
          setStrikes(0);
          break;
      }
    });

    return () => unsubscribe();
  }, [onUpdateTeams]);

  return (
    <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 gap-3">
      {/* 1. TOP MARQUEE: Family 1 vs THE BANK vs Family 2 */}
      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-[#02052c] border-2 border-amber-500/80 rounded-2xl p-2.5 sm:p-4 shadow-2xl relative overflow-hidden">
        {/* Shiny background accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-amber-500/15 to-blue-600/10 pointer-events-none" />

        {/* Team 1 Score Podium */}
        <div className={`col-span-4 sm:col-span-3 rounded-xl p-2 sm:p-3 border-2 transition-all text-center ${
          activePlayingTeamIdx === 0
            ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-500/20 ring-2 ring-red-400'
            : 'bg-slate-900/80 border-slate-700'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base">{team1.avatar || '🏴‍☠️'}</span>
            <span className="font-bold text-white text-xs sm:text-sm truncate">{team1.name}</span>
          </div>
          <div className="font-mono text-2xl sm:text-4xl font-black text-[#ffcc00] tracking-wider drop-shadow">
            {team1.score}
          </div>
          {role === 'host' && (
            <button
              type="button"
              onClick={() => handleSelectPlayingTeam(0)}
              className={`mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded cursor-pointer ${
                activePlayingTeamIdx === 0 ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Playing Turn
            </button>
          )}
        </div>

        {/* THE BANK (Accumulated Points) */}
        <div className="col-span-4 sm:col-span-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-300 uppercase block mb-0.5">
            THE BANK
          </span>
          <div className="bg-black/90 border-2 border-[#ffcc00] px-4 sm:px-8 py-1 sm:py-2 rounded-2xl shadow-inner flex items-center justify-center">
            <span className="font-mono text-3xl sm:text-5xl md:text-6xl font-black text-[#ffcc00] tracking-widest drop-shadow-[0_0_15px_rgba(255,204,0,0.4)]">
              {roundBank}
            </span>
          </div>
          {/* Multiplier Indicator */}
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              multiplier === 3
                ? 'bg-purple-600 text-white animate-pulse'
                : multiplier === 2
                ? 'bg-amber-500 text-[#02052c]'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {multiplier === 1 ? '1x Single Points' : multiplier === 2 ? '⚡ 2x Double Points' : '🔥 3x Triple Points'}
            </span>
          </div>
        </div>

        {/* Team 2 Score Podium */}
        <div className={`col-span-4 sm:col-span-3 rounded-xl p-2 sm:p-3 border-2 transition-all text-center ${
          activePlayingTeamIdx === 1
            ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400'
            : 'bg-slate-900/80 border-slate-700'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="text-sm sm:text-base">{team2.avatar || '⚡'}</span>
            <span className="font-bold text-white text-xs sm:text-sm truncate">{team2.name}</span>
          </div>
          <div className="font-mono text-2xl sm:text-4xl font-black text-[#ffcc00] tracking-wider drop-shadow">
            {team2.score}
          </div>
          {role === 'host' && (
            <button
              type="button"
              onClick={() => handleSelectPlayingTeam(1)}
              className={`mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded cursor-pointer ${
                activePlayingTeamIdx === 1 ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Playing Turn
            </button>
          )}
        </div>
      </div>

      {/* 2. ROUND QUESTION & STRIKES BAR */}
      <div className="bg-[#02052c] border-2 border-slate-700 rounded-xl p-3 sm:p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#ffcc00] text-[#02052c] rounded">
              Round {currentRoundIdx + 1} of {currentGame.rounds.length}
            </span>
            <span className="text-xs text-amber-300 font-semibold">{currentGame.title}</span>
          </div>
          <h2 className="font-jeopardy-serif text-base sm:text-xl md:text-2xl text-white font-bold tracking-wide">
            {currentRound.question}
          </h2>
        </div>

        {/* The 3 Strikes Boxes */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[1, 2, 3].map((strikeNum) => (
            <div
              key={strikeNum}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                strikes >= strikeNum
                  ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/50 scale-105'
                  : 'bg-black/50 border-slate-700 text-slate-700'
              }`}
            >
              <X className={`w-6 h-6 sm:w-8 sm:h-8 stroke-[3] ${strikes >= strikeNum ? 'text-white' : 'text-slate-700/50'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. THE ICONIC ANSWER BOARD (Dual Columns 1-8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-1">
        {currentRound.answers.map((ans, idx) => {
          const isRevealed = revealedAnswerIds.has(ans.id);

          return (
            <div
              key={ans.id || idx}
              onClick={() => role === 'host' && handleToggleAnswer(ans)}
              className={`relative min-h-[58px] sm:min-h-[66px] rounded-xl border-2 flex items-center justify-between px-3 sm:px-4 cursor-pointer select-none transition-all duration-300 shadow-md ${
                isRevealed
                  ? 'bg-gradient-to-r from-[#031569] via-[#0528b8] to-[#031569] border-[#ffcc00] shadow-blue-900/50 scale-[1.01]'
                  : 'bg-gradient-to-r from-slate-900 via-[#0a1242] to-slate-900 border-slate-700 hover:border-amber-400/60'
              }`}
            >
              {isRevealed ? (
                /* REVEALED ANSWER SLAT */
                <>
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-6 h-6 rounded-full bg-[#ffcc00] text-[#02052c] font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-jeopardy-display text-sm sm:text-base md:text-lg text-white font-bold tracking-wide uppercase truncate">
                      {ans.text}
                    </span>
                  </div>
                  <div className="bg-black/85 border border-[#ffcc00] rounded-lg px-2.5 sm:px-3 py-1 font-mono text-base sm:text-xl font-black text-[#ffcc00] shrink-0">
                    {ans.points}
                  </div>
                </>
              ) : (
                /* UNREVEALED SLAT (Mechanical number slat) */
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full border-2 border-amber-500/60 bg-black/60 text-amber-300 font-mono font-black text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {role === 'host' && (
                      <span className="text-[11px] text-slate-400 italic font-mono truncate max-w-[200px]">
                        {ans.text} ({ans.points})
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-7 rounded border border-slate-700 bg-black/40 flex items-center justify-center">
                    <span className="text-xs text-slate-600 font-mono">••</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. HOST CONTROLS BAR (Visible to Host or when Host Drawer is active) */}
      {role === 'host' && (
        <div className="bg-[#02052c] border border-amber-500/50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Strikes & Steal Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleAddStrike}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>Strike ({strikes}/3)</span>
            </button>
            <button
              type="button"
              onClick={handleResetStrikes}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg cursor-pointer"
            >
              Reset ❌
            </button>
            <button
              type="button"
              onClick={handleRevealAll}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reveal All</span>
            </button>
          </div>

          {/* Award Bank to Family 1 / Family 2 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAwardBank(0)}
              disabled={roundBank === 0}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg cursor-pointer disabled:opacity-40 flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5 text-[#ffcc00]" />
              <span>Award Bank ➔ {team1.name}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAwardBank(1)}
              disabled={roundBank === 0}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg cursor-pointer disabled:opacity-40 flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5 text-[#ffcc00]" />
              <span>Award Bank ➔ {team2.name}</span>
            </button>
          </div>

          {/* Round Selector & Bonus Game Launchers */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-black/60 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => handleSelectRound(Math.max(0, currentRoundIdx - 1))}
                disabled={currentRoundIdx === 0}
                className="p-1 hover:text-white text-slate-400 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs text-amber-300 font-bold">
                R{currentRoundIdx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleSelectRound(Math.min(currentGame.rounds.length - 1, currentRoundIdx + 1))}
                disabled={currentRoundIdx === currentGame.rounds.length - 1}
                className="p-1 hover:text-white text-slate-400 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Curated Game Theme Selector */}
            <select
              value={currentGame.id}
              onChange={(e) => handleSwitchGame(e.target.value)}
              className="bg-slate-900 border border-amber-500/50 text-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer max-w-[170px] truncate"
              title="Select Curated Game Night Theme"
            >
              {Object.entries(CURATED_FEUD_GAMES).map(([key, game]) => (
                <option key={key} value={key}>
                  {game.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowFastMoneyModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#02052c] font-black rounded-lg cursor-pointer shadow flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Fast Money</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAiFeudModal(true)}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffcc00]" />
              <span>AI Feud</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. TV POPUP: GIANT FLASHING STRIKE (❌) */}
      {showStrikeFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none animate-in fade-in zoom-in-75 duration-150">
          <div className="flex items-center gap-4">
            {Array.from({ length: strikes }).map((_, i) => (
              <div
                key={i}
                className="w-28 h-28 sm:w-44 sm:h-44 rounded-3xl bg-red-600 border-4 sm:border-8 border-white flex items-center justify-center shadow-[0_0_80px_rgba(239,68,68,0.9)] animate-bounce"
              >
                <X className="w-20 h-20 sm:w-32 sm:h-32 text-white stroke-[3.5]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showFastMoneyModal && (
        <FastMoneyModal
          questions={currentGame.fastMoney}
          teamName={team1.score >= team2.score ? team1.name : team2.name}
          role={role}
          onClose={() => setShowFastMoneyModal(false)}
          onAwardPoints={(pts) => {
            const winnerIdx = team1.score >= team2.score ? 0 : 1;
            const updated = [...teams];
            if (updated[winnerIdx]) {
              updated[winnerIdx].score += pts;
            }
            onUpdateTeams(updated);
          }}
        />
      )}

      {showAiFeudModal && (
        <AiFeudGeneratorModal
          onApplyFeudGame={(newGame) => {
            setCurrentGame(newGame);
            setCurrentRoundIdx(0);
            setRevealedAnswerIds(new Set());
            setRoundBank(0);
            setStrikes(0);
            gameSync.broadcast({ type: 'FEUD_APPLY_GAME', game: newGame });
          }}
          onClose={() => setShowAiFeudModal(false)}
        />
      )}
    </div>
  );
};
