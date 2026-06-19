# 🏟️ Poke Championship League

Welcome to the **Poke Championship League**, a high-fidelity, retro-inspired Pokémon battle simulator. Draft your perfect team of six Pokémon and face five consecutive matches against the regional Elite Four and Champion Cynthia. Master the elements, strategize status effects, and claim your place in the Hall of Fame!

---

## 🌟 Key Features

### ⚔️ Consecutive Matches Challenge
Fight consecutive battles without changing your drafted squad. Your Pokémon are fully healed and their PP is restored between battles, but a single defeat breaks your streak and resets your progress:
1. **Glacia (Elite I)** — *Ice Specialty* (Abomasnow, Glaceon, Weavile, Froslass, Cloyster, Lapras [Ace])
2. **Bruno (Elite II)** — *Fighting & Ground Specialty* (Hariyama, Steelix, Conkeldurr, Garchomp, Lucario, Machamp [Ace])
3. **Agatha (Elite III)** — *Ghost & Psychic Specialty* (Mismagius, Alakazam, Chandelure, Gardevoir, Dusknoir, Gengar [Ace])
4. **Lance (Elite IV)** — *Dragon Specialty* (Aerodactyl, Gyarados, Garchomp, Charizard, Salamence, Dragonite [Ace])
5. **Cynthia (League Champion)** — *Balanced All-Around Master* (Spiritomb, Roserade, Togekiss, Lucario, Milotic, Garchomp [Ace])

### 🎛️ Squad Drafting
Choose your strategic approach before entering the arena:
* **Prebuilt Archetypes**: Instantly deploy standard templates:
  * **Trinity Classic Team**: A balanced Kanto starter trio with defensive coverage.
  * **Dragonic Swarm Force**: Heavy offense, high-speed dragon scaling, and stat-boosting setups.
  * **Electro-Mystic Vanguard**: High tactical diversity, paralysis controllers, and type coverage.
* **Custom Draft**: Hand-pick exactly six Pokémon from the registry. Inspect detailed attributes, movesets, and base stats (HP, Attack, Defense, Special Attack, Special Defense, Speed) via the visual hover index.

### 🧮 Battle & Combat Engine
Built on standard core Pokémon battle mechanics:
* **HP Scaling**: Balanced high-level HP pools that allow setups, status infliction, and tactical switches.
* **Move Categories**: Physical moves scale with Physical Attack/Defense; Special moves scale with Special Attack/Defense.
* **Stat Stages**: Boost or lower stats (-6 to +6 stages) using setup moves (e.g., *Swords Dance*, *Calm Mind*, *Iron Defense*, *Nasty Plot*) or move side-effects (*Close Combat* recoil).
* **Type Matchups**: Complete type effectiveness multiplier grid (immunities, resistance, super-effective, and STAB 1.5x damage bonus).
* **Status Conditions**: 
  * **Burn (🔥)**: Inflicts end-of-turn damage and halves physical attack power.
  * **Paralysis (⚡)**: Halves speed and introduces a 25% chance to fully paralyze (fail actions).
  * **Poison (☣️)**: Inflicts significant end-of-turn damage.
* **Items Usage**: Player has 2 Potions per fight. Opponents have a single expert Max Potion used when their HP drops below 25%.

### 🧠 Expert AI Decision Tree
Elite Four trainers use advanced strategic logic:
* Automatically prioritize healing moves or potion items at low HP thresholds.
* Execute tactical switching when suffering from significant type disadvantages, choosing healthy team members that resist your typing.

### 🎵 Dynamic Synthesized Web Audio
Features an HTML5 Web Audio API synthesizer — **no external audio asset dependencies or files to download!**
* High-tempo synthesized retro chiptune background music (BGM).
* Contextual retro sound effects for clicks, switches, attacks, standard hits, super-effective hits, faints, healing chimes, and a triadic champion victory fanfare.
* Toggle mute button to control audio preferences.

### 🏆 Persistent Records & Hall of Fame
Stores tournament runs in browser local storage:
* **Bento Stats Dashboard**: View your overall win-rate ratio, current active win/loss streaks, best win streak records, and total runs completed.
* **Previous Campaigns Registry**: Review the timelines and specific squads of past winning (Hall of Fame) or defeated challengers.
* **Responsive Visuals**: Retro pixel sprites, animations, official high-res artworks (loaded from PokéAPI), screen shake effects, and a comprehensive live-updating combat log filter.

---

## 🛠️ Stack & Technologies

* **Core**: React 19, TypeScript
* **Build Tool**: Vite 6
* **Styling**: Tailwind CSS v4, Lucide React (Icons)
* **Animation**: Framer Motion (`motion/react`)
* **Audio Engine**: Web Audio API (Synthesized chiptune oscillator sequencer)
* **Visual Data**: official PokeAPI artwork/sprite links

---

## 🚀 Running the Simulator Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm (comes with Node.js)

### Installation
1. Clone the repository or navigate to the project directory:
   ```bash
   cd Pokémon-League
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local address (typically `http://localhost:3000`).

---

## 🏗️ Project Architecture

```
Pokémon-League/
├── src/
│   ├── components/            # Interactive UI components
│   │   ├── AudioContext.tsx   # Audio provider and state manager
│   │   ├── BattleScreen.tsx   # Main battle arena layout & turn cycle loop
│   │   ├── ConfettiCelebration.tsx # Victory confetti visual effect
│   │   ├── HallOfFameStats.tsx     # local storage stats dashboard & history
│   │   └── TeamSelector.tsx        # Prebuilt archetypes & custom draft select
│   ├── data/                  # Static databases
│   │   ├── league.ts          # Bosses teams templates (Elite 4 & Cynthia)
│   │   ├── moves.ts           # Attacks, categories, values and effect triggers
│   │   └── pokemon.ts         # Player Draft roster database
│   ├── utils/                 # Auxiliary helper modules
│   │   ├── audio.ts           # Chiptune synthesizer engine (Web Audio API)
│   │   └── combat.ts          # Damage multipliers & type matchups formulas
│   ├── App.tsx                # Main Router (phase, game state, local storage hooks)
│   ├── index.css              # Styling system & animations configurations
│   ├── main.tsx               # DOM mount entrypoint
│   └── types.ts               # Core TypeScript interface definitions
├── package.json               # Scripts & dependencies definition
├── tsconfig.json              # TypeScript compilation setup
└── vite.config.ts             # Vite server & CSS plugins config
```

---

## 📊 Type Chart Reference Guide

| Attacking Type | Super Effective (2.0x) | Not Very Effective (0.5x) | No Effect (0x) |
|---|---|---|---|
| **Fire** | Grass, Ice, Bug, Steel | Fire, Water, Rock, Dragon | — |
| **Water** | Fire, Ground, Rock | Water, Grass, Dragon | — |
| **Grass** | Water, Ground, Rock | Fire, Grass, Poison, Flying, Bug, Dragon, Steel | — |
| **Electric** | Water, Flying | Grass, Electric, Dragon | Ground |
| **Ground** | Fire, Electric, Poison, Rock, Steel | Grass, Bug | Flying |
| **Fighting** | Normal, Ice, Rock, Steel, Dark | Poison, Flying, Psychic, Bug, Fairy | Ghost |
| **Ghost** | Psychic, Ghost | Dark | Normal |
| **Dragon** | Dragon | Steel | Fairy |

*Note: Immune matchups yield zero damage. Same-Type Attack Bonus (STAB) grants an additional 1.5x damage boost to any attack matching the user's element.*