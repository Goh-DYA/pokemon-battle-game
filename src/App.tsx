import React, { useState } from 'react';
import { GamePhase, ActivePokemon, Trainer } from './types';
import { BOSS_TRAINERS, instantiateBossTeam, CHALLENGE_SETS } from './data/league';
import { createActivePokemon, POKEMON_DATABASE, getPokemonId } from './data/pokemon';
import { TeamSelector } from './components/TeamSelector';
import { BattleScreen } from './components/BattleScreen';
import { Shield, Trophy, Swords, Sparkles, BookOpen, User, Flame, RefreshCw, Star, Info, Zap, AlertTriangle } from 'lucide-react';
import { AudioProvider } from './components/AudioContext';
import { HallOfFameStats } from './components/HallOfFameStats';
import { audio } from './utils/audio';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('WELCOME');
  const [activeSetId, setActiveSetId] = useState<string>('sinnoh');
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [playerRoster, setPlayerRoster] = useState<ActivePokemon[]>([]);
  const [showTypeChartHelp, setShowTypeChartHelp] = useState<boolean>(false);
  const [showRegistryDrawer, setShowRegistryDrawer] = useState<boolean>(false);

  const currentSet = CHALLENGE_SETS.find(s => s.id === activeSetId) || CHALLENGE_SETS[0];


  // Save victory to local storage
  const recordLeagueWin = (roster: ActivePokemon[]) => {
    try {
      const savedStats = localStorage.getItem('poke_league_stats');
      let stats = {
        currentWinStreak: 0,
        currentLossStreak: 0,
        bestWinStreak: 0,
        totalAttempts: 0,
        totalWins: 0,
        totalLosses: 0,
      };
      if (savedStats) {
        stats = { ...stats, ...JSON.parse(savedStats) };
      }
      
      const nextWinStreak = stats.currentWinStreak + 1;
      const nextBest = Math.max(stats.bestWinStreak, nextWinStreak);
      
      const updatedStats = {
        currentWinStreak: nextWinStreak,
        currentLossStreak: 0,
        bestWinStreak: nextBest,
        totalAttempts: stats.totalAttempts + 1,
        totalWins: stats.totalWins + 1,
        totalLosses: stats.totalLosses,
      };
      localStorage.setItem('poke_league_stats', JSON.stringify(updatedStats));

      const savedHistory = localStorage.getItem('poke_league_history') || '[]';
      const history = JSON.parse(savedHistory);
      const newEntry = {
        id: `win-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        pokemon: roster.map(p => ({ name: p.name, types: p.types })),
        outcome: 'WIN' as const,
        stagesCleared: currentSet.trainers.length,
      };
      localStorage.setItem('poke_league_history', JSON.stringify([newEntry, ...history]));
    } catch (e) {
      console.error("Failed to record league win:", e);
    }
  };

  // Save defeat to local storage
  const recordLeagueLoss = (roster: ActivePokemon[], stagesCleared: number) => {
    try {
      const savedStats = localStorage.getItem('poke_league_stats');
      let stats = {
        currentWinStreak: 0,
        currentLossStreak: 0,
        bestWinStreak: 0,
        totalAttempts: 0,
        totalWins: 0,
        totalLosses: 0,
      };
      if (savedStats) {
        stats = { ...stats, ...JSON.parse(savedStats) };
      }
      
      const nextLossStreak = stats.currentLossStreak + 1;
      
      const updatedStats = {
        currentWinStreak: 0,
        currentLossStreak: nextLossStreak,
        bestWinStreak: stats.bestWinStreak,
        totalAttempts: stats.totalAttempts + 1,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses + 1,
      };
      localStorage.setItem('poke_league_stats', JSON.stringify(updatedStats));

      const savedHistory = localStorage.getItem('poke_league_history') || '[]';
      const history = JSON.parse(savedHistory);
      const newEntry = {
        id: `loss-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        pokemon: roster.map(p => ({ name: p.name, types: p.types })),
        outcome: 'LOSS' as const,
        stagesCleared,
      };
      localStorage.setItem('poke_league_history', JSON.stringify([newEntry, ...history]));
    } catch (e) {
      console.error("Failed to record league loss:", e);
    }
  };

  // Triggered when a team of 6 pokemon is confirmed
  const handleSelectTeam = (pokemonNames: string[]) => {
    try {
      const activeTeam = pokemonNames.map(name => createActivePokemon(name));
      setPlayerRoster(activeTeam);
      setCurrentStageIdx(0);
      setPhase('LEAGUE_LOBBY');
    } catch (err) {
      console.error("Team selection error: ", err);
    }
  };

  // Triggered when match concludes with user victory
  const handleBattleVictory = (remainingTeam: ActivePokemon[]) => {
    // Retain remaining HP and status conditions for player team? 
    // The prompt says: "My team is fully healed between each Elite Four member."
    // So we fully heal them!
    const fullyHealedTeam = playerRoster.map(p => {
      const dbTemplate = POKEMON_DATABASE[p.name.includes('Pikachu') ? 'Pikachu' : p.name];
      const maxHp = dbTemplate ? (dbTemplate.hp * 2 + 110) : p.maxHp;
      return {
        ...p,
        hp: maxHp,
        maxHp: maxHp,
        status: 'Healthy' as const,
        statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
        moves: p.moves.map(m => ({ ...m, pp: m.maxPp })),
      };
    });

    setPlayerRoster(fullyHealedTeam);

    const nextIdx = currentStageIdx + 1;
    if (nextIdx >= currentSet.trainers.length) {
      // Completed Champion Cynthia! Go to Hall of Fame!
      recordLeagueWin(fullyHealedTeam);
      setPhase('HALL_OF_FAME');
    } else {
      setCurrentStageIdx(nextIdx);
      setPhase('LEAGUE_LOBBY');
    }
  };

  const handleBattleDefeat = () => {
    recordLeagueLoss(playerRoster, currentStageIdx);
    setPhase('DEFEAT');
  };

  const resetLeague = () => {
    setPlayerRoster([]);
    setCurrentStageIdx(0);
    setPhase('WELCOME');
  };

  const currentBoss = currentSet.trainers[currentStageIdx];

  return (
    <AudioProvider phase={phase}>
      <div id="app-root-container" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans selection:bg-red-500/30 selection:text-white">
      
      {/* Header and Brand Nav */}
      <header id="league-app-header" className="mt-4 px-4 max-w-7xl w-full mx-auto flex justify-between items-center pb-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="bg-red-650 p-1.5 rounded-lg shadow-md shadow-red-950/40">
            <Shield className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-display font-black text-xs md:text-sm tracking-wider uppercase text-zinc-100">Poke Championship League</span>
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Battle Simulator</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-registry"
            onClick={() => { setShowRegistryDrawer(prev => !prev); setShowTypeChartHelp(false); }}
            className={`flex items-center gap-1.5 text-[10px] md:text-xs border py-1.5 px-3 rounded-lg font-mono transition-transform active:scale-95 cursor-pointer ${
              showRegistryDrawer
                ? 'bg-yellow-950 border-yellow-800 text-yellow-400 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-850 text-zinc-300'
            }`}
          >
            <Trophy className={`w-3.5 h-3.5 ${showRegistryDrawer ? 'text-yellow-400' : 'text-zinc-400'}`} /> {showRegistryDrawer ? 'Close HOF Registry' : 'HOF Registry'}
          </button>

          <button
            id="btn-toggle-rules-guide"
            onClick={() => { setShowTypeChartHelp(prev => !prev); setShowRegistryDrawer(false); }}
            className={`flex items-center gap-1 text-[10px] md:text-xs border py-1.5 px-3 rounded-lg font-mono transition-transform active:scale-95 cursor-pointer ${
              showTypeChartHelp
                ? 'bg-red-950 border-red-900 text-red-400 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-850 text-zinc-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> {showTypeChartHelp ? 'Hide Elemental Guide' : 'Elemental Guide'}
          </button>
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-1 w-full flex items-center justify-center p-2 md:p-6 my-2 relative">
        
        {/* Dynamic HOF Registry Overlay Modal */}
        {showRegistryDrawer && (
          <div id="hof-registry-modal" className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
              <h3 className="font-display font-black text-xl text-yellow-405 mb-2 flex items-center gap-2">
                <Trophy className="text-yellow-400 w-5 h-5" /> Poke Championship Hall of Fame & Stats
              </h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Review your accumulated win-loss campaign history, active battle streaks, and legacy roster teams stored on this terminal database.
              </p>

              <HallOfFameStats />

              <button
                id="btn-close-registry"
                onClick={() => setShowRegistryDrawer(false)}
                className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                DISMISS DIRECTIVE
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Type Chart Overlay Modal */}
        {showTypeChartHelp && (
          <div id="type-chart-box" className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
              <h3 className="font-display font-black text-xl text-zinc-100 mb-2 flex items-center gap-2">
                <Flame className="text-red-500 w-5 h-5" /> Standard Type Matchups Rulebook
              </h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Matches are determined logically based on standard elemental advantages. Attackers dealing matching-type STAB gains 1.5x power. Immune matchups deal 0 damage.
              </p>

              {/* Grid Matchups Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-emerald-400 font-bold">🔥 Fire Specialty (Charizard)</span>
                  <ul className="text-[10px] text-zinc-400 list-disc list-inside mt-1.5 space-y-1">
                    <li>Super-effective against: <span className="text-zinc-200 font-semibold">Grass, Ice, Bug, Steel</span></li>
                    <li>Weakness against: <span className="text-zinc-200 font-semibold">Water, Ground, Rock</span></li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-sky-400 font-bold">💧 Water Specialty (Blastoise)</span>
                  <ul className="text-[10px] text-zinc-400 list-disc list-inside mt-1.5 space-y-1">
                    <li>Super-effective against: <span className="text-zinc-200 font-semibold">Fire, Ground, Rock</span></li>
                    <li>Weakness against: <span className="text-zinc-200 font-semibold">Grass, Electric</span></li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-emerald-500 font-bold">🌿 Grass Specialty (Venusaur)</span>
                  <ul className="text-[10px] text-zinc-400 list-disc list-inside mt-1.5 space-y-1">
                    <li>Super-effective against: <span className="text-zinc-200 font-semibold">Water, Ground, Rock</span></li>
                    <li>Weakness against: <span className="text-zinc-200 font-semibold">Fire, Ice, Flying, Poison, Bug</span></li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-amber-400 font-bold">⚡ Electric Specialty (Pikachu)</span>
                  <ul className="text-[10px] text-zinc-400 list-disc list-inside mt-1.5 space-y-1">
                    <li>Super-effective against: <span className="text-zinc-200 font-semibold">Water, Flying</span></li>
                    <li>Weakness against: <span className="text-zinc-200 font-semibold">Ground</span> (deals <span className="text-red-400">0 damage</span>)</li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-stone-400 font-bold">⛰️ Ground & Rock (Garchomp/Tyranitar)</span>
                  <ul className="text-[10px] text-zinc-400 list-disc list-inside mt-1.5 space-y-1">
                    <li>Super-effective against: <span className="text-zinc-200 font-semibold">Fire, Electric, Steel, Poison</span></li>
                    <li>Ground is immune to Electric, but Flying is immune to Ground!</li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-violet-400 font-bold">👻 Ghost & Psychic (Gengar/Gardevoir)</span>
                  <ul className="text-[10px] text-zinc-400 list-disc list-inside mt-1.5 space-y-1">
                    <li>Normal and Fighting type moves deal <span className="text-red-400">0 damage</span> to Ghosts!</li>
                    <li>Ghosts can bypass psychic barrier shields.</li>
                  </ul>
                </div>
              </div>

              <button
                id="btn-close-rules"
                onClick={() => setShowTypeChartHelp(false)}
                className="w-full mt-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono transition-colors"
              >
                DISMISS DIRECTIVE
              </button>
            </div>
          </div>
        )}

        {/* Phase Render Block */}
        {phase === 'WELCOME' && (
          <div id="welcome-container" className="w-full max-w-4xl text-center space-y-8 animate-fade-in py-10">
            <div className="space-y-4">
              <span className="text-xs font-mono tracking-[0.25em] uppercase text-red-500 bg-red-950/55 border border-red-900 px-4.5 py-1.5 rounded-full inline-block font-extrabold">
                CONSECUTIVE LEAGUE MODE
              </span>
              <h1 className="text-4xl md:text-7xl font-sans font-black tracking-tight mt-2 text-zinc-100">
                POKE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">CHAMPIONSHIP</span>
              </h1>
              <p className="text-sm md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Welcome, trainer, to the highest pinnacle of strategic combat. Before you lies the ultimate crucible: defeat the elite regional masters back-to-back without breaking the consecutive draft cycle.
              </p>
            </div>

            {/* League Challenge Selection Cards */}
            <div className="max-w-4xl mx-auto my-6">
              <h3 className="text-xs font-mono text-zinc-500 font-extrabold uppercase tracking-widest mb-4 text-center">
                Select Your League Challenge
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {CHALLENGE_SETS.map((set) => {
                  const isSelected = activeSetId === set.id;
                  return (
                    <div
                      key={set.id}
                      id={`challenge-set-${set.id}`}
                      onClick={() => { audio.playClick(); setActiveSetId(set.id); }}
                      className={`cursor-pointer p-6 rounded-3xl border transition-all duration-300 relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-900 border-red-500/80 shadow-xl shadow-red-950/20'
                          : 'bg-zinc-950/40 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full border uppercase ${
                            set.id === 'hoenn'
                              ? 'bg-blue-950/50 border-blue-900 text-blue-400'
                              : 'bg-red-950/50 border-red-900 text-red-400'
                          }`}>
                            {set.region} Region
                          </span>
                          <span className="text-zinc-500 text-xs font-mono font-bold">
                            {set.trainers.length} Stages
                          </span>
                        </div>
                        <h4 className="text-xl font-extrabold tracking-tight mt-3 text-zinc-100 font-sans group-hover:text-white transition-colors">
                          {set.name}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                          {set.description}
                        </p>
                      </div>

                      {/* Preview of Boss Avatars */}
                      <div className="mt-6 pt-4 border-t border-zinc-900/60 flex items-center justify-between">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {set.trainers.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-base shadow-md select-none"
                              title={t.name}
                            >
                              {t.avatarUrl}
                            </span>
                          ))}
                        </div>
                        <span className={`text-xs font-mono font-bold uppercase transition-colors ${
                          isSelected ? 'text-red-400 animate-pulse' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}>
                          {isSelected ? '✓ Selected' : 'Select League'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                id="btn-welcome-enter-lobby"
                onClick={() => { audio.playClick(); setPhase('TEAM_SELECT'); }}
                className="flex-1 bg-gradient-to-r from-red-650 to-red-550 hover:from-red-600 hover:to-red-500 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.03] shadow-lg shadow-red-950/40 text-sm tracking-wider font-mono cursor-pointer"
              >
                <Swords className="w-5 h-5" /> ASSEMBLE ADVENTURE SQUAD
              </button>
            </div>
          </div>
        )}

        {phase === 'TEAM_SELECT' && (
          <TeamSelector onSelectTeam={handleSelectTeam} />
        )}

        {phase === 'LEAGUE_LOBBY' && (
          <div id="lobby-container" className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl animate-fade-in shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-extrabold">Consecutive League Board</span>
                <h2 className="text-2xl font-black text-zinc-100 mt-1">Tournament League Headquarters</h2>
              </div>
              
              <div className="bg-zinc-950/80 px-4 py-2 rounded-xl flex items-center gap-3 border border-zinc-850 font-mono text-xs">
                <span className="text-zinc-500 uppercase font-black text-[10px]">Your Drafted Squad:</span>
                <div className="flex gap-1.5">
                  {playerRoster.map((p, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-block w-4 h-4 rounded-full text-center text-[10px] font-bold text-white ${
                        p.hp <= 0 ? 'bg-zinc-850 border border-zinc-700 opacity-30 line-through' : 'bg-red-500'
                      }`} 
                      title={p.name}
                    >
                      {idx + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* League Progression Board */}
            <div className="space-y-4">
              {currentSet.trainers.map((trainer, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;
                const isLocked = idx > currentStageIdx;

                return (
                  <div
                    key={trainer.name}
                    id={`league-stage-${idx}`}
                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      isCompleted 
                        ? 'bg-zinc-950/30 border-emerald-900/30 opacity-60' 
                        : isActive
                        ? 'bg-zinc-950 border-red-500/50 shadow-md shadow-red-950/10'
                        : 'bg-zinc-950/20 border-zinc-850 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar/Badge representation */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg select-none border ${
                        isCompleted ? 'bg-emerald-950/30 border-emerald-950 text-emerald-500' :
                        isActive ? 'bg-red-950/40 border-red-900 text-red-500 animate-pulse' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                      }`}>
                        {isCompleted ? '✅' : trainer.avatarUrl}
                      </div>

                      <div className="max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-500 font-extrabold uppercase">STAGE {idx + 1}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                            isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                            isActive ? 'bg-red-950 text-red-400 border border-red-900 animate-pulse' : 'bg-zinc-900 text-zinc-600'
                          }`}>
                            {trainer.specialtyType.toUpperCase()} SPECIALTY
                          </span>
                        </div>
                        <h4 className={`text-base md:text-lg font-extrabold tracking-tight mt-1 ${isCompleted ? 'text-zinc-400' : 'text-zinc-100'}`}>
                          {trainer.name}
                        </h4>
                        
                        {isActive && (
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-sans border-l-2 border-red-900 pl-3">
                            <span className="font-bold text-zinc-300">Teaser: </span>{trainer.teaser}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stage status indicator, button triggers battle teaser monologue */}
                    <div>
                      {isCompleted && (
                        <span className="font-mono text-xs text-emerald-500 font-extrabold tracking-wider bg-emerald-950/20 border border-emerald-950 px-3 py-1 rounded-lg">
                          DEFEATED
                        </span>
                      )}
                      {isLocked && (
                        <span className="font-mono text-xs text-zinc-500 font-extrabold tracking-wider">
                          LOCKED
                        </span>
                      )}
                      {isActive && (
                        <button
                          id={`btn-clash-lobby-${idx}`}
                          onClick={() => setPhase('TEASER')}
                          className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs md:text-sm py-2 px-5 rounded-xl font-mono tracking-wider hover:scale-102 transition-all flex items-center gap-1 cursor-pointer shadow-md"
                        >
                          CHALLENGE NOW <Swords className="w-4 h-4 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back options */}
            <div className="flex justify-between items-center text-xs text-zinc-50s border-t border-zinc-800 pt-4">
              <span className="text-zinc-500">Consecutive defeat resets entire board progress</span>
              <button
                id="btn-lobby-rebuild"
                onClick={resetLeague}
                className="text-red-400/85 hover:text-red-400 flex items-center gap-1 hover:underline transition-colors font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-draft Team from Scratch
              </button>
            </div>
          </div>
        )}

        {phase === 'TEASER' && (
          <div id="teaser-container" className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-8 rounded-3xl animate-fade-in shadow-2xl flex flex-col items-center text-center gap-6">
            <span className="text-[10px] font-mono bg-red-950/40 text-red-500 border border-red-900 px-3.5 py-1 rounded-full uppercase tracking-widest font-black">
              Arena Entrance
            </span>
            <div className="text-5xl my-2 select-none animate-bounce">{currentBoss.avatarUrl}</div>
            
            <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-sans font-black tracking-tight text-white">{currentBoss.name}</h2>
              <p className="text-xs text-red-400 font-mono tracking-wider font-extrabold uppercase">Regional {currentBoss.specialtyType} Specialization</p>
            </div>

            {/* Dialogue monologue box */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 text-zinc-305 max-w-lg italic font-sans relative">
              <div className="absolute -top-3 left-4 text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded">
                Dialogue Monologue
              </div>
              <p className="leading-relaxed text-sm">
                "{currentBoss.dialogue.intro}"
              </p>
            </div>

            <div className="flex gap-4 w-full max-w-sm mt-4">
              <button
                id="btn-teaser-back"
                onClick={() => setPhase('LEAGUE_LOBBY')}
                className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-bold py-3.5 px-6 rounded-xl border border-zinc-850 transition-all font-mono text-xs"
              >
                Retreat to Lobby
              </button>
              <button
                id="btn-teaser-clash"
                onClick={() => setPhase('BATTLE')}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3.5 px-6 rounded-xl shadow-lg hover:scale-102 transition-all font-mono text-xs tracking-wider"
              >
                CLASH NOW ⚔️
              </button>
            </div>
          </div>
        )}

        {phase === 'BATTLE' && (
          <BattleScreen
            trainer={currentBoss}
            initialPlayerTeam={playerRoster}
            onBattleVictory={handleBattleVictory}
            onBattleDefeat={handleBattleDefeat}
            onBackToLobby={() => setPhase('LEAGUE_LOBBY')}
          />
        )}

        {phase === 'DEFEAT' && (
          <div id="defeat-container" className="w-full max-w-xl bg-zinc-900 border border-zinc-805 p-8 rounded-3xl animate-fade-in shadow-2xl flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 bg-red-950/40 border border-red-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-sans font-black tracking-tight text-red-500">CHAMPIONSHIP RUN TERMINATED</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono font-bold">Championship Registry Terminated</p>
            </div>

            <p className="text-zinc-405 text-xs md:text-sm leading-relaxed max-w-md">
              Challenger, your consecutive battles streak was broken at <span className="font-bold text-zinc-100">{currentBoss.name}</span>. You must return, re-evaluate types compatibility, and assemble another roster team to attempt the legendary league challenge.
            </p>

            <button
              id="btn-defeat-retry"
              onClick={resetLeague}
              className="w-full max-w-xs mt-2 bg-red-650 hover:bg-red-550 text-white font-black py-3 px-6 rounded-xl transition-all hover:scale-102 font-mono text-xs tracking-widest shadow-lg"
            >
              ASSEMBLE NEW SQUAD ⚔️
            </button>
          </div>
        )}

        {phase === 'HALL_OF_FAME' && (
          <div id="hof-container" className="w-full max-w-4xl bg-zinc-900 border border-yellow-800/45 p-8 md:p-12 rounded-3xl animate-fade-in shadow-2xl flex flex-col items-center text-center gap-8 relative overflow-hidden">
            
            {/* Shining overlay */}
            <div className="absolute -inset-x-20 top-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-yellow-950/40 border border-yellow-805 p-3 rounded-full animate-bounce">
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
              </div>
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-yellow-500 font-extrabold block">
                ⭐ Poke Championship Hall of Fame ⭐
              </span>
              <h1 className="text-3xl md:text-6xl font-sans font-black tracking-tight text-white mt-1">
                LEAGUE CHAMPION
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Your tactical genius and sync partner bonds have conquered {currentSet.trainers.length} consecutive high-tier trainer matches, beating the regional Elite Four and {activeSetId === 'hoenn' ? 'Champions Steven & Wallace' : 'Champion Cynthia herself'}!
              </p>
            </div>

            {/* Champion Team representation */}
            <div className="w-full">
              <h3 className="text-xs font-mono text-zinc-500 font-extrabold uppercase tracking-widest pb-2 border-b border-zinc-800 mb-4">Inducted Team Roster</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {playerRoster.map((poke, index) => {
                  const cleanedName = poke.name.includes('Pikachu') ? 'Pikachu' : poke.name;
                  const spriteId = getPokemonId(cleanedName);
                  return (
                    <div
                      key={poke.name}
                      className="p-3.5 bg-zinc-950 border border-yellow-950/40 rounded-2xl flex flex-col items-center text-center relative hover:border-yellow-500/25 transition-all group select-none"
                    >
                      <div className="w-2 h-2 rounded-full bg-yellow-500 absolute top-2 right-2 shadow-md shadow-yellow-500/50" />
                      <span className="font-mono text-[9px] text-zinc-500">NO. 0{index + 1}</span>
                      
                      {/* Rich graphics artwork */}
                      <img 
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spriteId}.png`}
                        alt={poke.name}
                        className="w-16 h-16 object-contain filter drop-shadow hover:scale-110 transition-transform duration-300 my-2"
                        referrerPolicy="no-referrer"
                      />

                      <div className="font-extrabold text-xs text-zinc-200 mt-1 truncate max-w-full">{poke.name.split(' ')[0]}</div>
                      
                      <div className="flex gap-1 mt-1.5">
                        {poke.types.map(t => (
                          <span key={t} className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold">{t}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full border-t border-zinc-800/85 pt-6 mt-2 text-left">
              <span className="text-[10px] uppercase font-mono font-black text-yellow-500 tracking-widest block mb-4">🏆 Championship Stats & Records</span>
              <HallOfFameStats />
            </div>

            <div className="border-t border-zinc-800 w-full pt-6 flex flex-col md:flex-row gap-4 justify-center items-center">
              <span className="text-xs font-mono text-zinc-500">Championship registry recorded: {new Date().toLocaleDateString()}</span>
              <button
                id="btn-hof-restart"
                onClick={resetLeague}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 px-8 rounded-xl font-mono text-xs tracking-wider transition-all hover:scale-102 flex items-center gap-2 cursor-pointer shadow-lg shadow-yellow-950/20"
              >
                <RefreshCw className="w-3.5 h-3.5 text-black font-bold" /> START NEW CHAMPIONSHIP RUN
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer credits */}
      <footer id="league-app-footer" className="mb-4 text-center text-[10px] font-mono text-zinc-650 max-w-7xl w-full mx-auto border-t border-zinc-900 pt-3 flex flex-col md:flex-row justify-between gap-2 px-4">
        <span>© 2026 Poke Championship League Command. Built with standard type effectiveness metrics.</span>
        <span>Developer Session: Active • Local Time: 2026-06-18</span>
      </footer>

      </div>
    </AudioProvider>
  );
}
