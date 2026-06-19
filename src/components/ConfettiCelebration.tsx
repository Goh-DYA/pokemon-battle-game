import React, { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number; // horizontal starting percentage (0 - 100)
  y: number; // starting vertically above screen (-10 to -20)
  size: number; // size in pixels
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'ribbon';
  delay: number; // animation delay in seconds
  duration: number; // fall duration in seconds
  drift: number; // horizontal wobble amplitude
  rotation: number; // starting rotation in degrees
}

const CELEBRATION_COLORS = [
  '#fbbf24', // Amber
  '#f43f5e', // Rose / Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#8b5cf6', // Indigo / Purple
  '#ff7849', // Coral / Orange
];

const SHAPES: ('circle' | 'square' | 'triangle' | 'ribbon')[] = ['circle', 'square', 'triangle', 'ribbon'];

export function ConfettiCelebration({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFlash, setShowFlash] = useState<boolean>(false);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      setShowFlash(false);
      return;
    }

    // 1. Trigger brilliant full-screen retro flash
    setShowFlash(true);
    const flashTimer = setTimeout(() => {
      setShowFlash(false);
    }, 900);

    // 2. Generate a gorgeous cascade of randomized confetti particles
    const createdList: Particle[] = Array.from({ length: 90 }).map((_, idx) => {
      const size = Math.random() * 12 + 8; // width/height 8px - 20px
      const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const x = Math.random() * 100; // starting x across full screen width
      const y = -(Math.random() * 40 + 10); // starting position above screen viewport
      const delay = Math.random() * 2.0; // staggered drops
      const duration = Math.random() * 3.5 + 2.5; // fall speed 2.5s - 6s
      const drift = Math.random() * 90 - 45; // wobble width px
      const rotation = Math.random() * 360;

      return {
        id: idx,
        x,
        y,
        size,
        color,
        shape,
        delay,
        duration,
        drift,
        rotation,
      };
    });

    setParticles(createdList);

    return () => {
      clearTimeout(flashTimer);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div id="confetti-sky-canopy" className="absolute inset-0 pointer-events-none overflow-hidden z-40 select-none">
      
      {/* 1. Championship Stadium Flash Overlay */}
      {showFlash && (
        <div 
          id="stadium-victory-flash" 
          className="absolute inset-0 bg-white/75 mix-blend-screen animate-fade-out z-50 pointer-events-none"
          style={{
            animation: 'victoryFlashDecay 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        />
      )}

      {/* Styled inject for the keyframes so we don't pollute global css */}
      <style>{`
        @keyframes victoryFlashDecay {
          0% { opacity: 1; background-color: rgba(251, 191, 36, 0.5); }
          20% { background-color: rgba(255, 255, 255, 0.75); }
          100% { opacity: 0; background-color: rgba(255, 255, 255, 0); }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(115vh) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* 2. Confetti elements */}
      {particles.map((p) => {
        const shapeStyles: React.CSSProperties = {
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}px`,
          transform: `rotate(${p.rotation}deg)`,
          animationName: 'confettiFall',
          animationDuration: `${p.duration}s`,
          animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          animationDelay: `${p.delay}s`,
          animationIterationCount: 'infinite',
          willChange: 'transform, opacity',
        };

        if (p.shape === 'circle') {
          shapeStyles.borderRadius = '50%';
        } else if (p.shape === 'triangle') {
          shapeStyles.width = '0px';
          shapeStyles.height = '0px';
          shapeStyles.borderLeft = `${p.size / 2}px solid transparent`;
          shapeStyles.borderRight = `${p.size / 2}px solid transparent`;
          shapeStyles.borderBottom = `${p.size}px solid ${p.color}`;
        } else if (p.shape === 'ribbon') {
          shapeStyles.width = `${p.size / 2}px`;
          shapeStyles.height = `${p.size * 2}px`;
          shapeStyles.borderRadius = '4px';
        }

        return (
          <div
            key={p.id}
            id={`confetti-particle-${p.id}`}
            style={shapeStyles}
            className="shadow-sm"
          />
        );
      })}

      {/* 3. Concentrated victory sparkles at the center of the stadium */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-80 h-80 flex items-center justify-center">
          <div className="absolute w-full h-full bg-yellow-500/10 blur-3xl animate-pulse rounded-full" />
          
          {/* Subtle spinning glowing ring */}
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-amber-400/40 animate-[spin_12s_linear_infinite]" />
          <div className="absolute w-36 h-36 rounded-full border border-dashed border-rose-550/30 animate-[spin_8s_linear_infinite_reverse]" />
        </div>
      </div>

    </div>
  );
}
