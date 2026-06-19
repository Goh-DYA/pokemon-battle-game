import React, { useState, useEffect } from 'react';
import { Trophy, Flame, History, Sparkles, TrendingUp, XCircle, Award, Calendar, Skull, RefreshCw, Undo2 } from 'lucide-react';
import { getPokemonId } from '../data/pokemon';

export interface CampaignStats {
  currentWinStreak: number;
  currentLossStreak: number;
  bestWinStreak: number;
  totalAttempts: number;
  totalWins: number;
  totalLosses: number;
}

export interface CampaignHistoryEntry {
  id: string;
  date: string;
  pokemon: {
    name: string;
    types: string[];
  }[];
  outcome: 'WIN' | 'LOSS';
  stagesCleared: number; // e.g. 0 to 5
}

interface HallOfFameStatsProps {
  currentRoster?: { name: string; types: string[] }[];
  compact?: boolean;
}

export function HallOfFameStats({ currentRoster, compact = false }: HallOfFameStatsProps) {
  const [stats, setStats] = useState<CampaignStats>({
    currentWinStreak: 0,
    currentLossStreak: 0,
    bestWinStreak: 0,
    totalAttempts: 0,
    totalWins: 0,
    totalLosses: 0,
  });

  const [history, setHistory] = useState<CampaignHistoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Load stats and history on mount
  useEffect(() => {
    loadStatsAndHistory();
  }, []);

  const loadStatsAndHistory = () => {
    try {
      const savedStats = localStorage.getItem('poke_league_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      const savedHistory = localStorage.getItem('poke_league_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load local storage stats:", e);
    }
  };

  const resetAllStats = () => {
    try {
      localStorage.removeItem('poke_league_stats');
      localStorage.removeItem('poke_league_history');
      setStats({
        currentWinStreak: 0,
        currentLossStreak: 0,
        bestWinStreak: 0,
        totalAttempts: 0,
        totalWins: 0,
        totalLosses: 0,
      });
      setHistory([]);
      setShowConfirmReset(false);
    } catch (e) {
      console.error(e);
    }
  };

  const totalCompleted = stats.totalAttempts;
  const winRate = totalCompleted > 0 ? Math.round((stats.totalWins / totalCompleted) * 100) : 0;

  const filteredHistory = history.filter(item => {
    if (filter === 'win') return item.outcome === 'WIN';
    if (filter === 'loss') return item.outcome === 'LOSS';
    return true;
  });

  return (
    <div id="hof-stats-history-root" className="w-full space-y-6">
      
      {/* 1. Bento Dashboard of Local Storage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Win Rate */}
        <div id="stat-win-rate" className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-400">
            <TrendingUp className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">Success rate</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-400 font-sans">{winRate}%</span>
            <span className="text-xs text-zinc-500 font-mono">ratio</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
            {stats.totalWins} W / {stats.totalLosses} L
          </p>
        </div>

        {/* Current Active Streak */}
        <div id="stat-current-streak" className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-amber-500">
            <Flame className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">Active Streak</span>
          
          <div className="mt-2 flex items-baseline gap-1.5">
            {stats.currentWinStreak > 0 ? (
              <>
                <span className="text-3xl font-black text-amber-500 font-sans">+{stats.currentWinStreak}</span>
                <span className="text-xs text-amber-500/80 font-mono font-bold">WINS</span>
              </>
            ) : stats.currentLossStreak > 0 ? (
              <>
                <span className="text-3xl font-black text-red-500 font-sans">-{stats.currentLossStreak}</span>
                <span className="text-xs text-red-500/80 font-mono font-bold">LOSSES</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-zinc-400 font-sans">0</span>
                <span className="text-xs text-zinc-500 font-mono">neutral</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
            consecutive runs
          </p>
        </div>

        {/* Highest Championship Peak */}
        <div id="stat-peak-streak" className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-yellow-400 animate-pulse">
            <Trophy className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">Best streak</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-yellow-400 font-sans">{stats.bestWinStreak}</span>
            <span className="text-xs text-yellow-500/80 font-mono font-bold">WINS</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
            all-time high score
          </p>
        </div>

        {/* Total Runs Attempted */}
        <div id="stat-total-attempts" className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-zinc-400">
            <History className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">total campaigns</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-zinc-200 font-sans">{stats.totalAttempts}</span>
            <span className="text-xs text-zinc-500 font-mono">attempts</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
            completed matches
          </p>
        </div>

      </div>

      {/* 2. Previous Squads & History Timeline */}
      <div id="gameturns-history" className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-mono font-extrabold uppercase text-zinc-300 tracking-wider">Previous Campaigns Registry</h4>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850 text-[10px] font-mono">
              <button
                id="btn-filter-all"
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${filter === 'all' ? 'bg-red-650 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                ALL ({history.length})
              </button>
              <button
                id="btn-filter-win"
                type="button"
                onClick={() => setFilter('win')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${filter === 'win' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                WINS ({history.filter(h => h.outcome === 'WIN').length})
              </button>
              <button
                id="btn-filter-loss"
                type="button"
                onClick={() => setFilter('loss')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${filter === 'loss' ? 'bg-red-950/85 text-red-400 border border-red-900/60 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                LOSSES ({history.filter(h => h.outcome === 'LOSS').length})
              </button>
            </div>

            {/* Clear option */}
            {history.length > 0 && (
              <div className="relative">
                {!showConfirmReset ? (
                  <button
                    id="btn-trigger-reset-stats"
                    onClick={() => setShowConfirmReset(true)}
                    className="text-[10px] font-mono text-zinc-500 hover:text-red-400 underline decoration-dotted transition-colors hover:scale-102 flex items-center gap-1 cursor-pointer"
                  >
                    Reset Registry
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-zinc-950 border border-red-900/50 p-1.5 px-2 rounded-lg text-[9px] font-mono text-red-400 animate-fade-in shadow-xl absolute right-0 top-0 translate-y-[-100%] sm:relative sm:translate-y-0 z-30 whitespace-nowrap">
                    <span>Sure?</span>
                    <button
                      id="btn-confirm-reset-stats"
                      onClick={resetAllStats}
                      className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      CLEAR
                    </button>
                    <button
                      id="btn-cancel-reset-stats"
                      onClick={() => setShowConfirmReset(false)}
                      className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-zinc-700"
                    >
                      NO
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/45 border border-dashed border-zinc-850 rounded-xl">
            <Award className="w-8 h-8 text-zinc-600 mx-auto opacity-30 mt-1" />
            <span className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mt-3">No Campaign History Recorded</span>
            <p className="text-[10px] text-zinc-600 max-w-sm mx-auto leading-relaxed mt-1">
              Complete campaigns (win or lose) with your chosen teams to induct historical squads into this terminal!
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 select-none custom-scrollbar">
            {filteredHistory.map((entry, entryIdx) => {
              const isWin = entry.outcome === 'WIN';
              return (
                <div
                  key={entry.id || entryIdx}
                  className={`p-3 bg-zinc-950 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:scale-[1.01] ${
                    isWin ? 'border-emerald-950/40 hover:border-emerald-800/40' : 'border-zinc-900 hover:border-red-950/30'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded flex items-center gap-1 ${
                        isWin ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-red-950 text-red-400 border border-red-900/60'
                      }`}>
                        {isWin ? <Award className="w-3 h-3 text-emerald-400" /> : <Skull className="w-3 h-3 text-red-500" />}
                        {isWin ? 'Hall of Fame Champion' : `Failed at Stage ${entry.stagesCleared}`}
                      </span>

                      <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-zinc-600" />
                        {entry.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-zinc-500">Squad:</span>
                      <div className="flex flex-wrap gap-1">
                        {entry.pokemon.map((p, idx) => (
                          <div 
                            key={idx} 
                            style={{ contentVisibility: 'auto' }}
                            className="bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.5 rounded text-[9px] text-zinc-300 font-mono flex items-center gap-0.5 group/poke"
                          >
                            <span className="text-zinc-500 font-bold text-[8px]">0{idx+1}</span>
                            <span className="font-extrabold max-w-[65px] truncate">{p.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Team Sprites visualizer */}
                  <div className="flex -space-x-2 border-l border-zinc-900 pl-4 items-center gap-0.5 relative group">
                    {entry.pokemon.map((p, pIdx) => {
                      const cleaned = p.name.includes('Pikachu') ? 'Pikachu' : p.name;
                      const spriteId = getPokemonId(cleaned);
                      return (
                        <div key={pIdx} className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 overflow-hidden flex items-center justify-center relative hover:z-20 hover:scale-110 hover:border-amber-500/50 transition-all cursor-help" title={p.name}>
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`}
                            alt={p.name}
                            className="w-10 h-10 min-w-[40px] mt-1 object-cover select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
