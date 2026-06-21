# 🏟️ Poke Championship League

Welcome to the **Poke Championship League**, a high-fidelity, retro-inspired Pokémon battle simulator. Draft your perfect team of six Pokémon and conquer multiple consecutive regional League Tournaments. Master the elements, strategize status effects, and claim your place in the Hall of Fame!

---

## 🌟 Key Features

### ⚔️ Multiple Regional League Gauntlets
Challenge three distinct tournament gauntlets of consecutive matches without changing your drafted squad. Your Pokémon are fully healed and their PP is restored between battles, but a single defeat breaks your streak and resets your progress:

1. **Classic Crossover League (Kanto / Classic)** — *5-Stage Hybrid Challenge*
   * **Glacia (Elite I)** — *Ice Specialty* (Abomasnow, Glaceon, Weavile, Froslass, Cloyster, Lapras [Ace])
   * **Bruno (Elite II)** — *Fighting & Ground Specialty* (Hariyama, Steelix, Conkeldurr, Garchomp, Lucario, Machamp [Ace])
   * **Agatha (Elite III)** — *Ghost & Psychic Specialty* (Mismagius, Alakazam, Chandelure, Gardevoir, Dusknoir, Gengar [Ace])
   * **Lance (Elite IV)** — *Dragon Specialty* (Aerodactyl, Gyarados, Garchomp, Charizard, Salamence, Dragonite [Ace])
   * **Blue (League Champion)** — *Balanced Master* (Pidgeot, Alakazam, Rhydon, Gyarados, Exeggutor, Arcanine [Ace])

2. **Sinnoh Master League (Sinnoh)** — *5-Stage Region-Accurate Gauntlet*
   * **Aaron (Elite I)** — *Bug Specialty* (Yanmega, Heracross, Vespiquen, Pinsir, Drapion [Ace])
   * **Bertha (Elite II)** — *Ground Specialty* (Whiscash, Gliscor, Hippowdon, Golem, Rhyperior [Ace])
   * **Flint (Elite III)** — *Fire Specialty* (Houndoom, Flareon, Rapidash, Magmortar, Arcanine, Infernape [Ace])
   * **Lucian (Elite IV)** — *Psychic Specialty* (Mr. Mime, Espeon, Bronzong, Alakazam, Medicham, Gallade [Ace])
   * **Cynthia (League Champion)** — *All-Around Archaeologist Master* (Spiritomb, Roserade, Togekiss, Lucario, Milotic, Garchomp [Ace])

3. **Hoenn Champion League (Hoenn)** — *6-Stage Gen 3 Master Gauntlet*
   * **Sidney (Elite I)** — *Dark Specialty* (Mightyena, Shiftry, Cacturne, Crawdaunt, Sharpedo, Absol [Ace])
   * **Phoebe (Elite II)** — *Ghost Specialty* (Dusclops, Banette, Sableye, Drifblim, Claydol, Dusknoir [Ace])
   * **Glacia (Elite III)** — *Ice Specialty* (Glalie, Froslass, Walrein, Abomasnow, Aurorus, Walrein [Ace])
   * **Drake (Elite IV)** — *Dragon Specialty* (Altaria, Flygon, Kingdra, Noivern, Haxorus, Salamence [Ace])
   * **Steven Stone (Champion)** — *Steel & Rock Specialty* (Skarmory, Claydol, Aggron, Cradily, Armaldo, Metagross [Ace])
   * **Wallace (Grand Champion)** — *Water Specialty* (Wailord, Tentacruel, Ludicolo, Whiscash, Gyarados, Milotic [Ace])

### 🎛️ Squad Drafting
Choose your strategic approach before entering the arena:
* **Prebuilt Archetypes**: Instantly deploy standard templates:
  * **Trinity Classic Team**: A balanced Kanto starter trio with defensive coverage (*Charizard, Blastoise, Venusaur, Gardevoir, Lucario, Snorlax*).
  * **Dragonic Swarm Force**: Heavy offense, high-speed dragon scaling, and stat-boosting setups (*Dragonite, Garchomp, Volcarona, Metagross, Gengar, Lapras*).
  * **Electro-Mystic Vanguard**: High tactical diversity, paralysis controllers, and type coverage (*Pikachu, Sylveon, Tyranitar, Alakazam, Scizor, Gyarados*).
