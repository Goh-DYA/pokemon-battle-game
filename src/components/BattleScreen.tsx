import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivePokemon, Trainer, Move, BattleLog, StatusCondition } from '../types';
import { calculateDamage, getModifiedSpeed, makeId, DamageResult, getTypeEffectivenessMultiplier } from '../utils/combat';
import { MOVES_DATABASE } from '../data/moves';
import { Shield, Sparkles, Award, RotateCcw, AlertTriangle, ArrowLeftRight, Heart, Zap, Terminal, Volume2, VolumeX, Scroll, X, Filter } from 'lucide-react';
import { getPokemonId, getPokemonSpriteUrls } from '../data/pokemon';
import { useAudio } from './AudioContext';
import { ConfettiCelebration } from './ConfettiCelebration';

interface BattleScreenProps {
  trainer: Trainer;
  initialPlayerTeam: ActivePokemon[];
  onBattleVictory: (remainingTeam: ActivePokemon[]) => void;
  onBattleDefeat: () => void;
  onBackToLobby: () => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function BattleScreen({
  trainer,
  initialPlayerTeam,
  onBattleVictory,
  onBattleDefeat,
  onBackToLobby,
}: BattleScreenProps) {
  // Battle state
  const [playerTeam, setPlayerTeam] = useState<ActivePokemon[]>([]);
  const [opponentTeam, setOpponentTeam] = useState<ActivePokemon[]>([]);
  
  const [activePlayerIdx, setActivePlayerIdx] = useState<number>(0);
  const [activeOpponentIdx, setActiveOpponentIdx] = useState<number>(0);

  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isForceSwitching, setIsForceSwitching] = useState<boolean>(false);
  const [isSwitchingOpen, setIsSwitchingOpen] = useState<boolean>(false);
  const [battleEnded, setBattleEnded] = useState<boolean>(false);
  const [battleWinner, setBattleWinner] = useState<'player' | 'opponent' | null>(null);

  // Elite 4 Item counter (they get 1 Max Potion per fight!)
  const [enemyPotionUsed, setEnemyPotionUsed] = useState<boolean>(false);
  const [playerPotionsLeft, setPlayerPotionsLeft] = useState<number>(2); // player gets 2 items per match

  const [showFullLogOverlay, setShowFullLogOverlay] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<'all' | 'action' | 'damage' | 'stat-change'>('all');

  const {
    isMuted: isSoundMuted,
    toggleMute: toggleSound,
    playAttack,
    playHit,
    playFaint,
    playSwitch,
    playHeal,
    playVictoryFanfare,
    stopBgm,
    playClick,
  } = useAudio();

  // Animated sound and keyframe triggers
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'hit-super' | 'faint' | 'switch'>('idle');
  const [opponentAnim, setOpponentAnim] = useState<'idle' | 'attack' | 'hit' | 'hit-super' | 'faint' | 'switch'>('idle');
  const [arenaShake, setArenaShake] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Sync SFX sounds to Player State Animations
  useEffect(() => {
    if (playerAnim === 'attack') {
      playAttack();
    } else if (playerAnim === 'hit') {
      playHit(1.0);
    } else if (playerAnim === 'hit-super') {
      playHit(2.0);
    } else if (playerAnim === 'faint') {
      playFaint();
    } else if (playerAnim === 'switch') {
      playSwitch();
    }
  }, [playerAnim, playAttack, playHit, playFaint, playSwitch]);

  // Sync SFX sounds to Opponent State Animations
  useEffect(() => {
    if (opponentAnim === 'attack') {
      playAttack();
    } else if (opponentAnim === 'hit') {
      playHit(1.0);
    } else if (opponentAnim === 'hit-super') {
      playHit(2.0);
    } else if (opponentAnim === 'faint') {
      playFaint();
    } else if (opponentAnim === 'switch') {
      playSwitch();
    }
  }, [opponentAnim, playAttack, playHit, playFaint, playSwitch]);

  // Control victory fanfare and stop loops on final results
  useEffect(() => {
    if (battleWinner === 'player') {
      stopBgm();
      playVictoryFanfare();
    } else if (battleWinner === 'opponent') {
      stopBgm();
    }
  }, [battleWinner, stopBgm, playVictoryFanfare]);

  const [opSpriteSrc, setOpSpriteSrc] = useState<string>('');
  const [plSpriteSrc, setPlSpriteSrc] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Refs to prevent stale closures in async turn execution
  const playerTeamRef = useRef(playerTeam);
  const opponentTeamRef = useRef(opponentTeam);
  const activePlayerIdxRef = useRef(activePlayerIdx);
  const activeOpponentIdxRef = useRef(activeOpponentIdx);
  const enemyPotionUsedRef = useRef(enemyPotionUsed);

  useEffect(() => { playerTeamRef.current = playerTeam; }, [playerTeam]);
  useEffect(() => { opponentTeamRef.current = opponentTeam; }, [opponentTeam]);
  useEffect(() => { activePlayerIdxRef.current = activePlayerIdx; }, [activePlayerIdx]);
  useEffect(() => { activeOpponentIdxRef.current = activeOpponentIdx; }, [activeOpponentIdx]);
  useEffect(() => { enemyPotionUsedRef.current = enemyPotionUsed; }, [enemyPotionUsed]);

  const activePlayer = playerTeam[activePlayerIdx];
  const activeOpponent = opponentTeam[activeOpponentIdx];

  useEffect(() => {
    if (activeOpponent) {
      const ops = getPokemonSpriteUrls(activeOpponent.name);
      setOpSpriteSrc(ops.frontAnimated);
    }
  }, [activeOpponent?.name]);

  useEffect(() => {
    if (activePlayer) {
      const pls = getPokemonSpriteUrls(activePlayer.name);
      setPlSpriteSrc(pls.backAnimated);
    }
  }, [activePlayer?.name]);

  // Initialize teams
  useEffect(() => {
    // Deep clone teams to avoid mutating previous matches
    const cloneTeam = (team: ActivePokemon[]): ActivePokemon[] => {
      return team.map(p => ({
        ...p,
        statStages: { ...p.statStages },
        moves: p.moves.map(m => ({ ...m })),
      }));
    };

    const initialOpponentTeam = trainer.team.map((template) => {
      const maxHpScaled = template.hp * 2 + 110;
      return {
        name: template.name,
        types: template.types,
        maxHp: maxHpScaled,
        hp: maxHpScaled,
        attack: template.attack,
        defense: template.defense,
        spAttack: template.spAttack,
        spDefense: template.spDefense,
        speed: template.speed,
        moves: template.moves.map(mkey => {
          // get move template
          const dbVal = MOVES_DATABASE[mkey];
          return {
            name: mkey,
            type: dbVal?.type || 'Normal',
            category: dbVal?.category || 'Physical',
            power: dbVal?.power || 0,
            accuracy: dbVal?.accuracy || 100,
            pp: dbVal?.maxPp || 10,
            maxPp: dbVal?.maxPp || 10,
            description: dbVal?.description || '',
            effect: dbVal?.effect,
          };
        }),
        spriteUrl: template.spriteUrl,
        colorTheme: template.colorTheme,
        status: 'Healthy' as StatusCondition,
        statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      };
    });

    setPlayerTeam(cloneTeam(initialPlayerTeam));
    setOpponentTeam(initialOpponentTeam);
    setActivePlayerIdx(0);
    setActiveOpponentIdx(0);
    setEnemyPotionUsed(false);
    setPlayerPotionsLeft(2);
    setBattleEnded(false);
    setBattleWinner(null);

    // Initial Logs
    const introLogs: BattleLog[] = [
      { id: makeId(), text: `🏟️ CHALLENGE COMMENCED: You entered the battle arena against ${trainer.name}!`, type: 'system' },
      { id: makeId(), text: `💬 ${trainer.name}: "${trainer.dialogue.intro}"`, type: 'status' },
      { id: makeId(), text: `🔴 ${trainer.name} sent out ${initialOpponentTeam[0].name}!`, type: 'action' },
      { id: makeId(), text: `🟢 Go! ${initialPlayerTeam[0].name}!`, type: 'action' },
    ];
    setLogs(introLogs);
  }, [trainer, initialPlayerTeam]);

