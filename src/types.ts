export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Steel'
  | 'Dark'
  | 'Fairy';

export type MoveCategory = 'Physical' | 'Special' | 'Status';

export interface StatStages {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export type StatusCondition = 'Healthy' | 'Burn' | 'Paralysis' | 'Poison' | 'Freeze' | 'Sleep';

export interface Move {
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  description: string;
  effect?: {
    status?: StatusCondition;
    chance?: number; // 0 to 1
    type?: 'self' | 'target';
    stat?: keyof StatStages;
    stages?: number; // positive or negative
    hasRecover?: boolean;
  };
}

export interface PokemonTemplate {
  name: string;
  types: PokemonType[];
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  moves: string[]; // move names to populate
  spriteUrl: string;
  colorTheme: string; // Tailwind bg class color like 'rose', 'blue'
}

export interface ActivePokemon {
  name: string;
  types: PokemonType[];
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  moves: Move[];
  spriteUrl: string;
  colorTheme: string;
  status: StatusCondition;
  statStages: StatStages;
}

export interface BattleLog {
  id: string;
  text: string;
  type: 'action' | 'damage' | 'status' | 'faint' | 'system' | 'super-effective' | 'not-very-effective' | 'ineffective' | 'heal' | 'stat-change';
}

export interface Trainer {
  name: string;
  specialtyType: string;
  teaser: string;
  team: PokemonTemplate[];
  avatarUrl: string;
  dialogue: {
    intro: string;
    defeat: string;
    win: string;
  };
}

export type GamePhase = 'WELCOME' | 'TEAM_SELECT' | 'LEAGUE_LOBBY' | 'TEASER' | 'BATTLE' | 'DEFEAT' | 'VICTORY_LAP' | 'HALL_OF_FAME';
