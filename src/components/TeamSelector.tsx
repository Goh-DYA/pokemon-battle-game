import React, { useState } from 'react';
import { POKEMON_DATABASE, PREBUILT_TEAMS, getPokemonId, getPokemonSpriteUrls } from '../data/pokemon';
import { PokemonTemplate } from '../types';
import { Search, Info, Check, Plus, Trash2, ShieldAlert, Sparkles, Sword } from 'lucide-react';
import { useAudio } from './AudioContext';

interface TeamSelectorProps {
  onSelectTeam: (selectedNames: string[]) => void;
}

export function TeamSelector({ onSelectTeam }: TeamSelectorProps) {
  const { playClick } = useAudio();
  const [activeTab, setActiveTab] = useState<'prebuilt' | 'custom'>('prebuilt');
  const [searchTerm, setSearchTerm] = useState('');
  const [customTeam, setCustomTeam] = useState<string[]>([]);
  const [hoveredPokemon, setHoveredPokemon] = useState<PokemonTemplate | null>(null);

  const pokemonList = Object.values(POKEMON_DATABASE);

  const filteredPokemon = pokemonList.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.types.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddPokemon = (name: string) => {
    if (customTeam.length >= 6) {
      return; // Max 6 pokemon
    }
    if (customTeam.includes(name)) {
      return; // Already in team
    }
    setCustomTeam([...customTeam, name]);
  };

  const handleRemovePokemon = (name: string) => {
    setCustomTeam(customTeam.filter(p => p !== name));
  };

  const handleConfirmCustomTeam = () => {
    if (customTeam.length === 6) {
      onSelectTeam(customTeam);
    }
  };

  return (
    <div id="team-selector-container" className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl">
      <div className="text-center mb-8">
        <span className="text-xs font-mono uppercase bg-red-950/50 text-red-500 border border-red-900 px-3 py-1 rounded-full tracking-widest">
          Challenger Registry
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 text-zinc-100 font-sans">
          Register Your Team
        </h1>
        <p className="text-sm md:text-base text-zinc-400 mt-2 max-w-2xl mx-auto">
          Choose a pre-constructed championship archetype, or customize a strategic roster of exactly six Pokémon to challenge the league.
        </p>
      </div>

      {/* Tabs */}
      <div id="selector-tabs" className="flex border-b border-zinc-800 mb-8 max-w-md mx-auto">
        <button
          id="tab-prebuilt"
          onClick={() => { playClick(); setActiveTab('prebuilt'); }}
          className={`flex-1 py-3 text-sm md:text-base font-semibold border-b-2 transition-all duration-300 ${
            activeTab === 'prebuilt'
              ? 'border-red-500 text-red-400 font-bold bg-gradient-to-t from-red-950/20 to-transparent'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🏆 Pre-Built Teams
        </button>
        <button
          id="tab-custom"
          onClick={() => { playClick(); setActiveTab('custom'); }}
          className={`flex-1 py-3 text-sm md:text-base font-semibold border-b-2 transition-all duration-300 ${
            activeTab === 'custom'
              ? 'border-red-500 text-red-400 font-bold bg-gradient-to-t from-red-950/20 to-transparent'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          ⚔️ Custom Draft
        </button>
      </div>

      {/* Prebuilt Teams Tab内容 */}
      {activeTab === 'prebuilt' && (
        <div id="prebuilt-view" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PREBUILT_TEAMS.map((team, idx) => (
            <div
              key={idx}
              id={`prebuilt-card-${idx}`}
              className="flex flex-col justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-red-500/50 hover:bg-zinc-900/80 transition-all duration-300 shadow-lg hover:shadow-red-950/20 group"
            >
              <div>
                <h3 className="text-xl font-extrabold text-red-400 group-hover:text-red-300 tracking-tight font-sans">
                  {team.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 h-12 overflow-hidden leading-relaxed">
                  {team.description}
                </p>

                {/* Team Roster Grid */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {team.pokemonNames.map((name) => {
                    const pokemon = POKEMON_DATABASE[name];
                    const spriteId = pokemon ? getPokemonId(pokemon.name) : 1;
                    return (
                      <div
                        key={name}
                        className="flex flex-col items-center bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center relative group/poke text-ellipsis overflow-hidden"
                      >
                        <img 
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`}
                          alt={pokemon?.name}
                          className="w-10 h-10 object-contain filter drop-shadow hover:scale-110 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-[10px] font-bold text-zinc-200 h-4 truncate mt-1">
                          {pokemon?.name.split(' ')[0]}
                        </div>
                        <div className="flex gap-1 mt-1.5 justify-center">
                          {pokemon?.types.map((t) => (
                            <span
                              key={t}
                              className={`w-2 h-2 rounded-full ${
                                t === 'Fire' ? 'bg-orange-500' :
                                t === 'Water' ? 'bg-blue-500' :
                                t === 'Grass' ? 'bg-green-500' :
                                t === 'Electric' ? 'bg-yellow-400' :
                                t === 'Ice' ? 'bg-sky-300' :
                                t === 'Dragon' ? 'bg-indigo-600' :
                                t === 'Flying' ? 'bg-emerald-300' :
                                t === 'Psychic' ? 'bg-violet-400' :
                                t === 'Fairy' ? 'bg-fuchsia-400' :
                                t === 'Steel' ? 'bg-slate-400' :
                                t === 'Fighting' ? 'bg-red-600' :
                                t === 'Ground' ? 'bg-amber-600' :
                                t === 'Rock' ? 'bg-stone-500' :
                                t === 'Ghost' ? 'bg-purple-700' :
                                t === 'Poison' ? 'bg-fuchsia-800' :
                                t === 'Bug' ? 'bg-lime-500' : 'bg-zinc-400'
                              }`}
                              title={t}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                id={`btn-select-prebuilt-${idx}`}
                onClick={() => { playClick(); onSelectTeam(team.pokemonNames); }}
                className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 tracking-wide font-mono hover:scale-102"
              >
                <Sword className="w-4 h-4" /> Assemble Archetype
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Team Tab内容 */}
      {activeTab === 'custom' && (
        <div id="custom-view" className="flex flex-col lg:flex-row gap-6">
          
          {/* List of Draftable Pokemon */}
          <div className="flex-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input
                id="pokemon-search-input"
                type="text"
                placeholder="Search by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-10 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-zinc-100"
              />
            </div>

            <div id="pokemon-draft-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPokemon.map((pokemon) => {
                const isSelected = customTeam.includes(pokemon.name);
                return (
                  <button
                    key={pokemon.name}
                    id={`draft-card-${pokemon.name}`}
                    onClick={() => {
                      playClick();
                      if (isSelected) {
                        handleRemovePokemon(pokemon.name);
                      } else {
                        handleAddPokemon(pokemon.name);
                      }
                    }}
                    onMouseEnter={() => setHoveredPokemon(pokemon)}
                    onMouseLeave={() => setHoveredPokemon(null)}
                    disabled={!isSelected && customTeam.length >= 6}
                    className={`flex items-center gap-3 text-left p-2.5 rounded-xl border transition-all duration-200 relative group select-none text-xs md:text-sm cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/30 border-red-500 shadow-md shadow-red-950/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:border-zinc-800'
                    }`}
                  >
                    {/* Small image container */}
                    <div className="w-12 h-12 flex-shrink-0 bg-zinc-950/50 rounded-lg border border-zinc-800/60 flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonId(pokemon.name)}.png`}
                        alt={pokemon.name}
                        className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="absolute right-2 top-2">
                        {isSelected ? (
                          <div className="bg-red-500 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="bg-zinc-800 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3 h-3 text-zinc-400" />
                          </div>
                        )}
                      </div>

                      <div className="font-extrabold text-zinc-200 truncate max-w-[85%]">{pokemon.name}</div>
                      
                      <div className="flex gap-1 mt-1">
                        {pokemon.types.map((type) => (
                          <span
                            key={type}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider ${
                              type === 'Fire' ? 'bg-orange-950 text-orange-400 border border-orange-900' :
                              type === 'Water' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                              type === 'Grass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                              type === 'Electric' ? 'bg-amber-950 text-amber-300 border border-amber-900' :
                              type === 'Ice' ? 'bg-sky-950 text-sky-400 border border-sky-900' :
                              type === 'Dragon' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' :
                              type === 'Psychic' ? 'bg-purple-950 text-purple-400 border border-purple-900' :
                              type === 'Fairy' ? 'bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-900' :
                              type === 'Steel' ? 'bg-slate-950 text-slate-300 border border-slate-905' :
                              type === 'Fighting' ? 'bg-red-950 text-red-400 border border-red-900' :
                              type === 'Ground' ? 'bg-amber-950/40 text-amber-500 border border-amber-950' :
                              type === 'Normal' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' :
                              type === 'Ghost' ? 'bg-violet-950 text-violet-400 border border-violet-900' :
                              type === 'Rock' ? 'bg-stone-900 text-stone-400 border border-stone-700' :
                              type === 'Poison' ? 'bg-purple-950/70 text-fuchsia-400 border border-purple-900' :
                              type === 'Bug' ? 'bg-lime-950 text-lime-400 border border-lime-900' :
                              type === 'Dark' ? 'bg-zinc-950 text-zinc-400 border border-zinc-900' :
                              type === 'Flying' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' :
                              'bg-zinc-850 text-zinc-300 border border-zinc-800'
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      {/* Simple moves teaser */}
                      <div className="text-[10px] text-zinc-500 mt-1 truncate">
                        {pokemon.moves.join(', ')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Squad Panel & Stats Hover */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* Squad status */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm tracking-wide uppercase text-zinc-400">Your Active Team</span>
                <span className="font-mono text-xs font-extrabold bg-red-950 text-red-400 border border-red-900 px-2.5 py-0.5 rounded-full">
                  {customTeam.length}/6
                </span>
              </div>

              {customTeam.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-600">
                  <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">No partners selected.<br/>Select 6 above to start your draft.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto mb-4 pr-1">
                  {customTeam.map((name) => {
                    const pokemon = POKEMON_DATABASE[name];
                    return (
                      <div
                        key={name}
                        className="flex justify-between items-center bg-zinc-950 border border-zinc-900 rounded-lg py-2 px-3 hover:bg-zinc-900 group/item transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonId(pokemon?.name || '')}.png`}
                            alt={pokemon?.name}
                            className="w-8 h-8 object-contain filter drop-shadow"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-xs font-extrabold text-zinc-300">{pokemon?.name}</span>
                        </div>
                        <button
                          id={`btn-remove-${name}`}
                          onClick={() => { playClick(); handleRemovePokemon(name); }}
                          className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-950/20 opacity-0 group-hover/item:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirm custom draft */}
              <button
                id="btn-confirm-custom-team"
                disabled={customTeam.length !== 6}
                onClick={() => { playClick(); handleConfirmCustomTeam(); }}
                className="w-full bg-red-600 disabled:bg-zinc-800 hover:bg-red-500 text-white disabled:text-zinc-500 font-extrabold text-xs md:text-sm py-3 px-4 rounded-xl transition-all duration-200 tracking-wider font-mono hover:scale-102 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> LOCK IN CUSTOM TEAM
              </button>
            </div>

            {/* Hover details / Pokemon Encyclopedia info card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex-1 h-fit min-h-[480px]">
              {hoveredPokemon ? (
                <div className="animate-fade-in text-xs">
                  {/* Large high-res official artwork representation */}
                  <div className="w-full h-32 mb-4 bg-zinc-950/80 rounded-xl flex items-center justify-center relative overflow-hidden border border-zinc-850">
                    <div className="absolute inset-0 bg-radial from-red-500/10 via-transparent to-transparent pointer-events-none" />
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getPokemonId(hoveredPokemon.name)}.png`}
                      alt={hoveredPokemon.name}
                      className="w-24 h-24 object-contain filter drop-shadow hover:scale-110 transition-transform duration-300 animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-extrabold text-sm text-red-400">{hoveredPokemon.name}</span>
                    {hoveredPokemon.types.map(t => (
                      <span key={t} className="text-[8px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">{t}</span>
                    ))}
                  </div>
                  
                  {/* Stats bars */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-zinc-400 font-mono">
                      <span>HP:</span>
                      <span className="text-zinc-200 font-bold">{hoveredPokemon.hp}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (hoveredPokemon.hp / 160) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-zinc-400 font-mono">
                      <span>Physical Attack:</span>
                      <span className="text-zinc-200 font-bold">{hoveredPokemon.attack}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${Math.min(100, (hoveredPokemon.attack / 160) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-zinc-400 font-mono">
                      <span>Physical Defense:</span>
                      <span className="text-zinc-200 font-bold">{hoveredPokemon.defense}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (hoveredPokemon.defense / 200) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-zinc-400 font-mono">
                      <span>Special Attack:</span>
                      <span className="text-zinc-200 font-bold">{hoveredPokemon.spAttack}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-fuchsia-500 h-full" style={{ width: `${Math.min(100, (hoveredPokemon.spAttack / 160) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-zinc-400 font-mono">
                      <span>Special Defense:</span>
                      <span className="text-zinc-200 font-bold">{hoveredPokemon.spDefense}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full" style={{ width: `${Math.min(100, (hoveredPokemon.spDefense / 200) * 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-zinc-400 font-mono">
                      <span>Initiative / Speed:</span>
                      <span className="text-zinc-200 font-bold">{hoveredPokemon.speed}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (hoveredPokemon.speed / 130) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 border-t border-zinc-800 pt-2 text-[10px] text-zinc-400 leading-relaxed">
                    <span className="font-extrabold text-zinc-200 uppercase">Default Moveset:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono text-zinc-300">
                      {hoveredPokemon.moves.map(m => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[480px] text-center text-zinc-600">
                  <Info className="w-5 h-5 mb-1.5 opacity-40" />
                  <p className="text-[10px]">Hover over any Pokémon to view detailed stats, typings, and diagnostic movesets.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