  // Autoscroll logs (newest at top, scroll to top)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const addLog = (text: string, type: BattleLog['type']) => {
    setLogs(prev => [...prev, { id: makeId(), text, type }]);
  };

  // Switch player pokemon
  const executePlayerSwitch = async (targetIdx: number) => {
    if (playerTeam[targetIdx].hp <= 0 || isAnimating) return;

    setIsAnimating(true);
    const oldName = activePlayer.name;
    const newName = playerTeam[targetIdx].name;

    // Reset stat stages of the switched out pokemon
    const updatedTeam = [...playerTeam];
    updatedTeam[activePlayerIdx] = {
      ...activePlayer,
      statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    };

    setPlayerTeam(updatedTeam);
    setActivePlayerIdx(targetIdx);
    setIsSwitchingOpen(false);

    setPlayerAnim('switch');
    setLogs(prev => [...prev, { id: makeId(), text: `🔄 Player withdrew ${oldName} and sent out ${newName}!`, type: 'system' }]);

    await sleep(500);
    setPlayerAnim('idle');

    // If it was a forced switch because of faint, turn ends immediately and opponent doesn't attack
    if (isForceSwitching) {
      setIsForceSwitching(false);
      setLogs(prev => [...prev, { id: makeId(), text: `🛡️ ${newName} entered the field ready for battle!`, type: 'system' }]);
      setIsAnimating(false);
      return;
    }

    // Otherwise, opponent gets a free turn since switching took player's turn priority!
    await executeOpponentTurnOnlyAsync(targetIdx, false);
    setIsAnimating(false);
  };

  // Generate flavorful description of the move clash
  const generateFlavorText = (attackerName: string, defenderName: string, move: Move, result: DamageResult): string => {
    const isSuper = result.effectiveness > 1;
    const isNotVery = result.effectiveness > 0 && result.effectiveness < 1;
    const isImmune = result.effectiveness === 0;

    let effPhrase = '';
    if (isSuper) effPhrase = 'It is super effective!';
    if (isNotVery) effPhrase = 'It is not very effective...';
    if (isImmune) effPhrase = 'It has no effect! The attack was completely absorbed...';

    const critPhrase = result.isCrit ? ' A critical hit! ' : ' ';

    if (move.power === 0) {
      if (move.name === 'Calm Mind') {
        return `${attackerName} closes its eyes, centering its internal mystic current. Its mental defenses and aura glow intensely!`;
      }
      if (move.name === 'Swords Dance') {
        return `${attackerName} spins fiercely, elevating an absolute fighting aura that sharpens its blade appendages!`;
      }
      if (move.name === 'Iron Defense') {
        return `${attackerName} hardens its skin with metallic armor plating, reflecting the arena lights!`;
      }
      if (move.name === 'Recover') {
        return `${attackerName} concentrates its bio-physical waves, rapidly rebuilding vital cells!`;
      }
      if (move.name === 'Will-O-Wisp') {
        return `${attackerName} casts a halo of haunting spirit-lantern flames towards ${defenderName}!`;
      }
      if (move.name === 'Thunder Wave') {
        return `${attackerName} discharges a subtle network of high-voltage rings that bind ${defenderName}'s muscles!`;
      }
      if (move.name === 'Toxic') {
        return `${attackerName} secretes a concentrated dark venomous spray, infecting ${defenderName} directly!`;
      }
      return `${attackerName} performs ${move.name}.`;
    }

    // Damage moves templates
    switch (move.type) {
      case 'Fire':
        return `${attackerName} releases a roaring storm of pure combustion! ${move.name} strikes ${defenderName}.${critPhrase}${effPhrase}`;
      case 'Water':
        return `${attackerName} releases high-pressure, surging torrents of absolute hydro power directly onto ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Grass':
        return `${attackerName} calls upon nature, whipping razor-sharp leaves and vines of organic energy at ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Electric':
        return `${attackerName} crackles with raw static energy before unleashing a massive thunderbolt strike on ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Ice':
        return `${attackerName} exhales a draft of deep absolute-zero temperature. Frost crystals freeze the battlefield and batter ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Fighting':
        return `${attackerName} rushes forward, delivering a barrage of high-voltage physical strikes on ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Ground':
        return `${attackerName} causes the stadium plates to split and rumble! A violent Earthquake craters beneath ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Dragon':
        return `${attackerName} channels draconic ancient spirits, unleashing a blast of emerald kinetic fire against ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Psychic':
        return `${attackerName} focuses its pure psychic aura, projecting absolute telekinetic pressure straight at ${defenderName}'s mind!${critPhrase}${effPhrase}`;
      case 'Fairy':
        return `${attackerName} summons a gorgeous pink-hued lunar blast of starlight energy to shatter ${defenderName}'s defenses!${critPhrase}${effPhrase}`;
      case 'Steel':
        return `${attackerName} focuses metal light energy and projects a metallic flash cannon at ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Ghost':
        return `${attackerName} materializes spectral dark matter, hurling a haunting orb directly through ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Rock':
        return `${attackerName} launches massive boulders and sharp crags, hammering ${defenderName}'s physical shell!${critPhrase}${effPhrase}`;
      case 'Poison':
        return `${attackerName} hurls corrosive sludge right at ${defenderName}, eating away at its defenses!${critPhrase}${effPhrase}`;
      case 'Dark':
        return `${attackerName} projects an aura of absolute dark thoughts and night waves that crash into ${defenderName}!${critPhrase}${effPhrase}`;
      case 'Bug':
        return `${attackerName} vibrates its wings at infinite speed, producing a high-frequency acoustic shockwave against ${defenderName}!${critPhrase}${effPhrase}`;
      default:
        return `${attackerName} executes a strong ${move.name} collision right against ${defenderName}!${critPhrase}${effPhrase}`;
    }
  };

  interface CombatContext {
    localPlayerTeam: ActivePokemon[];
    localOpponentTeam: ActivePokemon[];
    localActivePlayerIdx: number;
    localActiveOpponentIdx: number;
    commit: (newLogs?: { text: string; type: BattleLog['type'] }[]) => void;
  }

  const performAttack = async (
    attackerIsPlayer: boolean,
    move: Move,
    ctx: CombatContext
  ) => {
    let attacker = attackerIsPlayer ? ctx.localPlayerTeam[ctx.localActivePlayerIdx] : ctx.localOpponentTeam[ctx.localActiveOpponentIdx];
    let defender = attackerIsPlayer ? ctx.localOpponentTeam[ctx.localActiveOpponentIdx] : ctx.localPlayerTeam[ctx.localActivePlayerIdx];

    if (attacker.hp <= 0 || defender.hp <= 0) return;

    const logsToAppend: { text: string; type: BattleLog['type'] }[] = [];

    // Check status condition paralysis/sleep etc.
    let canAttack = checkStatusBlockAction(attacker, logsToAppend);
    if (!canAttack) {
      ctx.commit(logsToAppend);
      await sleep(600);
      return;
    }

    // Log the move call immediately
    logsToAppend.push({
      text: `⚔️ ${attacker.name} called ${move.name}!`,
      type: 'action'
    });
    ctx.commit(logsToAppend);

    // Start attacker animation
    if (attackerIsPlayer) {
      setPlayerAnim('attack');
    } else {
      setOpponentAnim('attack');
    }

    // Wait for attack animation strike (about 300ms)
    await sleep(300);

    // Reset attacker animation to idle
    if (attackerIsPlayer) {
      setPlayerAnim('idle');
    } else {
      setOpponentAnim('idle');
    }

    // Calculate damage and other effects
    const result = calculateDamage(attacker, defender, move);
    const moveLogs: { text: string; type: BattleLog['type'] }[] = [];

    // Flavor text
    const flavor = generateFlavorText(attacker.name, defender.name, move, result);
    moveLogs.push({ text: flavor, type: result.effectiveness > 1 ? 'super-effective' : result.effectiveness === 0 ? 'ineffective' : 'damage' });

    // Apply damage
    if (move.power > 0) {
      defender.hp = Math.max(0, defender.hp - result.damage);
      moveLogs.push({
        text: `💥 ${defender.name} lost ${result.damage} HP (${Math.round((result.damage / defender.maxHp) * 100)}%).`,
        type: 'damage'
      });

      // Giga Drain siphoning heal
      if (move.effect?.hasRecover) {
        const drained = Math.round(result.damage * 0.5);
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + drained);
        moveLogs.push({
          text: `🌱 ${attacker.name} drained strength and restored ${drained} HP!`,
          type: 'heal'
        });
      }
    } else if (move.effect?.hasRecover) {
      const restoreAmount = Math.round(attacker.maxHp * 0.5);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + restoreAmount);
      moveLogs.push({
        text: `➕ ${attacker.name} restored ${restoreAmount} HP!`,
        type: 'heal'
      });
    }

    // Handle stat modifications
    if (move.effect?.stat) {
      const statName = move.effect.stat;
      const stages = move.effect.stages || 0;
      const side = move.effect.type || 'self';

      const target = side === 'self' ? attacker : defender;
      const currentStage = target.statStages[statName];
      const nextStage = Math.max(-6, Math.min(6, currentStage + stages));

      target.statStages[statName] = nextStage;

      const scaleWord = Math.abs(stages) >= 2 ? 'sharply rose!' : 'rose!';
      const scaleDropWord = Math.abs(stages) >= 2 ? 'sharply fell...' : 'fell...';
      const changeWord = stages > 0 ? scaleWord : scaleDropWord;

      moveLogs.push({
        text: `📈 ${target.name}'s ${statName.toUpperCase()} ${changeWord} (Stage ${nextStage > 0 ? '+' : ''}${nextStage})`,
        type: 'stat-change'
      });
    }

    // Secondary Close combat drops
    if (move.name === 'Close Combat') {
      attacker.statStages.defense = Math.max(-6, attacker.statStages.defense - 1);
      attacker.statStages.spDefense = Math.max(-6, attacker.statStages.spDefense - 1);
      moveLogs.push({
        text: `📉 Close Combat recoil! ${attacker.name}'s DEFENSE and SP. DEFENSE fell!`,
        type: 'stat-change'
      });
    }

    // Handle Status conditions inflations
    if (move.effect?.status && defender.hp > 0) {
      const chance = move.effect.chance || 1.0;
      if (Math.random() <= chance) {
        if (defender.status === 'Healthy') {
          const condition = move.effect.status;
          const isImmune = (condition === 'Burn' && defender.types.includes('Fire')) ||
                           (condition === 'Poison' && (defender.types.includes('Poison') || defender.types.includes('Steel')));

          if (isImmune) {
            moveLogs.push({
              text: `🛡️ ${defender.name} is immune to ${condition}!`,
              type: 'system'
            });
          } else {
            defender.status = condition;
            const sym = condition === 'Burn' ? '🔥' : condition === 'Paralysis' ? '⚡' : '☣️';
            moveLogs.push({
              text: `${sym} ${defender.name} was inflicted with ${condition.toUpperCase()}!`,
              type: 'status'
            });
          }
        }
      }
    }

    // Now trigger the hit animation on the defender
    const isSuper = result.effectiveness > 1;
    if (attackerIsPlayer) {
      setOpponentAnim(isSuper ? 'hit-super' : 'hit');
    } else {
      setPlayerAnim(isSuper ? 'hit-super' : 'hit');
    }

    if (isSuper) {
      setArenaShake(true);
      setTimeout(() => setArenaShake(false), 500);
    }

    // Update state with new HP, stat modifications, etc.
    ctx.commit(moveLogs);

    // Wait for hit animation to play
    await sleep(isSuper ? 500 : 400);

    // Reset hit animation
    if (attackerIsPlayer) {
      setOpponentAnim('idle');
    } else {
      setPlayerAnim('idle');
    }
  };

  const applyEndOfTurnStatusDamageAsync = async (
    pokeIsPlayer: boolean,
    ctx: CombatContext
  ) => {
    let poke = pokeIsPlayer ? ctx.localPlayerTeam[ctx.localActivePlayerIdx] : ctx.localOpponentTeam[ctx.localActiveOpponentIdx];
    if (poke.hp <= 0) return;

    const logsToAppend: { text: string; type: BattleLog['type'] }[] = [];
    let damaged = false;

    if (poke.status === 'Poison') {
      const poisonDmg = Math.round(poke.maxHp / 8);
      poke.hp = Math.max(0, poke.hp - poisonDmg);
      logsToAppend.push({
        text: `☣️ ${poke.name} takes damage from Poison! (-${poisonDmg} HP)`,
        type: 'damage'
      });
      damaged = true;
    } else if (poke.status === 'Burn') {
      const burnDmg = Math.round(poke.maxHp / 16);
      poke.hp = Math.max(0, poke.hp - burnDmg);
      logsToAppend.push({
        text: `🔥 ${poke.name} takes damage from its Burn! (-${burnDmg} HP)`,
        type: 'damage'
      });
      damaged = true;
    }

    if (damaged) {
      if (pokeIsPlayer) {
        setPlayerAnim('hit');
      } else {
        setOpponentAnim('hit');
      }

      ctx.commit(logsToAppend);
      await sleep(400);

      if (pokeIsPlayer) {
        setPlayerAnim('idle');
      } else {
        setOpponentAnim('idle');
      }
    }
  };

  const checkTurnEndFaintsAsync = async (
    ctx: CombatContext
  ) => {
    let currentP = ctx.localPlayerTeam[ctx.localActivePlayerIdx];
    let currentO = ctx.localOpponentTeam[ctx.localActiveOpponentIdx];

    // 1. Did player's active pokemon faint?
    if (currentP.hp <= 0 && playerAnim !== 'faint') {
      setPlayerAnim('faint');
      const faintLogs = [{ text: `💀 ${currentP.name} has fainted!`, type: 'faint' as const }];
      ctx.commit(faintLogs);
      await sleep(500);

      const hasAliveLeft = ctx.localPlayerTeam.some(p => p.hp > 0);
      if (!hasAliveLeft) {
        setBattleWinner('opponent');
        setBattleEnded(true);
        const defeatLogs = [{ text: `😭 All of your partners have fainted! You lost the match to ${trainer.name}...`, type: 'system' as const }];
        ctx.commit(defeatLogs);
        return true; // battle ended
      } else {
        setIsForceSwitching(true);
        setIsSwitchingOpen(true);
        const switchLogs = [{ text: `⚠️ You must switch out to an active Pokémon to continue battling!`, type: 'system' as const }];
        ctx.commit(switchLogs);
        return true; // halted, must switch
      }
    }

    // 2. Did opponent's active pokemon faint?
    if (currentO.hp <= 0 && opponentAnim !== 'faint') {
      setOpponentAnim('faint');
      const faintLogs = [{ text: `💥 ${trainer.name}'s ${currentO.name} has fainted!`, type: 'faint' as const }];
      ctx.commit(faintLogs);
      await sleep(500);

      const aliveEnemyIdx = ctx.localOpponentTeam.findIndex(p => p.hp > 0);
      if (aliveEnemyIdx === -1) {
        setBattleWinner('player');
        setBattleEnded(true);
        const victoryLogs = [
          { text: `🎉 VICTORY! You defeated all 6 of ${trainer.name}'s Pokémon!`, type: 'system' as const },
          { text: `💬 ${trainer.name}: "${trainer.dialogue.defeat}"`, type: 'status' as const }
        ];
        ctx.commit(victoryLogs);
        return true; // battle ended
      } else {
        ctx.localActiveOpponentIdx = aliveEnemyIdx;
        setOpponentAnim('switch');
        const nextOpponent = ctx.localOpponentTeam[aliveEnemyIdx];
        const switchLogs = [{ text: `🔴 ${trainer.name} sent out ${nextOpponent.name}!`, type: 'action' as const }];
        ctx.commit(switchLogs);
        await sleep(500);
        setOpponentAnim('idle');
      }
    }
    return false;
  };

  // Perform a full combat round (Both player and opponent move)
  const executeCombatRound = async (playerMove: Move) => {
    if (battleEnded || isForceSwitching || isAnimating) return;

    setIsAnimating(true);

    // Create local copies to track states during async steps
    let localPlayerTeam = playerTeamRef.current.map(p => ({
      ...p,
      statStages: { ...p.statStages },
      moves: p.moves.map(m => ({ ...m })),
    }));
    let localOpponentTeam = opponentTeamRef.current.map(p => ({
      ...p,
      statStages: { ...p.statStages },
      moves: p.moves.map(m => ({ ...m })),
    }));

    const ctx = {
      localPlayerTeam,
      localOpponentTeam,
      localActivePlayerIdx: activePlayerIdxRef.current,
      localActiveOpponentIdx: activeOpponentIdxRef.current,
      commit: (newLogs: { text: string; type: BattleLog['type'] }[] = []) => {
        setPlayerTeam([...ctx.localPlayerTeam]);
        setOpponentTeam([...ctx.localOpponentTeam]);
        setActivePlayerIdx(ctx.localActivePlayerIdx);
        setActiveOpponentIdx(ctx.localActiveOpponentIdx);
        if (newLogs.length > 0) {
          setLogs(prev => [...prev, ...newLogs.map(l => ({ id: makeId(), text: l.text, type: l.type }))]);
        }
      }
    };

    // 1. Decrement PP of player move
    let currentP = ctx.localPlayerTeam[ctx.localActivePlayerIdx];
    const moveIdx = currentP.moves.findIndex(m => m.name === playerMove.name);
    if (moveIdx !== -1) {
      currentP.moves[moveIdx].pp = Math.max(0, currentP.moves[moveIdx].pp - 1);
    }
    ctx.commit();

    // AI Action choice
    const aiAction = chooseAIChoice(
      ctx.localOpponentTeam[ctx.localActiveOpponentIdx],
      ctx.localPlayerTeam[ctx.localActivePlayerIdx],
      ctx.localOpponentTeam,
      ctx.localActiveOpponentIdx
    );

    // 2. Turn priorities
    // If opponent is switching out
    if (aiAction.type === 'switch') {
      const targetIdx = aiAction.switchTargetIdx!;
      let oldO = ctx.localOpponentTeam[ctx.localActiveOpponentIdx];
      oldO.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
      
      const switchLogs = [{
        text: `🔄 ${trainer.name} recalled ${oldO.name} and sent out ${ctx.localOpponentTeam[targetIdx].name}!`,
        type: 'system' as const
      }];
      
      ctx.localActiveOpponentIdx = targetIdx;
      setOpponentAnim('switch');
      ctx.commit(switchLogs);
      
      await sleep(500);
      setOpponentAnim('idle');

      // Player attacks the newly switched in opponent
      await performAttack(true, playerMove, ctx);
    }
    // If opponent uses item / Potion
    else if (aiAction.type === 'item') {
      playHeal();
      let currentO = ctx.localOpponentTeam[ctx.localActiveOpponentIdx];
      const healedAmt = Math.round(currentO.maxHp * 0.5);
      currentO.hp = Math.min(currentO.maxHp, currentO.hp + healedAmt);
      setEnemyPotionUsed(true);

      const healLogs = [{
        text: `🧪 ${trainer.name} sprayed an ultra-potent Max Potion! ${currentO.name} healed for ${healedAmt} HP!`,
        type: 'heal' as const
      }];
      ctx.commit(healLogs);

      await sleep(600);

      // Player attacks
      await performAttack(true, playerMove, ctx);
    }
    // Normal turns where both attack
    else {
      const opponentMove = aiAction.selectedMove!;
      
      // Determine turn order
      const pSpeed = getModifiedSpeed(ctx.localPlayerTeam[ctx.localActivePlayerIdx]);
      const oSpeed = getModifiedSpeed(ctx.localOpponentTeam[ctx.localActiveOpponentIdx]);
      let playerFirst = pSpeed >= oSpeed;
      if (pSpeed === oSpeed) {
        playerFirst = Math.random() < 0.5;
      }

      if (playerFirst) {
        // Player moves first
        await performAttack(true, playerMove, ctx);

        // Check if opponent fainted, if so skip their attack
        if (ctx.localOpponentTeam[ctx.localActiveOpponentIdx].hp > 0) {
          await performAttack(false, opponentMove, ctx);
        }
      } else {
        // Opponent moves first
        await performAttack(false, opponentMove, ctx);

        // Check if player fainted, if so skip their attack
        if (ctx.localPlayerTeam[ctx.localActivePlayerIdx].hp > 0) {
          await performAttack(true, playerMove, ctx);
        }
      }
    }

    // Step 3: End of turn status damage (poison, burn)
    await applyEndOfTurnStatusDamageAsync(true, ctx);
    await applyEndOfTurnStatusDamageAsync(false, ctx);

    // Check faints and overall completion
    await checkTurnEndFaintsAsync(ctx);

    setIsAnimating(false);
  };

  const executeOpponentTurnOnlyAsync = async (newPlayerIdx: number, manageLock = true) => {
    if (manageLock) setIsAnimating(true);

    let localPlayerTeam = playerTeamRef.current.map(p => ({
      ...p,
      statStages: { ...p.statStages },
      moves: p.moves.map(m => ({ ...m })),
    }));
    let localOpponentTeam = opponentTeamRef.current.map(p => ({
      ...p,
      statStages: { ...p.statStages },
      moves: p.moves.map(m => ({ ...m })),
    }));

    const ctx = {
      localPlayerTeam,
      localOpponentTeam,
      localActivePlayerIdx: newPlayerIdx,
      localActiveOpponentIdx: activeOpponentIdxRef.current,
      commit: (newLogs: { text: string; type: BattleLog['type'] }[] = []) => {
        setPlayerTeam([...ctx.localPlayerTeam]);
        setOpponentTeam([...ctx.localOpponentTeam]);
        setActivePlayerIdx(ctx.localActivePlayerIdx);
        setActiveOpponentIdx(ctx.localActiveOpponentIdx);
        if (newLogs.length > 0) {
          setLogs(prev => [...prev, ...newLogs.map(l => ({ id: makeId(), text: l.text, type: l.type }))]);
        }
      }
    };

    const aiAction = chooseAIChoice(
      ctx.localOpponentTeam[ctx.localActiveOpponentIdx],
      ctx.localPlayerTeam[ctx.localActivePlayerIdx],
      ctx.localOpponentTeam,
      ctx.localActiveOpponentIdx
    );
    if (aiAction.type === 'move') {
      const opponentMove = aiAction.selectedMove!;
      await performAttack(false, opponentMove, ctx);
    }

    // End of turn status damage
    await applyEndOfTurnStatusDamageAsync(true, ctx);
    await applyEndOfTurnStatusDamageAsync(false, ctx);

    // Check faints
    await checkTurnEndFaintsAsync(ctx);

    if (manageLock) setIsAnimating(false);
  };

  const checkStatusBlockAction = (poke: ActivePokemon, logsToAppend: any[]): boolean => {
    if (poke.status === 'Paralysis') {
      if (Math.random() < 0.25) {
        logsToAppend.push({
          text: `⚡ ${poke.name} is fully paralyzed! It cannot execute its attack!`,
          type: 'status'
        });
        return false;
      }
    }
    return true;
  };

  // AI Decision Tree calculations
  const chooseAIChoice = (
    currentOpponent: ActivePokemon,
    currentPlayer: ActivePokemon,
    currentOpponentTeam: ActivePokemon[],
    currentActiveOpponentIdx: number
  ): { type: 'move' | 'switch' | 'item'; selectedMove?: Move; switchTargetIdx?: number } => {
    // 1. Healing logic (Highest priority)
    // If active opponent has extremely low HP (<35%) and they have a healing capability
    const healMove = currentOpponent.moves.find(m => m.effect?.hasRecover && m.pp > 0);
    if (currentOpponent.hp < currentOpponent.maxHp * 0.35 && healMove && Math.random() < 0.6) {
      return { type: 'move', selectedMove: healMove };
    }

    // If opponent has NO heal move, but they haven't used their single expert Max Potion, and HP < 25%
    if (!enemyPotionUsedRef.current && currentOpponent.hp < currentOpponent.maxHp * 0.25 && Math.random() < 0.7) {
      return { type: 'item' };
    }

    // 2. Switching logic (Elite 4 difficulty feature!)
    // If opponent's active has major elemental type disadvantage against player's active
    // Check if player's types deal 2x or 4x damage to active opponent
    let suffersDisadvantage = false;
    for (const playerType of currentPlayer.types) {
      const mult = getTypeEffectivenessMultiplier(playerType, currentOpponent.types);
      if (mult >= 2.0) {
        suffersDisadvantage = true;
        break;
      }
    }

    // If disadvantaged, check if we have a healthy team member who resists player's type, and 30% chance to swap
    if (suffersDisadvantage && Math.random() < 0.35) {
      const candidates = currentOpponentTeam.map((p, idx) => ({ p, idx })).filter(item => item.p.hp > 0 && item.idx !== currentActiveOpponentIdx);
      
      const goodCandidate = candidates.find(candidate => {
        let maxMult = 1.0;
        for (const playerType of currentPlayer.types) {
          const mult = getTypeEffectivenessMultiplier(playerType, candidate.p.types);
          if (mult > maxMult) maxMult = mult;
        }
        return maxMult <= 0.5; // resistant candidate
      });

      if (goodCandidate) {
        return { type: 'switch', switchTargetIdx: goodCandidate.idx };
      }
    }

    // 3. Normal Move selection - choose optimal offensive move or status infector
    // Priority status moves
    const statusMove = currentOpponent.moves.find(m => m.effect?.status && m.pp > 0);
    if (statusMove && currentPlayer.status === 'Healthy' && Math.random() < 0.3) {
      return { type: 'move', selectedMove: statusMove };
    }

    // Pick highest damage-dealing move
    let bestMove = currentOpponent.moves[0];
    let maxDmg = -1;

    currentOpponent.moves.forEach(m => {
      if (m.pp <= 0 && m.power > 0) return;
      const testDmg = calculateDamage(currentOpponent, currentPlayer, m).damage;
      if (testDmg > maxDmg) {
        maxDmg = testDmg;
        bestMove = m;
      }
    });

    return { type: 'move', selectedMove: bestMove };
  };

  // Player manual potion usage
  const executePlayerPotion = async () => {
    if (playerPotionsLeft <= 0 || activePlayer.hp <= 0 || battleEnded || isAnimating) return;

    setIsAnimating(true);
    playHeal();
    setPlayerPotionsLeft(prev => prev - 1);
    const healAmt = Math.round(activePlayer.maxHp * 0.5);
    const updatedTeam = [...playerTeam];
    
    updatedTeam[activePlayerIdx] = {
      ...activePlayer,
      hp: Math.min(activePlayer.maxHp, activePlayer.hp + healAmt)
    };

    setPlayerTeam(updatedTeam);
    setLogs(prev => [...prev, { id: makeId(), text: `🧪 You sprayed a Max Potion! ${activePlayer.name} healed for ${healAmt} HP!`, type: 'heal' }]);

    await sleep(600);

    // opponent gets a turn since using item consumes turn priority
    await executeOpponentTurnOnlyAsync(activePlayerIdx, false);
    setIsAnimating(false);
  };

  // Keyboard/Terminal actions input executor
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = terminalInput.trim();
    setTerminalInput('');

    if (battleEnded || isForceSwitching || isAnimating) return;

    if (command === '5') {
      setIsSwitchingOpen(true);
      return;
    }

    const moveIndex = parseInt(command, 10) - 1;
    if (moveIndex >= 0 && moveIndex < 4) {
      const selectedMove = activePlayer.moves[moveIndex];
      if (selectedMove && selectedMove.pp > 0) {
        executeCombatRound(selectedMove);
      } else {
        addLog(`⚠️ Action unavailable! Insufficient PP for ${selectedMove?.name || 'Move'}.`, 'system');
      }
    } else {
      addLog(`⚠️ Invalid command code. Type a number 1-5.`, 'system');
    }
  };

  // Finish match trigger
  const handleFinalizeBattle = () => {
    if (battleWinner === 'player') {
      onBattleVictory(playerTeam);
    } else {
      onBattleDefeat();
    }
  };

  if (!activePlayer || !activeOpponent) {
    return (
      <div id="battle-loading-container" className="w-full max-w-xl mx-auto bg-zinc-900 border border-zinc-800 p-12 rounded-3xl animate-fade-in shadow-2xl flex flex-col items-center justify-center text-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500 mb-2" />
        <p className="text-zinc-300 font-mono text-sm uppercase tracking-wider">Initializing Battle Arena...</p>
        <p className="text-zinc-500 font-mono text-xs">Assembling Regional Teams & Elemental Rulesets</p>
      </div>
    );
  }

  return (
    <div id="battle-view-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto p-2 md:p-4">
      
      {/* LEFT: Stadium Graphic and Action controls */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* The Battle Arena Screen / Stadium Box */}
        <div id="battle-stadium" className={`relative h-[340px] md:h-[430px] rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 md:p-6 overflow-hidden flex flex-col justify-between select-none ${arenaShake ? 'animate-arena-shake' : ''}`}>
          
          <ConfettiCelebration active={battleWinner === 'player'} />

          {/* Sparkly arena elements / retro design grids & glowing field */}
          <div className="absolute inset-0 bg-radial-gradient from-zinc-900/60 to-zinc-950 pointer-events-none" />
          {/* Retro futuristic grid lines background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-40" />
          
          <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-zinc-800/40 pointer-events-none" />

          {/* VS center overlay */}
          <div className="flex justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 font-extrabold text-zinc-900 tracking-widest text-8xl select-none font-sans italic opacity-5 pointer-events-none">VS</div>

          {/* Floating Retro Sound Controls */}
          <button
            id="btn-sound-toggle"
            type="button"
            onClick={toggleSound}
            className="absolute top-4 right-4 z-40 p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-amber-400 active:scale-95 transition-all flex items-center justify-center shadow-lg cursor-pointer"
            title={isSoundMuted ? "Unmute Battle Music & SFX" : "Mute Battle Music & SFX"}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
          </button>

          {/* TOP AREA: Opponent Side */}
          <div className="flex justify-between items-center w-full z-10">
            {/* Left: Opponent Status Box */}
            <div className="w-[45%] md:w-[48%] animate-slice-in-right">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 md:p-4 shadow-xl flex flex-col gap-1 md:gap-1.5 backdrop-blur-sm">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <h3 className="font-extrabold text-xs md:text-sm text-zinc-100 flex items-center gap-1.5 truncate max-w-[180px]">
                      {activeOpponent.name}
                    </h3>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {activeOpponent.types.map(t => (
                        <span key={t} className="text-[7px] bg-zinc-800 text-zinc-300 font-mono font-bold px-1 rounded-sm border border-zinc-700/50">{t}</span>
                      ))}
                    </div>
                  </div>
                  {activeOpponent.status !== 'Healthy' && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse ${
                      activeOpponent.status === 'Paralysis' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                      activeOpponent.status === 'Burn' ? 'bg-orange-950 text-orange-400 border border-orange-900' :
                      'bg-pink-950 text-pink-400 border border-pink-900'
                    }`}>
                      {activeOpponent.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Opponent HP status bar */}
                <div className="mt-1">
                  <div className="flex justify-between font-mono text-[9px] mb-0.5">
                    <span className="text-zinc-500 font-bold">HP</span>
                    <span className={activeOpponent.hp / activeOpponent.maxHp <= 0.3 ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                      {activeOpponent.hp} / {activeOpponent.maxHp}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeOpponent.hp / activeOpponent.maxHp <= 0.25 ? 'bg-red-500' :
                        activeOpponent.hp / activeOpponent.maxHp <= 0.5 ? 'bg-yellow-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(activeOpponent.hp / activeOpponent.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Opponent Platform & Sprite */}
            <div className="w-[45%] md:w-[48%] flex justify-center items-center h-28 md:h-36 relative">
              <div className="relative flex flex-col items-center">
                {/* Glowing red platform ellipse for boss */}
                <div className="w-24 h-6 md:w-32 md:h-8 bg-red-500/10 border border-red-500/30 rounded-[50%] absolute -bottom-1 shadow-[0_0_15px_rgba(239,68,68,0.35)] filter blur-[1px] animate-pulse" />
                
                {/* Animated Opponent Sprite using CSS class-based keyframes */}
                <img 
                  key={`opponent-sprite-${activeOpponent.name}-${opponentAnim}`}
                  src={opSpriteSrc || undefined}
                  alt={activeOpponent.name}
                  onError={() => setOpSpriteSrc(getPokemonSpriteUrls(activeOpponent.name).front)}
                  className={`w-20 h-20 md:w-28 md:h-28 object-contain z-10 select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${
                    opponentAnim === 'attack' ? 'animate-battle-attack-opponent' :
                    opponentAnim === 'hit' ? 'animate-battle-hit' :
                    opponentAnim === 'hit-super' ? 'animate-battle-hit-super' :
                    opponentAnim === 'switch' ? 'animate-battle-switch' :
                    opponentAnim === 'faint' ? 'opacity-0 transition-opacity duration-500 scale-75' :
                    'animate-battle-idle-opponent'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM AREA: Player Side */}
          <div className="flex justify-between items-center w-full z-10 mt-auto">
            {/* Left: Player Platform & Sprite */}
            <div className="w-[45%] md:w-[48%] flex justify-center items-center h-28 md:h-36 relative">
              <div className="relative flex flex-col items-center">
                {/* Glowing emerald platform ellipse for active player partner */}
                <div className="w-24 h-6 md:w-32 md:h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-[50%] absolute -bottom-1 shadow-[0_0_15px_rgba(16,185,129,0.35)] filter blur-[1px] animate-pulse" />
                
                {/* Animated Player Sprite using CSS class-based keyframes */}
                <img 
                  key={`player-sprite-${activePlayer.name}-${playerAnim}`}
                  src={plSpriteSrc || undefined}
                  alt={activePlayer.name}
                  onError={() => setPlSpriteSrc(getPokemonSpriteUrls(activePlayer.name).back)}
                  className={`w-20 h-20 md:w-28 md:h-28 object-contain z-10 select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${
                    playerAnim === 'attack' ? 'animate-battle-attack-player' :
                    playerAnim === 'hit' ? 'animate-battle-hit' :
                    playerAnim === 'hit-super' ? 'animate-battle-hit-super' :
                    playerAnim === 'switch' ? 'animate-battle-switch' :
                    playerAnim === 'faint' ? 'opacity-0 transition-opacity duration-500 scale-75' :
                    'animate-battle-idle-player'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Right: Player Status Box */}
            <div className="w-[45%] md:w-[48%] animate-slice-in-left">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 md:p-4 shadow-xl flex flex-col gap-1 md:gap-1.5 backdrop-blur-sm">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <h3 className="font-extrabold text-xs md:text-sm text-red-500 flex items-center gap-1.5 truncate max-w-[180px]">
                      {activePlayer.name}
                    </h3>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {activePlayer.types.map(t => (
                        <span key={t} className="text-[7px] bg-zinc-800 text-zinc-300 font-mono font-bold px-1 rounded-sm border border-zinc-700/50">{t}</span>
                      ))}
                    </div>
                  </div>
                  {activePlayer.status !== 'Healthy' && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse ${
                      activePlayer.status === 'Paralysis' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                      activePlayer.status === 'Burn' ? 'bg-orange-950 text-orange-400 border border-orange-900' :
                      'bg-pink-950 text-pink-400 border border-pink-900'
                    }`}>
                      {activePlayer.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Player HP status bar */}
                <div className="mt-1">
                  <div className="flex justify-between font-mono text-[9px] mb-0.5">
                    <span className="text-zinc-500 font-bold">HP</span>
                    <span className={activePlayer.hp / activePlayer.maxHp <= 0.3 ? 'text-red-400 font-bold font-mono' : 'text-zinc-400'}>
                      {activePlayer.hp} / {activePlayer.maxHp}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activePlayer.hp / activePlayer.maxHp <= 0.25 ? 'bg-red-500' :
                        activePlayer.hp / activePlayer.maxHp <= 0.5 ? 'bg-yellow-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(activePlayer.hp / activePlayer.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stat Stages details if boosted */}
                {Object.entries(activePlayer.statStages).some(([_, val]) => val !== 0) && (
                  <div className="flex gap-1 mt-1 text-[7px] font-mono flex-wrap bg-zinc-950/40 p-1 rounded">
                    {Object.entries(activePlayer.statStages).map(([stat, val]) => {
                      const valNum = val as number;
                      if (valNum === 0) return null;
                      return (
                        <span key={stat} className={valNum > 0 ? 'text-emerald-400 font-bold font-sans' : 'text-red-400'}>
                          {stat.substring(0, 3).toUpperCase()}: {valNum > 0 ? '+' : ''}{valNum}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Combat Buttons Panel */}
        {battleEnded ? (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 animate-fade-in shadow-xl">
            {battleWinner === 'player' ? (
              <>
                <Award className="w-16 h-16 text-yellow-400 animate-bounce" />
                <h3 className="text-2xl font-black text-zinc-200">MATCH WON</h3>
                <p className="text-sm text-zinc-400 max-w-md">🏆 Magnificent combat precision! All of {trainer.name}'s partners have fainted. Proceed back to the lobby or move forward to the next boss trainer!</p>
                <button
                  id="btn-finalize-victory"
                  onClick={handleFinalizeBattle}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-8 rounded-xl font-mono text-sm tracking-widest mt-2 hover:scale-102 transition-all shadow-lg"
                >
                  PROCEED TO NEXT STAGE
                </button>
              </>
            ) : (
              <>
                <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
                <h3 className="text-2xl font-black text-red-500">YOU WERE DEFEATED</h3>
                <p className="text-sm text-zinc-400 max-w-md">Your active squad was swept by the Elite Four. You must retreat, prepare, and attempt the consecutive league challenge once more.</p>
                <button
                  id="btn-finalize-defeat"
                  onClick={handleFinalizeBattle}
                  className="bg-red-650 hover:bg-red-550 text-white font-black py-3 px-8 rounded-xl font-mono text-sm tracking-widest mt-2 hover:scale-102 transition-all shadow-lg"
                >
                  SURRENDER AND RETREAT
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-3xl flex flex-col gap-4">
            
            {/* Action instructions / Selector details */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800 text-xs text-zinc-400">
              <span>Choose your next tactical move or switch pokemon</span>
              <div className="flex gap-2 font-mono">
                <span className="bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500">HP Potions Left: {playerPotionsLeft}</span>
              </div>
            </div>

            {/* Standard attack grid */}
            {!isSwitchingOpen && (
              <div className="grid grid-cols-2 gap-3" id="actions-options-grid">
                {activePlayer.moves.map((move, idx) => {
                  const isDisabled = move.pp <= 0 || isAnimating;
                  return (
                    <button
                      key={move.name}
                      id={`btn-skill-${move.name.toLowerCase().replace(/\s+/g, '-')}`}
                      disabled={isDisabled}
                      onClick={() => executeCombatRound(move)}
                      className={`flex flex-col items-start text-left p-3.5 rounded-xl border transition-all duration-200 select-none ${
                        isDisabled
                          ? 'opacity-40 bg-zinc-950 border-zinc-900 cursor-not-allowed'
                          : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-850 hover:border-red-500/40 cursor-pointer active:scale-98 group'
                      }`}
                    >
                      <div className="flex justify-between w-full items-center">
                        <span className="font-extrabold text-sm text-zinc-200 group-hover:text-red-400 transition-colors uppercase">{move.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider ${
                          move.type === 'Fire' ? 'bg-orange-950 text-orange-400 border border-orange-900' :
                          move.type === 'Water' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                          move.type === 'Grass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                          move.type === 'Electric' ? 'bg-amber-950 text-amber-300 border border-amber-900' :
                          move.type === 'Ice' ? 'bg-sky-950 text-sky-400 border border-sky-950' :
                          move.type === 'Dragon' ? 'bg-indigo-950 text-indigo-400 border border-indigo-950' :
                          move.type === 'Psychic' ? 'bg-purple-950 text-purple-400 border border-purple-950' :
                          move.type === 'Fairy' ? 'bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-100/10' :
                          'bg-zinc-900 text-zinc-400'
                        }`}>{move.type.toUpperCase()}</span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-500 mt-1 h-8 overflow-hidden line-clamp-2 leading-tight">{move.description}</p>
                      
                      <div className="flex justify-between w-full mt-2 text-[10px] font-mono text-zinc-400 border-t border-zinc-900 pt-1.5">
                        <span>Pwr: <span className="text-zinc-200 font-bold">{move.power || '--'}</span></span>
                        <span>PP: <span className={move.pp / move.maxPp <= 0.35 ? 'text-orange-400 font-bold' : 'text-zinc-200'}>{move.pp} / {move.maxPp}</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Switch pokemon secondary drawer */}
            {isSwitchingOpen && (
              <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl animate-fade-in flex flex-col gap-3">
                <div className="flex justify-between items-center pb-1 border-b border-zinc-900">
                  <span className="text-xs font-bold font-mono text-zinc-300">🔁 Select active replacement Pokémon:</span>
                  {!isForceSwitching && (
                    <button onClick={() => setIsSwitchingOpen(false)} className="text-[10px] text-zinc-500 hover:text-white px-2 py-0.5 rounded border border-zinc-900 hover:bg-zinc-900">Cancel</button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {playerTeam.map((poke, idx) => {
                    const isCurrent = idx === activePlayerIdx;
                    const isDead = poke.hp <= 0;
                    const switchDisabled = isCurrent || isDead || isAnimating;
                    return (
                      <button
                        key={poke.name}
                        id={`btn-switching-poke-${poke.name.split(' ')[0]}`}
                        disabled={switchDisabled}
                        onClick={() => executePlayerSwitch(idx)}
                        className={`flex flex-col text-left p-2.5 rounded-lg border text-xs relative ${
                          isCurrent
                            ? 'bg-zinc-900 border-zinc-800 opacity-60 cursor-default'
                            : isDead
                            ? 'bg-zinc-950 border-zinc-950 opacity-30 cursor-not-allowed'
                            : isAnimating
                            ? 'opacity-45 cursor-not-allowed bg-zinc-900 border-zinc-850'
                            : 'bg-zinc-900/40 border-zinc-850 hover:border-red-500/50 cursor-pointer active:scale-98 transition-all'
                        }`}
                      >
                        <div className="font-extrabold text-zinc-200 truncate">{poke.name}</div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1 w-full">
                          <span>HP:</span>
                          <span className={isDead ? 'text-red-500 font-bold' : 'text-zinc-300'}>{poke.hp} / {poke.maxHp}</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1 rounded overflow-hidden mt-1 pb-px">
                          <div className={`h-full ${isDead ? 'bg-transparent' : poke.hp/poke.maxHp <= 0.3 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(poke.hp / poke.maxHp) * 100}%` }} />
                        </div>
                        {isCurrent && <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-red-500">ACTIVE</span>}
                        {isDead && <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-zinc-500">FAINTED</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Auxiliary actions row: Switch state toggle, Max heal item, or Surrender */}
            {!isForceSwitching && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                <button
                  id="btn-switch-tab-toggle"
                  disabled={isAnimating}
                  onClick={() => setIsSwitchingOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 text-xs font-bold py-2 px-4 rounded-lg border transition-all ${
                    isAnimating
                      ? 'opacity-40 cursor-not-allowed bg-zinc-950 text-zinc-500 border-zinc-900'
                      : isSwitchingOpen
                      ? 'bg-red-950 text-red-400 border-red-900 font-black'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-850 hover:bg-zinc-900'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> {isSwitchingOpen ? 'Back to Attacks' : 'Switch Partner (Turn Cost)'}
                </button>

                <button
                  id="btn-player-potion"
                  disabled={playerPotionsLeft <= 0 || activePlayer.hp <= 0 || isSwitchingOpen || isAnimating}
                  onClick={executePlayerPotion}
                  className={`flex items-center gap-1.5 text-xs font-bold py-2 px-4 rounded-lg border transition-all ${
                    playerPotionsLeft <= 0 || isAnimating
                      ? 'opacity-40 cursor-not-allowed text-zinc-500 border-zinc-900 bg-zinc-950'
                      : 'bg-zinc-950 text-zinc-305 border-zinc-850 hover:bg-zinc-900 hover:text-green-400'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" /> Use Max Potion ({playerPotionsLeft} Left)
                </button>

                <button
                  id="btn-battle-concede"
                  disabled={isAnimating}
                  onClick={onBackToLobby}
                  className={`ml-auto flex items-center gap-1 text-xs font-bold py-2 px-4 rounded-lg border border-red-950/40 text-red-400/80 active:scale-95 transition-all ${
                    isAnimating ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-950/20'
                  }`}
                >
                  Concede Match
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* RIGHT: Real-time Battle Log panel and required Battle HUD printout */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* Real-time printed battle output conforming EXACTLY to the Pokémon prompt loop structure */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-xs font-mono uppercase font-bold tracking-wider text-red-500 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> Real-Time Battle HUD
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Live Engine Diagnostics</span>
          </div>

          {/* Visual text element displaying exactly what the pokemon battle engine returns! */}
          <div id="textual-battle-hud" className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-900 font-mono text-xs text-zinc-300 leading-relaxed shadow-inner">
            <p className="font-extrabold text-amber-500"><span className="text-zinc-500">Opponent Team:</span> {trainer.name}'s {activeOpponent.name}</p>
            <p className="text-[11px] font-semibold text-zinc-400 ml-1">↳ HP: <span className="text-red-400 font-bold">{activeOpponent.hp}</span> / {activeOpponent.maxHp} HP {activeOpponent.status !== 'Healthy' ? `[${activeOpponent.status}]` : ''}</p>
            
            <p className="font-extrabold text-emerald-500 mt-2"><span className="text-zinc-500">Your Team:</span> My {activePlayer.name}</p>
            <p className="text-[11px] font-semibold text-zinc-400 ml-1">↳ HP: <span className="text-emerald-400 font-bold">{activePlayer.hp}</span> / {activePlayer.maxHp} HP {activePlayer.status !== 'Healthy' ? `[${activePlayer.status}]` : ''}</p>
            
            <p className="text-zinc-650 mt-2 text-[10px] uppercase font-bold border-t border-zinc-900 pt-1.5">Available actions for CLI:</p>
            
            <div className="space-y-0.5 text-[11px] text-zinc-400 mt-1 pl-1">
              {activePlayer.moves.map((m, idx) => (
                <div key={m.name}>
                  {idx + 1}. <span className="text-zinc-200 font-bold uppercase">{m.name}</span> ({m.type} | PP:{m.pp}/{m.maxPp})
                </div>
              ))}
              <div>5. SWITCH OUT</div>
            </div>
          </div>

          {/* Prompt Terminal input simulating typing command codes */}
          {!battleEnded && !isForceSwitching && (
            <form onSubmit={handleTerminalSubmit} id="terminal-action-form" className="flex gap-2">
              <input
                id="terminal-command-input"
                type="text"
                disabled={isAnimating}
                placeholder="Type command code (1-5)..."
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-850 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl px-4 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                id="btn-terminal-submit"
                disabled={isAnimating}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-xs px-4 py-2 rounded-xl transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                SUBMIT
              </button>
            </form>
          )}
        </div>

        {/* Visual Scrollable Battle Saga Log */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col flex-1 h-[250px] lg:h-[400px] shadow-xl">
          <div className="text-xs font-bold uppercase text-zinc-400 tracking-wider pb-2 border-b border-zinc-850 mb-3 flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Battle Action Saga</span>
            <button
              id="btn-open-full-log"
              type="button"
              onClick={() => { playClick(); setShowFullLogOverlay(true); }}
              className="text-[10px] font-mono py-1 px-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-850 text-amber-500 hover:text-amber-400 border border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.03]"
            >
              <Scroll className="w-3 h-3 text-amber-500" /> Full Logbook
            </button>
          </div>

          <div
            ref={scrollRef}
            id="battle-saga-scroll"
            className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scroll-smooth custom-scrollbar"
          >
            {[...logs].reverse().map((log) => (
              <div
                key={log.id}
                className={`text-[11px] p-2.5 rounded-xl border leading-relaxed animate-slice-in-right ${
                  log.type === 'action' ? 'bg-zinc-950 border-zinc-850 text-zinc-200 font-extrabold shadow-sm' :
                  log.type === 'super-effective' ? 'bg-orange-950/20 border-orange-900/50 text-orange-400 font-bold' :
                  log.type === 'not-very-effective' ? 'bg-zinc-900 border-zinc-855 text-zinc-450' :
                  log.type === 'ineffective' ? 'bg-zinc-950 border-zinc-950 text-zinc-600 italic' :
                  log.type === 'damage' ? 'bg-red-950/10 border-red-900/10 text-red-400/90' :
                  log.type === 'heal' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 font-bold' :
                  log.type === 'stat-change' ? 'bg-sky-950/10 border-sky-900/30 text-sky-400 font-mono' :
                  log.type === 'faint' ? 'bg-zinc-950 border-zinc-900 text-zinc-400 underline decoration-red-500 font-black' :
                  log.type === 'status' ? 'bg-purple-950/10 border-purple-900/30 text-purple-400 font-bold' :
                  'bg-zinc-900/40 border-transparent text-zinc-400'
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>

      </div>

      {showFullLogOverlay && (
        <div id="full-battle-log-overlay" className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col justify-between shadow-2xl relative">
            
            {/* Header */}
            <div className="shrink-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-amber-500" />
                  <h3 className="font-sans font-black text-lg text-zinc-100 tracking-wide">
                    📜 Combat Logbook & Chronicles
                  </h3>
                </div>
                <button
                  id="btn-close-logbook"
                  type="button"
                  onClick={() => { playClick(); setShowFullLogOverlay(false); }}
                  className="p-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed font-mono">
                Log registry of every move, type feedback multiplier, damage deduction, and status ailment computed in this match.
              </p>

              {/* Quick Summary Bar */}
              <div className="grid grid-cols-3 gap-2.5 bg-zinc-950 p-3 rounded-xl border border-zinc-850 mb-4 text-center">
                <div>
                  <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Turn Entries</span>
                  <span className="text-base font-bold text-zinc-200">{logs.length}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Opponent Active HP</span>
                  <span className={`text-base font-bold ${activeOpponent && activeOpponent.hp === 0 ? 'text-zinc-650 line-through' : 'text-red-400'}`}>
                    {activeOpponent ? `${activeOpponent.hp}/${activeOpponent.maxHp}` : '0/0'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Your Active HP</span>
                  <span className={`text-base font-bold ${activePlayer && activePlayer.hp === 0 ? 'text-zinc-650 line-through' : 'text-emerald-400'}`}>
                    {activePlayer ? `${activePlayer.hp}/${activePlayer.maxHp}` : '0/0'}
                  </span>
                </div>
              </div>

              {/* Filters toolbar */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-zinc-800 mb-4 overflow-x-auto">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1 mr-2.5 shrink-0">
                  <Filter className="w-3 h-3" /> Filters:
                </span>
                <div className="flex gap-1.5 text-[9.5px] font-mono shrink-0">
                  <button
                    id="btn-log-filter-all"
                    type="button"
                    onClick={() => { playClick(); setLogFilter('all'); }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${logFilter === 'all' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850'}`}
                  >
                    All ({logs.length})
                  </button>
                  <button
                    id="btn-log-filter-action"
                    type="button"
                    onClick={() => { playClick(); setLogFilter('action'); }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${logFilter === 'action' ? 'bg-sky-950 text-sky-450 font-bold border border-sky-800' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850'}`}
                  >
                    Moves/Switches ({logs.filter(l => l.type === 'action' || l.type === 'system').length})
                  </button>
                  <button
                    id="btn-log-filter-damage"
                    type="button"
                    onClick={() => { playClick(); setLogFilter('damage'); }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${logFilter === 'damage' ? 'bg-red-950 text-red-400 font-bold border border-red-900/60' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850'}`}
                  >
                    Damage & Heals ({logs.filter(l => l.type === 'damage' || l.type === 'heal' || l.type === 'super-effective' || l.type === 'not-very-effective' || l.type === 'ineffective').length})
                  </button>
                  <button
                    id="btn-log-filter-stat"
                    type="button"
                    onClick={() => { playClick(); setLogFilter('stat-change'); }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${logFilter === 'stat-change' ? 'bg-purple-950 text-purple-400 font-bold border border-purple-800' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850'}`}
                  >
                    Stats & Statuses ({logs.filter(l => l.type === 'stat-change' || l.type === 'status' || l.type === 'faint').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable body content */}
            <div id="overlay-logbook-scroll" className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[380px] custom-scrollbar">
              {logs.filter(l => {
                if (logFilter === 'action') return l.type === 'action' || l.type === 'system';
                if (logFilter === 'damage') return l.type === 'damage' || l.type === 'heal' || l.type === 'super-effective' || l.type === 'not-very-effective' || l.type === 'ineffective';
                if (logFilter === 'stat-change') return l.type === 'stat-change' || l.type === 'status' || l.type === 'faint';
                return true;
              }).length === 0 ? (
                <div className="py-12 text-center text-zinc-650 font-mono text-xs">
                  No match events recorded for this category yet. Select command moves to record action logs!
                </div>
              ) : (
                logs.filter(l => {
                  if (logFilter === 'action') return l.type === 'action' || l.type === 'system';
                  if (logFilter === 'damage') return l.type === 'damage' || l.type === 'heal' || l.type === 'super-effective' || l.type === 'not-very-effective' || l.type === 'ineffective';
                  if (logFilter === 'stat-change') return l.type === 'stat-change' || l.type === 'status' || l.type === 'faint';
                  return true;
                }).slice().reverse().map((log, index) => (
                  <div
                    key={log.id || index}
                    className={`text-[11px] p-2.5 rounded-xl border leading-relaxed flex items-start gap-2 ${
                      log.type === 'action' ? 'bg-zinc-950 border-zinc-850 text-zinc-200 font-extrabold shadow-sm' :
                      log.type === 'super-effective' ? 'bg-orange-950/20 border-orange-900/50 text-orange-400 font-bold' :
                      log.type === 'not-very-effective' ? 'bg-zinc-900 border-zinc-855 text-zinc-450' :
                      log.type === 'ineffective' ? 'bg-zinc-950 border-zinc-950 text-zinc-650 italic' :
                      log.type === 'damage' ? 'bg-red-950/20 border-red-900/30 text-red-400' :
                      log.type === 'heal' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 font-bold' :
                      log.type === 'stat-change' ? 'bg-sky-950/10 border-sky-900/30 text-sky-450 font-mono' :
                      log.type === 'faint' ? 'bg-zinc-950 border-zinc-900 text-zinc-500 underline decoration-red-500 font-black' :
                      log.type === 'status' ? 'bg-purple-950/20 border-purple-900/30 text-purple-400 font-bold' :
                      'bg-zinc-900/40 border-transparent text-zinc-400'
                    }`}
                  >
                    <span className="text-[9px] font-mono text-zinc-550 select-none bg-zinc-950 px-1 rounded border border-zinc-850 shrink-0">
                      #{logs.indexOf(log) + 1}
                    </span>
                    <span className="flex-1">{log.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
              <button
                id="btn-modal-close-logbook"
                type="button"
                onClick={() => { playClick(); setShowFullLogOverlay(false); }}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-sans font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all hover:scale-102 cursor-pointer"
              >
                RETURN TO BATTLEFIELD
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
