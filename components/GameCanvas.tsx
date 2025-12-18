
import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { GameItem, GameMode } from '../types';

interface GameCanvasProps {
  score: number;
  onScore: (value: number, player: 1 | 2) => void;
  onMiss: () => void;
  onBombHit: () => void;
  onZeroScore: (player: 1 | 2) => void;
  onHeal: (amount: number) => void;
  isPlaying: boolean;
  lives: number;
  gameMode: GameMode;
  activeCharacter: string;
  activeBackground: string;
  activeDrugEffect: string | null;
  onConsumeShield: () => void; 
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  text?: string;
  size?: number;
  gravity?: number;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed?: number;
}

interface Building {
  x: number;
  w: number;
  h: number;
  type: number; 
  windows: {x: number, y: number, on: boolean}[];
}

const SPAWN_RATE = 0.035; 
const GRAVITY_SPEED_BASE = 3;
const PLAYER_WIDTH = 70;
const PLAYER_HEIGHT = 90;
const BANK_HEIGHT = 100;

// Physics
const MOVE_ACCEL = 1.5;
const MAX_SPEED = 12;
const FRICTION = 0.85;

// Market Prices
const VALUES = {
  GEM: 30000,
  PLATINUM: 18000,
  GOLD: 8000,
  BILL: 2000,
  COIN: 500,
  FAKE_BOMB: -500,
  POOP: -2000,
  URINE: 0,
  THUNDER: 0,
  MULTIPLIER: 0,
  MYSTERY: 0,
  CLOCK: 0
};

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  score,
  onScore, 
  onMiss, 
  onBombHit, 
  onZeroScore,
  onHeal,
  isPlaying, 
  lives, 
  gameMode,
  activeCharacter,
  activeBackground,
  activeDrugEffect,
  onConsumeShield
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs
  const itemsRef = useRef<GameItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailsRef = useRef<{x: number, y: number, age: number, color: string}[]>([]);
  const scoreRef = useRef(score);
  
  // Logic Refs
  const comboRef = useRef<number>(0);
  const multiplierTimeRef = useRef<number>(0); // Time remaining for X2
  const slowMoTimeRef = useRef<number>(0); // Time remaining for Slow Motion (Clock)
  
  // Screen Shake
  const shakeIntensityRef = useRef<number>(0);

  // Players
  const playerXRef = useRef<number>(0);
  const playerVelocityRef = useRef<number>(0); 
  const playerFrameRef = useRef<number>(0); // Animation frame
  const p1FreezeUntilRef = useRef<number>(0); // Timestamp for freeze

  // P2
  const player2XRef = useRef<number>(0);
  const player2VelocityRef = useRef<number>(0);
  const player2FrameRef = useRef<number>(0);
  const p2FreezeUntilRef = useRef<number>(0);

  const keysPressedRef = useRef<Set<string>>(new Set()); 
  
  // Animation Refs
  const bagScaleXRef = useRef<number>(1); 
  const bagScaleYRef = useRef<number>(1); 
  const hitFlashRef = useRef<string | null>(null);
  const splatterOpacityRef = useRef<number>(0);
  const peeOverlayOpacityRef = useRef<number>(0);
  const lightningFlashRef = useRef<number>(0); // Opacity for lightning flash

  // Background Refs
  const rainRef = useRef<RainDrop[]>([]);
  const starsRef = useRef<Star[]>([]);
  const buildingsRef = useRef<Building[]>([]);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update score ref whenever prop changes to avoid stale closure in game loop
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Init Fever Drug
  useEffect(() => {
     if (isPlaying && activeDrugEffect === 'FEVER_START') {
         multiplierTimeRef.current = 60 * 20; // 20 Seconds (approx 60fps)
     }
  }, [isPlaying, activeDrugEffect]);

  // Generate Background Elements & Initialize Positions
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        setDimensions({ width: w, height: h });
        
        // Initialize Positions based on mode
        if (gameMode === 'VERSUS') {
            player2XRef.current = w * 0.25; // P2 Left Center
            playerXRef.current = w * 0.75;  // P1 Right Center
        } else {
            playerXRef.current = w / 2;
            player2XRef.current = -100; // Offscreen
        }

        // --- BG GENERATION ---
        const newBuildings: Building[] = [];
        let cx = 0;
        while(cx < w) {
           const bw = 30 + Math.random() * 60;
           let bh = 100 + Math.random() * 200;
           if (activeBackground === 'bg_sewer') bh = 50 + Math.random() * 100;
           if (activeBackground === 'bg_vault') bh = 80 + Math.random() * 150;
           if (activeBackground === 'bg_ocean') bh = 40 + Math.random() * 80;
           const windows = [];
           for(let wy = 10; wy < bh - 10; wy += 15) {
             for(let wx = 5; wx < bw - 5; wx += 12) {
               if(Math.random() > 0.4) windows.push({ x: wx, y: wy, on: Math.random() > 0.5 });
             }
           }
           newBuildings.push({ x: cx, w: bw, h: bh, windows, type: 0 });
           cx += bw - 5; 
        }
        buildingsRef.current = newBuildings;
        
        const rain: RainDrop[] = [];
        for(let i=0; i<100; i++) rain.push({ x: Math.random() * w, y: Math.random() * h, length: 10 + Math.random() * 20, speed: 10 + Math.random() * 10, opacity: 0.1 + Math.random() * 0.3 });
        rainRef.current = rain;

        const stars: Star[] = [];
        for(let i=0; i<80; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2, opacity: Math.random(), speed: Math.random() * 0.5 });
        starsRef.current = stars;
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, [activeBackground, isPlaying, gameMode]);

  // Keyboard Handlers
  useEffect(() => {
     const onKeyDown = (e: KeyboardEvent) => keysPressedRef.current.add(e.key.toLowerCase());
     const onKeyUp = (e: KeyboardEvent) => keysPressedRef.current.delete(e.key.toLowerCase());
     window.addEventListener('keydown', onKeyDown);
     window.addEventListener('keyup', onKeyUp);
     return () => {
         window.removeEventListener('keydown', onKeyDown);
         window.removeEventListener('keyup', onKeyUp);
     };
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const spawnItem = (laneOffset: number = 0, laneWidth: number = dimensions.width) => {
      const rand = Math.random();
      let type: GameItem['type'] = 'COIN_GOLD';
      let value = VALUES.GOLD;
      let radius = 12;
      
      let gravityMult = activeCharacter === 'char_astro' ? 0.85 : 1.0;
      if (activeDrugEffect === 'SLOW') gravityMult *= 0.65;
      
      // Global Slow Mo (Clock Effect)
      if (slowMoTimeRef.current > 0) gravityMult *= 0.4;

      let speed = (GRAVITY_SPEED_BASE + Math.random() * 2) * gravityMult;
      const kingBonus = activeCharacter === 'char_king' ? 0.15 : 0;
      const catBonus = activeCharacter === 'char_cat' ? 0.08 : 0;
      const jesterChaos = activeCharacter === 'char_jester' ? 0.1 : 0;
      const frenzyBonus = activeDrugEffect === 'FRENZY' ? 0.3 : 0; // Much more coins

      // Drop Rates
      if (gameMode === 'VERSUS' && rand < 0.05) {
          type = 'THUNDER'; value = 0; radius = 25; speed = (GRAVITY_SPEED_BASE * 1.8) * gravityMult;
      } else if (rand < 0.04) { 
        type = 'URINE'; value = VALUES.URINE; radius = 20; speed = (GRAVITY_SPEED_BASE * 1.6) * gravityMult;
      } else if (rand < 0.16 - catBonus + jesterChaos) {
        type = 'BOMB'; value = VALUES.POOP; radius = 18; speed = (GRAVITY_SPEED_BASE * 1.5) * gravityMult;
      } else if (rand < 0.22) {
        type = 'FAKE_BOMB'; value = VALUES.FAKE_BOMB; radius = 16; speed = (GRAVITY_SPEED_BASE * 1.4) * gravityMult;
      } else if (rand < 0.25) {
        type = 'MYSTERY'; value = 0; radius = 24; speed = (GRAVITY_SPEED_BASE * 2.0) * gravityMult;
      } else if (rand < 0.28) {
        type = 'CLOCK'; value = 0; radius = 20; speed = (GRAVITY_SPEED_BASE * 1.2) * gravityMult;
      } else if (rand < 0.31) {
        type = 'MULTIPLIER'; value = 0; radius = 25; speed = (GRAVITY_SPEED_BASE * 2.5) * gravityMult;
      } else if (rand < 0.40 - kingBonus) {
        type = 'BILL'; value = VALUES.BILL; radius = 22; speed = (GRAVITY_SPEED_BASE * 1.1) * gravityMult; 
      } else if (rand < 0.50) {
        type = 'GEM'; value = VALUES.GEM; radius = 16; speed = (GRAVITY_SPEED_BASE * 3.0) * gravityMult; 
      } else if (rand < 0.58 + kingBonus) {
        type = 'COIN_PLATINUM'; value = VALUES.PLATINUM; radius = 20; speed = (GRAVITY_SPEED_BASE * 2.2) * gravityMult;
      } else if (rand < 0.75 - frenzyBonus) {
        type = 'COIN_SILVER'; value = VALUES.COIN; radius = 12; speed = (GRAVITY_SPEED_BASE * 1.8) * gravityMult;
      } else {
        type = 'COIN_GOLD'; value = VALUES.GOLD; radius = 20; speed = (GRAVITY_SPEED_BASE * 2.0) * gravityMult;
      }

      let spawnX = laneOffset + Math.random() * (laneWidth - 60) + 30;

      itemsRef.current.push({
        id: Date.now() + Math.random(),
        x: spawnX,
        y: BANK_HEIGHT - 20, 
        speed,
        type,
        value,
        radius,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    };

    const triggerShake = (intensity: number) => {
        shakeIntensityRef.current = intensity;
    };

    const update = () => {
      const keys = keysPressedRef.current;
      playerFrameRef.current += 0.15;
      const now = Date.now();
      
      // Decay Effects
      if (shakeIntensityRef.current > 0) {
          shakeIntensityRef.current *= 0.9;
          if (shakeIntensityRef.current < 0.5) shakeIntensityRef.current = 0;
      }
      if (lightningFlashRef.current > 0) lightningFlashRef.current -= 0.1;
      if (multiplierTimeRef.current > 0) multiplierTimeRef.current--;
      if (slowMoTimeRef.current > 0) slowMoTimeRef.current--;

      const isFever = multiplierTimeRef.current > 0;
      
      // --- PHYSICS ---
      if (isPlaying) {
          let accel = MOVE_ACCEL;
          let maxSpeed = MAX_SPEED;
          
          if (activeDrugEffect === 'SPEED') { accel *= 1.8; maxSpeed *= 1.5; }
          // Giant Size (Hitbox) is handled in collision
          
          if (activeCharacter === 'char_alien') { if (keys.size === 0) playerVelocityRef.current *= 0.5; }

          // --- PLAYER 1 PHYSICS (ARROWS -> RIGHT SIDE IN VERSUS) ---
          const p1Frozen = now < p1FreezeUntilRef.current;
          if (!p1Frozen) {
              if (keys.has('arrowleft')) playerVelocityRef.current -= accel;
              if (keys.has('arrowright')) playerVelocityRef.current += accel;
              playerVelocityRef.current = Math.max(-maxSpeed, Math.min(maxSpeed, playerVelocityRef.current));
          } else {
              playerVelocityRef.current *= 0.5; // Slide when frozen
          }
          playerXRef.current += playerVelocityRef.current;
          playerVelocityRef.current *= FRICTION;

          // --- PLAYER 2 PHYSICS (WASD -> LEFT SIDE IN VERSUS) ---
          if (gameMode === 'VERSUS') {
             const p2Frozen = now < p2FreezeUntilRef.current;
             if (!p2Frozen) {
                 if (keys.has('a')) player2VelocityRef.current -= accel;
                 if (keys.has('d')) player2VelocityRef.current += accel;
                 player2VelocityRef.current = Math.max(-maxSpeed, Math.min(maxSpeed, player2VelocityRef.current));
             } else {
                 player2VelocityRef.current *= 0.5; // Slide
             }
             player2XRef.current += player2VelocityRef.current;
             player2VelocityRef.current *= FRICTION;
          }

          // --- BOUNDARY CLAMPING ---
          let margin = PLAYER_WIDTH / 2;
          if (activeDrugEffect === 'GIANT') margin *= 1.5;

          if (gameMode === 'VERSUS') {
              const midPoint = dimensions.width / 2;
              
              // P1 (Right Side)
              if (playerXRef.current < midPoint + margin) { playerXRef.current = midPoint + margin; playerVelocityRef.current = 0; }
              if (playerXRef.current > dimensions.width - margin) { playerXRef.current = dimensions.width - margin; playerVelocityRef.current = 0; }
              
              // P2 (Left Side)
              if (player2XRef.current < margin) { player2XRef.current = margin; player2VelocityRef.current = 0; }
              if (player2XRef.current > midPoint - margin) { player2XRef.current = midPoint - margin; player2VelocityRef.current = 0; }
          } else {
              // Single Player
              if (playerXRef.current < margin) { playerXRef.current = margin; playerVelocityRef.current = 0; }
              if (playerXRef.current > dimensions.width - margin) { playerXRef.current = dimensions.width - margin; playerVelocityRef.current = 0; }
          }
      }

      // --- SPAWNING ---
      if (isPlaying && Math.random() < SPAWN_RATE) {
          if (gameMode === 'VERSUS') {
              const zoneWidth = dimensions.width / 2;
              spawnItem(0, zoneWidth); // Left Spawn (P2)
              spawnItem(zoneWidth, zoneWidth); // Right Spawn (P1)
          } else {
              spawnItem(0, dimensions.width);
          }
      }

      // --- RENDER BACKGROUND ---
      // Apply Shake
      ctx.save();
      if (shakeIntensityRef.current > 0) {
          const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
          const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
          ctx.translate(dx, dy);
      }
      
      // Fever Distortion (Chromatic Aberration Simulation via Offset Drawing)
      if (isFever) {
          ctx.globalCompositeOperation = 'source-over';
      }

      // Base Color
      let bgColor1 = '#0f172a'; let bgColor2 = '#1e293b';
      switch(activeBackground) {
          case 'bg_vault': bgColor1='#422006'; bgColor2='#713f12'; break;
          case 'bg_sewer': bgColor1='#022c22'; bgColor2='#14532d'; break;
          case 'bg_space': bgColor1='#000000'; bgColor2='#1e1b4b'; break;
          case 'bg_jungle': bgColor1='#064e3b'; bgColor2='#365314'; break;
          case 'bg_desert': bgColor1='#451a03'; bgColor2='#d97706'; break;
          case 'bg_ocean': bgColor1='#0c4a6e'; bgColor2='#0369a1'; break;
          case 'bg_cyber': bgColor1='#2e1065'; bgColor2='#db2777'; break;
          case 'bg_hell': bgColor1='#450a0a'; bgColor2='#7f1d1d'; break;
          case 'bg_snow': bgColor1='#64748b'; bgColor2='#cbd5e1'; break;
      }
      const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
      gradient.addColorStop(0, bgColor1); gradient.addColorStop(1, bgColor2);
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Stars
      if (['bg_space','bg_cyber'].includes(activeBackground)) {
          ctx.fillStyle = '#fff'; 
          starsRef.current.forEach(star => { 
              if(star.speed) star.y += star.speed; 
              if(star.y > dimensions.height) star.y = 0;
              ctx.globalAlpha = star.opacity; ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI*2); ctx.fill(); 
          }); 
          ctx.globalAlpha = 1.0;
      }
      // Buildings
      const by = dimensions.height;
      buildingsRef.current.forEach((b, i) => {
         const parallax = (playerXRef.current - dimensions.width/2) * 0.05 * (i%2===0?1:-1);
         const dx = b.x + parallax;
         ctx.fillStyle = activeBackground==='bg_vault'?'#b45309':(activeBackground==='bg_cyber'?'#1e1b4b':'#020617');
         ctx.fillRect(dx, by - b.h, b.w, b.h);
         b.windows.forEach(w => { if(w.on) { ctx.fillStyle = activeBackground==='bg_cyber'?'#22d3ee':'#fef3c7'; ctx.fillRect(dx+w.x, by-b.h+w.y, 4, 6); }});
      });

      // VERSUS SPLIT OVERLAY
      if (gameMode === 'VERSUS') {
          // P2 Zone (Red tint Left)
          const redGrad = ctx.createLinearGradient(0, 0, dimensions.width/2, 0);
          redGrad.addColorStop(0, 'rgba(239, 68, 68, 0.15)'); redGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
          ctx.fillStyle = redGrad; ctx.fillRect(0, 0, dimensions.width/2, dimensions.height);
          
          // P1 Zone (Blue tint Right)
          const blueGrad = ctx.createLinearGradient(dimensions.width/2, 0, dimensions.width, 0);
          blueGrad.addColorStop(0, 'rgba(59, 130, 246, 0.02)'); blueGrad.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
          ctx.fillStyle = blueGrad; ctx.fillRect(dimensions.width/2, 0, dimensions.width/2, dimensions.height);

          // Divider
          ctx.beginPath(); ctx.moveTo(dimensions.width/2, 40); ctx.lineTo(dimensions.width/2, dimensions.height);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.stroke(); ctx.setLineDash([]);
          
          // Floor Markers
          ctx.fillStyle = 'rgba(239,68,68,0.5)'; ctx.fillRect(0, dimensions.height - 10, dimensions.width/2, 10);
          ctx.fillStyle = 'rgba(59,130,246,0.5)'; ctx.fillRect(dimensions.width/2, dimensions.height - 10, dimensions.width/2, 10);
      }

      // Rain
      const rainDensity = (gameMode === 'SURVIVAL' && lives <= 2) ? 2 : 0.5;
      ctx.lineWidth = 1; ctx.strokeStyle = activeBackground === 'bg_hell' ? '#fca5a5' : '#94a3b8';
      for(const r of rainRef.current) { if(Math.random()>rainDensity) continue; r.y += r.speed; if(r.y>dimensions.height) r.y=-20; ctx.globalAlpha=r.opacity; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x-2, r.y+r.length); ctx.stroke(); }
      ctx.globalAlpha = 1.0;
      
      // Speed Lines
      if (isPlaying && (Math.abs(playerVelocityRef.current) > 8 || activeDrugEffect === 'SPEED' || isFever)) {
          ctx.strokeStyle = isFever ? `hsl(${now % 360}, 100%, 70%)` : 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 2;
          for(let i=0; i<5; i++) {
              const lx = Math.random() * dimensions.width;
              const ly = Math.random() * dimensions.height;
              ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 100); ctx.stroke();
          }
      }

      // Draw Bank Top
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, dimensions.width, 40);
      
      // --- HIGH QUALITY CHARACTER RENDERER ---
      const drawHighQualityChar = (x: number, y: number, skin: string, isP2 = false, velocity: number, isFrozen: boolean) => {
         ctx.save();
         ctx.translate(x, y);

         // Giant Drug
         if (activeDrugEffect === 'GIANT' && !isP2) {
             ctx.scale(1.5, 1.5);
         }

         // Walking Bob
         const bob = Math.sin(playerFrameRef.current) * 3;
         const lean = velocity * 0.05; // Lean into movement
         ctx.rotate(lean);

         // Draw Bag
         ctx.save();
         ctx.translate(25, 10 + bob);
         ctx.rotate(-0.2);
         const sackGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
         sackGrad.addColorStop(0, '#f59e0b'); sackGrad.addColorStop(1, '#92400e');
         ctx.fillStyle = sackGrad;
         ctx.beginPath();
         ctx.roundRect(-20, -25, 45, 55, 15);
         ctx.fill();
         ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.stroke();
         ctx.fillStyle = '#fff9c4'; ctx.font='bold 24px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$', 2, 0);
         ctx.restore();

         // --- BASE BODY SHAPE ---
         const drawBean = (colorMain: string, colorDark: string) => {
             const bodyGrad = ctx.createLinearGradient(-20, -40, 20, 40);
             bodyGrad.addColorStop(0, colorMain); bodyGrad.addColorStop(1, colorDark);
             ctx.fillStyle = bodyGrad;
             
             // Legs
             ctx.fillStyle = colorDark;
             const legOffset = Math.sin(playerFrameRef.current * 1.5) * 10;
             ctx.beginPath(); ctx.roundRect(-20 + legOffset, 35, 12, 18, 5); ctx.fill(); // Left Leg
             ctx.beginPath(); ctx.roundRect(8 - legOffset, 35, 12, 18, 5); ctx.fill();  // Right Leg

             // Main Torso
             ctx.fillStyle = bodyGrad;
             ctx.beginPath();
             ctx.roundRect(-25, -45, 50, 85, 25);
             ctx.fill();
         };

         // --- EYES ---
         const drawEyes = (color: string = 'black', mask = false) => {
             if (mask) {
                ctx.fillStyle = '#1e293b'; 
                ctx.beginPath(); ctx.roundRect(-24, -25, 48, 18, 8); ctx.fill();
             }
             ctx.fillStyle = 'white';
             ctx.beginPath(); ctx.ellipse(-10, -16, 8, 10, 0, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.ellipse(10, -16, 8, 10, 0, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = color;
             ctx.beginPath(); ctx.arc(-10, -16, 4, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(10, -16, 4, 0, Math.PI*2); ctx.fill();
         };

         if (isP2) {
             drawBean('#ef4444', '#b91c1c'); // Red
             drawEyes('black', true);
             ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.arc(0, -42, 22, Math.PI, 0); ctx.fill();
             ctx.beginPath(); ctx.arc(0, -64, 5, 0, Math.PI*2); ctx.fill();
         } else {
             // SKINS
             switch(skin) {
                 case 'char_robot': drawBean('#94a3b8', '#475569'); ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.roundRect(-15, 0, 30, 25, 4); ctx.fill(); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 12, 6, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.roundRect(-20, -25, 40, 16, 4); ctx.fill(); ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.rect(-15, -22, 30, 10); ctx.fill(); break;
                 case 'char_alien': drawBean('#4ade80', '#16a34a'); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.ellipse(-12, -20, 10, 14, -0.2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(12, -20, 10, 14, 0.2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-8, -24, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(15, -24, 3, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle='#16a34a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-45); ctx.lineTo(0,-55); ctx.stroke(); break;
                 case 'char_banker': drawBean('#1e293b', '#0f172a'); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.moveTo(-10,-40); ctx.lineTo(10,-40); ctx.lineTo(0,-20); ctx.fill(); ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(0, -30, 4, 0, Math.PI*2); ctx.fill(); drawEyes('black'); ctx.strokeStyle = '#facc15'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(10, -16, 8, 0, Math.PI*2); ctx.stroke(); ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.rect(-25, -55, 50, 8); ctx.fill(); ctx.beginPath(); ctx.rect(-18, -85, 36, 30); ctx.fill(); break;
                 case 'char_ninja': drawBean('#171717', '#000000'); ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.rect(-20, 0, 40, 8); ctx.fill(); ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.roundRect(-18, -28, 36, 14, 4); ctx.fill(); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-8, -22, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8, -22, 3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(22, -35, 6, 0, Math.PI*2); ctx.fill(); break;
                 case 'char_pirate': drawBean('#fff', '#cbd5e1'); ctx.fillStyle = '#3b82f6'; for(let y=-30; y<30; y+=10) ctx.fillRect(-20, y, 40, 4); ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.rect(-25, -45, 12, 40); ctx.rect(13, -45, 12, 40); ctx.fill(); ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.roundRect(-20, -45, 40, 20, 8); ctx.fill(); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-8, -35, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8,-35); ctx.lineTo(20,-45); ctx.stroke(); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(8, -35, 3, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.moveTo(-35, -45); ctx.quadraticCurveTo(0, -70, 35, -45); ctx.lineTo(0, -55); ctx.fill(); break;
                 case 'char_astro': drawBean('#f8fafc', '#cbd5e1'); ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.rect(-15, 0, 30, 20); ctx.fill(); ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(0, -30, 28, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(0, -30, 22, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(0, -28, 12, 0, Math.PI*2); ctx.fill(); drawEyes('black'); break;
                 case 'char_cat': drawBean('#fbbf24', '#d97706'); ctx.fillStyle = '#fff7ed'; ctx.beginPath(); ctx.ellipse(0, 10, 12, 18, 0, 0, Math.PI*2); ctx.fill(); drawEyes('black'); ctx.fillStyle = 'pink'; ctx.beginPath(); ctx.moveTo(-3,-10); ctx.lineTo(3,-10); ctx.lineTo(0,-6); ctx.fill(); ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(-15,-40); ctx.lineTo(-25,-55); ctx.lineTo(-5,-45); ctx.fill(); ctx.beginPath(); ctx.moveTo(15,-40); ctx.lineTo(25,-55); ctx.lineTo(5,-45); ctx.fill(); break;
                 case 'char_ghost': ctx.globalAlpha = 0.8; drawBean('#f8fafc', '#cbd5e1'); ctx.globalAlpha = 1.0; ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(-10, -20, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -20, 5, 0, Math.PI*2); ctx.fill(); break;
                 case 'char_king': drawBean('#7e22ce', '#581c87'); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.rect(-10, -45, 20, 85); ctx.fill(); drawEyes(); ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.moveTo(-20,-40); ctx.lineTo(-20,-65); ctx.lineTo(-10,-50); ctx.lineTo(0,-68); ctx.lineTo(10,-50); ctx.lineTo(20,-65); ctx.lineTo(20,-40); ctx.fill(); break;
                 
                 // NEW SKINS
                 case 'char_vampire': drawBean('#1e293b', '#000'); ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.ellipse(0, -30, 18, 20, 0, 0, Math.PI*2); ctx.fill(); drawEyes('red'); ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(0,-50); ctx.lineTo(-10,-40); ctx.lineTo(10,-40); ctx.fill(); ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(-25,-40); ctx.lineTo(-40, 0); ctx.lineTo(-25, 40); ctx.lineTo(25, 40); ctx.lineTo(40,0); ctx.lineTo(25,-40); ctx.fill(); break;
                 case 'char_zombie': drawBean('#65a30d', '#3f6212'); drawEyes('white'); ctx.fillStyle='pink'; ctx.beginPath(); ctx.arc(-10,-45, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#84cc16'; ctx.beginPath(); ctx.rect(-20,0,40,30); ctx.fill(); break;
                 case 'char_cyborg': drawBean('#94a3b8', '#475569'); ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(8, -16, 6, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle='#ef4444'; ctx.beginPath(); ctx.moveTo(8,-16); ctx.lineTo(20,-25); ctx.stroke(); drawEyes('white'); break;
                 case 'char_wizard': drawBean('#1e3a8a', '#172554'); ctx.fillStyle='#facc15'; ctx.font='20px serif'; ctx.fillText('★', -10, 0); ctx.fillText('★', 5, 20); drawEyes(); ctx.fillStyle='#1e3a8a'; ctx.beginPath(); ctx.moveTo(-30,-40); ctx.lineTo(0,-90); ctx.lineTo(30,-40); ctx.fill(); break;
                 case 'char_jester': drawBean('#a855f7', '#7e22ce'); ctx.fillStyle='#facc15'; ctx.beginPath(); ctx.rect(-10, -45, 20, 90); ctx.fill(); drawEyes(); ctx.fillStyle='#a855f7'; ctx.beginPath(); ctx.moveTo(-20,-40); ctx.lineTo(-30,-60); ctx.lineTo(-10,-50); ctx.fill(); ctx.fillStyle='#facc15'; ctx.beginPath(); ctx.moveTo(20,-40); ctx.lineTo(30,-60); ctx.lineTo(10,-50); ctx.fill(); break;

                 default: drawBean('#fff', '#cbd5e1'); ctx.fillStyle = '#1e293b'; for(let y=-30; y<40; y+=10) ctx.fillRect(-22, y, 44, 4); drawEyes('black', true); ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(0, -42, 22, Math.PI, 0); ctx.fill(); break;
             }
         }
         
         // ICE BLOCK IF FROZEN
         if (isFrozen) {
             ctx.fillStyle = 'rgba(147, 197, 253, 0.6)'; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-40, -70, 80, 120, 10); ctx.fill(); ctx.stroke();
         }

         ctx.restore();
      };

      const nowP1Frozen = now < p1FreezeUntilRef.current;
      const nowP2Frozen = now < p2FreezeUntilRef.current;

      drawHighQualityChar(playerXRef.current, dimensions.height - PLAYER_HEIGHT + 20, activeCharacter, false, playerVelocityRef.current, nowP1Frozen);
      if (gameMode === 'VERSUS') {
          drawHighQualityChar(player2XRef.current, dimensions.height - PLAYER_HEIGHT + 20, 'char_default', true, player2VelocityRef.current, nowP2Frozen);
      }

      // --- ITEMS & COLLISIONS ---
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        if (isPlaying) { 
            let itemSpeed = item.speed;
            if (slowMoTimeRef.current > 0) itemSpeed *= 0.4; // Global Slow Motion
            
            item.y += itemSpeed; 
            item.rotation += item.rotationSpeed; 

            if (activeDrugEffect === 'MAGNET' && !['BOMB', 'FAKE_BOMB', 'URINE', 'THUNDER'].includes(item.type)) {
                const p1Dist = Math.hypot(playerXRef.current - item.x, (dimensions.height - PLAYER_HEIGHT) - item.y);
                if (p1Dist < 200) { item.x += (playerXRef.current - item.x)*0.05; item.y += 10; }
            }
            
            // Add Trails
            if (['GEM', 'PLATINUM', 'MULTIPLIER', 'MYSTERY'].includes(item.type) || isFever) {
                if (Math.random() > 0.5) {
                    trailsRef.current.push({ x: item.x, y: item.y, age: 1.0, color: item.type === 'MULTIPLIER' ? '#f0f' : '#fff' });
                }
            }
        }
        
        // Collision Checks
        const p1Y = dimensions.height - PLAYER_HEIGHT + 10;
        const distP1 = Math.hypot(playerXRef.current - item.x, p1Y - item.y);
        let catchRadius = item.radius + 45;
        if (activeDrugEffect === 'GIANT') catchRadius += 25;

        let catchP1 = distP1 < catchRadius;
        let catchP2 = false;
        
        if (gameMode === 'VERSUS') {
             const distP2 = Math.hypot(player2XRef.current - item.x, p1Y - item.y);
             catchP2 = distP2 < (item.radius + 45);
             if (item.x < dimensions.width/2 && catchP1) catchP1 = false;
             if (item.x > dimensions.width/2 && catchP2) catchP2 = false;
        }

        if ((catchP1 || catchP2) && isPlaying) {
             let scoreValue = item.value;
             let isBomb = item.type === 'BOMB';

             // Multiplier Handling
             if (catchP1 && multiplierTimeRef.current > 0 && scoreValue > 0) {
                 scoreValue *= 2;
             }

             // Bonuses
             if (catchP1 && activeCharacter === 'char_banker' && scoreValue > 0) scoreValue = Math.floor(scoreValue * 1.1);
             if (catchP1 && activeCharacter === 'char_pirate' && ['COIN_GOLD','COIN_SILVER'].includes(item.type)) scoreValue = Math.floor(scoreValue * 1.25);
             if (activeDrugEffect === 'GREED' && scoreValue > 0) scoreValue *= 2;
             
             // ALCHEMY
             if (activeDrugEffect === 'ALCHEMY' && activeCharacter === 'char_wizard' && isBomb) {
                 scoreValue = 1000;
                 isBomb = false;
                 particlesRef.current.push({ x: item.x, y: item.y, vx: 0, vy: -2, life: 1, color: '#fbbf24', text: 'ALCHEMY!' });
             }

             itemsRef.current.splice(i, 1);
             bagScaleYRef.current = 1.35; bagScaleXRef.current = 0.85; 

             // Handle Specials
             if (item.type === 'MULTIPLIER') {
                 if (catchP1) {
                     multiplierTimeRef.current = 600; // 10 seconds approx
                     triggerShake(10);
                     particlesRef.current.push({ x: item.x, y: item.y, vx: 0, vy: -5, life: 2, color: '#d8b4fe', text: 'FEVER X2!' });
                 }
             } else if (item.type === 'CLOCK') {
                 // Slow Motion Effect
                 slowMoTimeRef.current = 300; // 5 Seconds approx
                 particlesRef.current.push({ x: item.x, y: item.y, vx: 0, vy: -2, life: 1, color: '#22d3ee', text: 'SLOW MOTION!' });
             } else if (item.type === 'MYSTERY') {
                 const outcome = Math.random();
                 if (outcome < 0.3) {
                     onScore(50000, catchP1 ? 1 : 2); // Jackpot
                     particlesRef.current.push({ x: item.x, y: item.y, vx: 0, vy: -5, life: 2, color: '#fbbf24', text: 'JACKPOT!' });
                 } else if (outcome < 0.5) {
                     onBombHit(); // Trap
                     particlesRef.current.push({ x: item.x, y: item.y, vx: 0, vy: -2, life: 1, color: '#ef4444', text: 'TRAP!' });
                 } else {
                     onScore(5000, catchP1 ? 1 : 2);
                 }
             } else if (item.type === 'THUNDER') {
                 lightningFlashRef.current = 1.0;
                 if (catchP1) { p2FreezeUntilRef.current = Date.now() + 2000; triggerShake(15); } 
                 else { p1FreezeUntilRef.current = Date.now() + 2000; triggerShake(15); }
             } else if (item.type === 'URINE') {
                 onZeroScore(catchP1 ? 1 : 2);
                 peeOverlayOpacityRef.current = 1.0;
                 comboRef.current = 0;
                 triggerShake(20);
             } else if (isBomb) {
                 // Zombie Immunity check
                 if (catchP1 && activeCharacter === 'char_zombie') {
                     onScore(-Math.floor(scoreRef.current/2), 1); // Lose half score but no hurt
                 } else {
                     if (catchP1) {
                        let shielded = activeDrugEffect === 'SHIELD';
                        if (!shielded && activeCharacter === 'char_ghost' && Math.random() < 0.25) shielded = true;
                        if (shielded) {
                            if(activeDrugEffect === 'SHIELD') onConsumeShield();
                            hitFlashRef.current = '#3b82f6';
                        } else {
                            onBombHit(); hitFlashRef.current = '#713f12'; splatterOpacityRef.current = 1.0;
                            comboRef.current = 0;
                            triggerShake(30);
                        }
                     } else {
                         onScore(scoreValue, 2);
                     }
                 }
             } else if (item.type === 'FAKE_BOMB') {
                 onScore(scoreValue, catchP1 ? 1 : 2);
             } else {
                onScore(scoreValue, catchP1 ? 1 : 2);
                if (catchP1) {
                    comboRef.current += 1;
                    if (comboRef.current % 10 === 0) {
                        particlesRef.current.push({ x: playerXRef.current, y: playerXRef.current - 50, vx: 0, vy: -3, life: 1.5, color: '#fcd34d', text: `COMBO ${comboRef.current}!` });
                    }
                }

                if (['GEM','PLATINUM'].includes(item.type)) triggerShake(5);
                
                particlesRef.current.push({ 
                    x: item.x, 
                    y: item.y - 20, 
                    vx: (Math.random()-0.5)*2, 
                    vy: -3 - Math.random()*2, 
                    life: 1.0, 
                    color: '#fff', 
                    text: `+$${scoreValue.toLocaleString()}`,
                    gravity: 0.1
                });
                
                for(let s=0; s<5; s++) {
                    particlesRef.current.push({
                         x: item.x, y: item.y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 0.8, color: item.type === 'GEM' ? '#3b82f6' : '#fcd34d', size: Math.random()*3
                    });
                }
             }
             continue;
        }

        if (item.y > dimensions.height + 20) {
            if (isPlaying && !['BOMB','FAKE_BOMB','URINE','THUNDER','MULTIPLIER','MYSTERY','CLOCK'].includes(item.type)) {
                onMiss();
                comboRef.current = 0; // Break combo
            }
            itemsRef.current.splice(i, 1); continue;
        }

        // Draw Item
        ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.rotation);
        
        if (item.type === 'MULTIPLIER') {
            const scale = 1 + Math.sin(now * 0.02) * 0.2;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#d8b4fe'; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#a855f7'; ctx.lineWidth=3; ctx.stroke();
            ctx.fillStyle = '#6b21a8'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('X2', 0, 0);
        } else if (item.type === 'CLOCK') {
            const pulse = 1 + Math.cos(now * 0.01) * 0.1;
            ctx.scale(pulse, pulse);
            ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#22d3ee'; ctx.lineWidth=2; ctx.stroke();
            ctx.strokeStyle = '#22d3ee'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(6,6); ctx.stroke();
        } else if (item.type === 'MYSTERY') {
             ctx.fillStyle = '#f59e0b'; ctx.fillRect(-15,-15,30,30);
             ctx.fillStyle = '#fff'; ctx.font='bold 20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?', 0, 0);
        } else if (item.type === 'THUNDER') {
            const pulse = 1 + Math.sin(now * 0.01) * 0.2;
            ctx.scale(pulse, pulse);
            ctx.fillStyle = '#7e22ce'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0, 15, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = '#facc15'; 
            ctx.beginPath(); ctx.moveTo(5, -10); ctx.lineTo(-2, 0); ctx.lineTo(4, 0); ctx.lineTo(-5, 12); ctx.lineTo(2, 2); ctx.lineTo(-4, 2); ctx.fill();
        } else if (item.type === 'URINE') {
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.roundRect(-12, -10, 24, 28, 5); ctx.fill();
            ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.roundRect(-12, 0, 24, 18, 5); ctx.fill(); 
            ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.rect(-5, -15, 10, 5); ctx.fill(); 
            ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.rect(-7, -18, 14, 3); ctx.fill(); 
            ctx.fillStyle = '#ca8a04'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('!', 0, 5);
        } else if (item.type === 'BOMB') {
           ctx.fillStyle = '#654321'; ctx.beginPath(); ctx.ellipse(0, 5, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
           ctx.beginPath(); ctx.ellipse(0, -3, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
           ctx.beginPath(); ctx.ellipse(0, -10, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
           ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-5, -2, 3, 0, Math.PI*2); ctx.arc(5, -2, 3, 0, Math.PI*2); ctx.fill();
           ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-5, -2, 1, 0, Math.PI*2); ctx.arc(5, -2, 1, 0, Math.PI*2); ctx.fill();
        } else if (item.type === 'FAKE_BOMB') {
            ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 2);
        } else if (item.type === 'BILL') {
            ctx.fillStyle = '#86efac'; ctx.strokeStyle = '#15803d'; ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(-18, -10, 36, 20, 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#15803d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
        } else if (item.type === 'COIN_GOLD' || item.type === 'COIN_PLATINUM') {
            const isPlat = item.type === 'COIN_PLATINUM';
            const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 20);
            grad.addColorStop(0, isPlat ? '#f8fafc' : '#fcd34d');
            grad.addColorStop(1, isPlat ? '#94a3b8' : '#d97706');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, item.radius, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = isPlat ? '#cbd5e1' : '#b45309'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = isPlat ? '#475569' : '#92400e'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$', 0, 1);
        } else if (item.type === 'GEM') {
            ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(12, -5); ctx.lineTo(0, 15); ctx.lineTo(-12, -5); ctx.closePath(); ctx.fill(); 
            ctx.strokeStyle = '#eff6ff'; ctx.lineWidth=2; ctx.stroke();
        } else { 
            ctx.beginPath(); ctx.arc(0, 0, item.radius, 0, Math.PI * 2); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Trails
      for (let i = trailsRef.current.length - 1; i >= 0; i--) {
          const t = trailsRef.current[i];
          t.age -= 0.05;
          if (t.age <= 0) { trailsRef.current.splice(i, 1); continue; }
          ctx.globalAlpha = t.age * 0.5;
          ctx.fillStyle = t.color;
          ctx.beginPath(); ctx.arc(t.x, t.y, 4, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 1.0;
      }

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]; 
        p.x += p.vx; p.y += p.vy; 
        if (p.gravity) p.vy += p.gravity;
        p.life -= 0.02;
        
        if (p.life <= 0) { particlesRef.current.splice(i, 1); continue; }
        
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.text) { 
            ctx.fillStyle = 'black'; ctx.font = 'bold 22px Inter'; ctx.fillText(p.text, p.x + 2, p.y + 2); // Shadow
            ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y); 
        } else if (p.size) {
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // Combo Rendering (Canvas Overlay)
      if (comboRef.current > 1 && isPlaying) {
          ctx.save();
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 16px Inter';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText(`COMBO x${comboRef.current}`, dimensions.width - 20, 50);
          ctx.restore();
      }
      
      // Splatters
      if (splatterOpacityRef.current > 0) {
          ctx.globalAlpha = splatterOpacityRef.current; 
          ctx.fillStyle = 'rgba(66, 33, 11, 0.8)'; ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          ctx.font = '80px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💩', dimensions.width/2, dimensions.height/2); 
          ctx.globalAlpha = 1.0; splatterOpacityRef.current -= 0.02;
      }

      if (peeOverlayOpacityRef.current > 0) {
          ctx.globalAlpha = peeOverlayOpacityRef.current; 
          ctx.fillStyle = 'rgba(234, 179, 8, 0.7)'; ctx.fillRect(0, 0, dimensions.width, dimensions.height); // Yellow tint
          ctx.fillStyle = 'white'; ctx.font = 'bold 40px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
          ctx.fillText('SCORE RESET!', dimensions.width/2, dimensions.height/2); 
          ctx.font = '20px Inter'; ctx.fillText('喝到尿了!', dimensions.width/2, dimensions.height/2 + 40);
          ctx.globalAlpha = 1.0; peeOverlayOpacityRef.current -= 0.015;
      }
      
      if (lightningFlashRef.current > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlashRef.current})`;
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      ctx.restore(); // Restore Shake

      // Slow Mo Overlay
      if (slowMoTimeRef.current > 0) {
          const alpha = Math.min(0.2, slowMoTimeRef.current / 100);
          ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          
          if (slowMoTimeRef.current > 60) {
             ctx.save();
             ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 10;
             ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Inter'; ctx.textAlign = 'center'; 
             ctx.fillText('SLOW MOTION', dimensions.width/2, dimensions.height/2 - 100);
             ctx.restore();
          }
      }

      // Lighting Overlay
      if (isPlaying) {
         const grad = ctx.createRadialGradient(dimensions.width/2, dimensions.height/2, 100, dimensions.width/2, dimensions.height/2, dimensions.width);
         grad.addColorStop(0, 'rgba(0,0,0,0)');
         grad.addColorStop(1, 'rgba(0,0,0,0.6)');
         ctx.fillStyle = grad; ctx.fillRect(0,0,dimensions.width, dimensions.height);
      }

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [dimensions, isPlaying, lives, gameMode, activeCharacter, activeBackground, activeDrugEffect]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-black overflow-hidden select-none outline-none touch-none"
    >
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="block relative z-10" />
      
      {/* Fever Overlay */}
      {multiplierTimeRef.current > 0 && (
          <div className="absolute inset-0 pointer-events-none border-[10px] border-purple-500/50 animate-pulse z-20 mix-blend-screen" 
               style={{ animation: 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      )}
    </div>
  );
};

export default GameCanvas;
