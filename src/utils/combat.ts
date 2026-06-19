 import { PokemonType, ActivePokemon, Move, StatusCondition, BattleLog } from '../types';

export const TYPE_EFFECTIVENESS: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  Normal: { Ghost: 0, Rock: 0.5, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Steel: 2, Dark: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Grass: 0.5, Electric: 2, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Steel: 0.5, Dark: 0 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Steel: 0.5, Dark: 2, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Steel: { Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Fairy: { Fighting: 2, Poison: 0.5, Steel: 0.5, Dragon: 2, Dark: 2 },
};

// Gets effectiveness of a move type against a set of defender types
export function getTypeEffectivenessMultiplier(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const matchup = TYPE_EFFECTIVENESS[moveType]?.[defType];
    if (matchup !== undefined) {
      multiplier *= matchup;
    }
  }
  return multiplier;
}

// Gets multiplier for stat stages (-6 to +6)
export function getStatStageMultiplier(stage: number): number {
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 - stage);
  }
}

// Calculate actual speed of pokemon, accounting for paralysis and stat stages
export function getModifiedSpeed(pokemon: ActivePokemon): number {
  let speed = pokemon.speed * getStatStageMultiplier(pokemon.statStages.speed);
  if (pokemon.status === 'Paralysis') {
    speed *= 0.5; // Paralysis halves speed
  }
  return Math.max(1, Math.round(speed));
}

// Calculate damage and return details
export interface DamageResult {
  damage: number;
  isCrit: boolean;
  effectiveness: number; // 0, 0.25, 0.5, 1, 2, 4
  isStab: boolean;
}

export function calculateDamage(attacker: ActivePokemon, defender: ActivePokemon, move: Move): DamageResult {
  if (move.power === 0) {
    return { damage: 0, isCrit: false, effectiveness: 1, isStab: false };
  }

  // Determine attack and defense stats based on Move Category
  let atkVal = 1;
  let defVal = 1;

  if (move.category === 'Physical') {
    atkVal = attacker.attack * getStatStageMultiplier(attacker.statStages.attack);
    defVal = defender.defense * getStatStageMultiplier(defender.statStages.defense);
    if (attacker.status === 'Burn') {
      atkVal *= 0.5; // Burn halves physical attack strength
    }
  } else if (move.category === 'Special') {
    atkVal = attacker.spAttack * getStatStageMultiplier(attacker.statStages.spAttack);
    defVal = defender.spDefense * getStatStageMultiplier(defender.statStages.spDefense);
  }

  // Base damage formula
  let baseDamage = (42 * move.power * (atkVal / defVal)) / 50 + 2;

  // Type Matchup
  const effectiveness = getTypeEffectivenessMultiplier(move.type, defender.types);

  // STAB
  const isStab = attacker.types.includes(move.type);
  const stabMultiplier = isStab ? 1.5 : 1.0;

  // Critical hit chance (10% standard)
  const isCrit = Math.random() < 0.10;
  const critMultiplier = isCrit ? 1.5 : 1.0;

  // Random factor between 0.85 and 1.0
  const randomFactor = 0.85 + Math.random() * 0.15;

  // Total Modifier
  const modifier = effectiveness * stabMultiplier * critMultiplier * randomFactor;

  const finalDamage = Math.max(1, Math.round(baseDamage * modifier));

  return {
    damage: finalDamage,
    isCrit,
    effectiveness,
    isStab,
  };
}

// Standard helper to create random ID
export function makeId(): string {
  return Math.random().toString(36).substring(2, 9);
}
