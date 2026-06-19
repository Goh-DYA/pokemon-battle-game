import React, { createContext, useContext, useState, useEffect } from 'react';
import { audio } from '../utils/audio';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playClick: () => void;
  playSwitch: () => void;
  playFaint: () => void;
  playHeal: () => void;
  playHit: (effectiveness?: number) => void;
  playAttack: () => void;
  playVictoryFanfare: () => void;
  startBgm: () => void;
  stopBgm: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioProviderProps {
  children: React.ReactNode;
  phase: string;
}

export function AudioProvider({ children, phase }: AudioProviderProps) {
  const [isMuted, setIsMuted] = useState<boolean>(audio.getMutedState());

  const toggleMute = () => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted && phase === 'BATTLE') {
      audio.startBgm();
    }
  };

  const playClick = () => audio.playClick();
  const playSwitch = () => audio.playSwitch();
  const playFaint = () => audio.playFaint();
  const playHeal = () => audio.playHeal();
  const playHit = (effectiveness = 1.0) => audio.playHit(effectiveness);
  const playAttack = () => audio.playAttack();
  const playVictoryFanfare = () => audio.playVictoryFanfare();
  const startBgm = () => audio.startBgm();
  const stopBgm = () => audio.stopBgm();

  // Keep mute state in sync if changed elsewhere
  useEffect(() => {
    setIsMuted(audio.getMutedState());
  }, []);

  // Loop battle track when phase is set to BATTLE
  useEffect(() => {
    if (phase === 'BATTLE') {
      audio.startBgm();
    } else {
      audio.stopBgm();
    }
    return () => {
      audio.stopBgm();
    };
  }, [phase]);

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        toggleMute,
        playClick,
        playSwitch,
        playFaint,
        playHeal,
        playHit,
        playAttack,
        playVictoryFanfare,
        startBgm,
        stopBgm,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