* **Custom Draft**: Hand-pick exactly six Pokémon from the registry. Inspect detailed attributes, movesets, and base stats (HP, Attack, Defense, Special Attack, Special Defense, Speed) via the visual hover index. Supported pool expanded to **53 options** including Aegislash, Greninja, Decidueye, Tinkaton, Dragapult, Zeraora, Volcanion, Sinnoh/Hoenn champions & elite favorites, Hoenn starters (*Swampert, Sceptile, Blaziken*) and Eeveelutions (*Umbreon, Espeon, Sylveon*).

### 🧮 Battle & Combat Engine
Built on standard core Pokémon battle mechanics:
* **HP & Stat Scaling**: All active Pokémon stats are mathematically scaled to match their neutral Level 100 values from the actual games (HP: `Base * 2 + 110`, Attack/Defense/SpAtk/SpDef/Speed: `Base * 2 + 5`), ensuring authentic speed tiers and balanced combat pacing.
* **Move Categories**: Physical moves scale with Physical Attack/Defense; Special moves scale with Special Attack/Defense.
* **Stat Stages**: Boost or lower stats (-6 to +6 stages) using setup moves (e.g., *Swords Dance*, *Iron Defense*, *Nasty Plot*) or move side-effects (*Close Combat* recoil). Multi-stat setup moves like *Calm Mind* (SpAtk + SpDef), *Dragon Dance* (Attack + Speed), and *Quiver Dance* (SpAtk + SpDef + Speed) dynamically boost multiple stats simultaneously.
* **Type Matchups**: Complete type effectiveness multiplier grid (immunities, resistance, super-effective, and STAB 1.5x damage bonus) across all 18 standard types.
* **Status Conditions**: 
  * **Burn (🔥)**: Inflicts end-of-turn damage (1/16th max HP) and halves physical attack power.
  * **Paralysis (⚡)**: Halves speed and introduces a 25% chance to fully paralyze (fail actions).
  * **Poison (☣️)**: Inflicts significant end-of-turn damage (1/8th max HP).
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

Full 18-type effectiveness matchups are implemented in the combat engine. Attacking moves matching the user's type gain a **Same-Type Attack Bonus (STAB) of 1.5x damage**. Immune matchups result in **0x damage**.

| Attacking Type | Super Effective (2.0x) | Not Very Effective (0.5x) | No Effect (0x) |
|---|---|---|---|
| **Normal** | — | Rock, Steel | Ghost |
| **Fire** | Grass, Ice, Bug, Steel | Fire, Water, Rock, Dragon | — |
| **Water** | Fire, Ground, Rock | Water, Grass, Dragon | — |
| **Grass** | Water, Ground, Rock | Fire, Grass, Poison, Flying, Bug, Dragon, Steel | — |
| **Electric** | Water, Flying | Grass, Electric, Dragon | Ground |
| **Ice** | Grass, Ground, Flying, Dragon | Fire, Water, Ice, Steel | — |
| **Fighting** | Normal, Ice, Rock, Steel, Dark | Poison, Flying, Psychic, Bug, Fairy | Ghost |
| **Poison** | Grass, Fairy | Poison, Ground, Rock, Ghost | Steel |
| **Ground** | Fire, Electric, Poison, Rock, Steel | Grass, Bug | Flying |
| **Flying** | Grass, Fighting, Bug | Electric, Rock, Steel | — |
| **Psychic** | Fighting, Poison | Psychic, Steel | Dark |
| **Bug** | Grass, Psychic, Dark | Fire, Fighting, Poison, Flying, Ghost, Steel, Fairy | — |
| **Rock** | Fire, Ice, Flying, Bug | Fighting, Ground, Steel | — |
| **Ghost** | Psychic, Ghost | Dark | Normal |
| **Dragon** | Dragon | Steel | Fairy |
| **Steel** | Ice, Rock, Fairy | Water, Electric, Steel | — |
| **Dark** | Psychic, Ghost | Fighting, Dark, Fairy | — |
| **Fairy** | Fighting, Dragon, Dark | Poison, Steel | — |