
import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import ShopModal from './components/ShopModal';
import Prologue from './components/Prologue';
import { GameMode, StoreItem, PlayerInventory } from './types';

const TIME_LIMIT_DURATION = 60; // Seconds
const MAX_LIVES = 5;

// Initial Inventory
const INITIAL_INVENTORY: PlayerInventory = {
  ownedItems: ['char_default', 'bg_city'],
  activeCharacter: 'char_default',
  activeBackground: 'bg_city',
  activeDrug: null
};

type AppState = 'PROLOGUE' | 'MENU' | 'PLAYING' | 'GAMEOVER';

function App() {
  const [appState, setAppState] = useState<AppState>('PROLOGUE');
  const [gameMode, setGameMode] = useState<GameMode>('TIME');
  const [showShop, setShowShop] = useState(false);
  
  // Game Stats
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_DURATION);
  const [lives, setLives] = useState(MAX_LIVES);
  
  // P1 Stats
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [caught, setCaught] = useState(0);
  
  // P2 Stats (For Versus Mode)
  const [scoreP2, setScoreP2] = useState(0);

  // Persistence
  const [highScores, setHighScores] = useState<{TIME: number, SURVIVAL: number, VERSUS: number}>({ TIME: 0, SURVIVAL: 0, VERSUS: 0 });
  const [wallet, setWallet] = useState(0);
  const [inventory, setInventory] = useState<PlayerInventory>(INITIAL_INVENTORY);
  
  const timerIntervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);

  // Load Saved Data
  useEffect(() => {
    const savedScores = localStorage.getItem('money_catcher_scores');
    if (savedScores) setHighScores(JSON.parse(savedScores));

    const savedWallet = localStorage.getItem('money_catcher_wallet');
    if (savedWallet) setWallet(parseInt(savedWallet, 10));

    const savedInventory = localStorage.getItem('money_catcher_inventory');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
  }, []);

  // Save Inventory / Wallet changes
  const updateWallet = (newAmount: number) => {
    setWallet(newAmount);
    localStorage.setItem('money_catcher_wallet', newAmount.toString());
  };

  const updateInventory = (newInventory: PlayerInventory) => {
    setInventory(newInventory);
    localStorage.setItem('money_catcher_inventory', JSON.stringify(newInventory));
  };

  const saveHighScore = useCallback((newScore: number) => {
    setHighScores(prev => {
      const updated = {
        ...prev,
        [gameMode]: Math.max(prev[gameMode] || 0, newScore)
      };
      localStorage.setItem('money_catcher_scores', JSON.stringify(updated));
      return updated;
    });
  }, [gameMode]);

  // Consolidate Game Over Logic
  const endGame = useCallback(() => {
    setAppState('GAMEOVER');
    // Only save highscore for P1 in non-versus, or P1 score in Versus
    saveHighScore(score);
    
    // Add Score to Wallet - NOW GUARANTEED to have fresh 'score' and 'wallet' values
    let loot = score;
    // P2 loot isn't added to wallet for now, focusing on P1 economy
    
    if (loot > 0) {
      updateWallet(wallet + loot);
    }

    // Reset Active Drug
    if (inventory.activeDrug) {
       updateInventory({
         ...inventory,
         activeDrug: null
       });
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [score, wallet, inventory, saveHighScore, gameMode]); 

  // Monitor Game Over Conditions
  useEffect(() => {
    if (appState === 'PLAYING') {
      if (gameMode === 'SURVIVAL' && lives <= 0) {
        endGame();
      } else if ((gameMode === 'TIME' || gameMode === 'VERSUS') && timeLeft <= 0) {
        endGame();
      }
    }
  }, [lives, timeLeft, appState, gameMode, endGame]);

  const handleScore = useCallback((value: number, playerIndex: 1 | 2 = 1) => {
    if (playerIndex === 1) {
        setScore(prev => prev + value);
        setCaught(prev => prev + 1);
    } else {
        setScoreP2(prev => prev + value);
    }
  }, []);

  const handleZeroScore = useCallback((playerIndex: 1 | 2 = 1) => {
     if (playerIndex === 1) {
         setScore(0);
     } else {
         setScoreP2(0);
     }
  }, []);

  const handleMiss = useCallback(() => {
    setMissed(prev => prev + 1);
  }, []);

  const handleBombHit = useCallback(() => {
     if (gameMode === 'SURVIVAL') {
        setLives(prev => Math.max(0, prev - 1));
     }
  }, [gameMode]);

  const handleHeal = useCallback((amount: number) => {
     if (gameMode === 'SURVIVAL') {
        setLives(prev => Math.min(MAX_LIVES + 2, prev + amount)); // Cap lives at Max+2
     } else {
        // In Time mode, healing adds time
        setTimeLeft(prev => prev + (amount * 10)); // 1 Life = 10 Seconds
        endTimeRef.current += (amount * 10 * 1000);
     }
  }, [gameMode]);

  const handleConsumeShield = useCallback(() => {
     updateInventory({
        ...inventory,
        activeDrug: null
     });
  }, [inventory]);

  const handleStart = () => {
    setScore(0);
    setScoreP2(0);
    setMissed(0);
    setCaught(0);
    
    // -- DRUG START EFFECTS --
    let startLives = MAX_LIVES;
    let duration = TIME_LIMIT_DURATION;

    if (inventory.activeDrug === 'EXTRA_LIFE') {
        if (gameMode === 'SURVIVAL') startLives += 1;
        if (gameMode === 'TIME') duration += 10;
    }
    
    setLives(startLives);
    setTimeLeft(duration);
    setAppState('PLAYING');

    if (gameMode === 'TIME' || gameMode === 'VERSUS') {
        endTimeRef.current = Date.now() + (duration * 1000);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        
        timerIntervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
            setTimeLeft(remaining);
        }, 200); 
    }
  };

  const handleReset = () => {
    setAppState('MENU');
    setScore(0);
    setScoreP2(0);
    setMissed(0);
    setCaught(0);
    setTimeLeft(TIME_LIMIT_DURATION);
    setLives(MAX_LIVES);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  useEffect(() => {
      return () => {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
  }, []);

  useEffect(() => {
      if (appState !== 'PLAYING' && timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
      }
  }, [appState]);

  const handleBuy = (item: StoreItem) => {
     if (wallet >= item.price) {
        updateWallet(wallet - item.price);
        
        if (item.type === 'DRUG') {
           updateInventory({
              ...inventory,
              activeDrug: item.effect || null
           });
        } else {
           if (!inventory.ownedItems.includes(item.id)) {
              updateInventory({
                 ...inventory,
                 ownedItems: [...inventory.ownedItems, item.id]
              });
           }
        }
     }
  };

  const handleEquip = (item: StoreItem) => {
     if (item.type === 'CHARACTER') {
        updateInventory({ ...inventory, activeCharacter: item.id });
     } else if (item.type === 'BACKGROUND') {
        updateInventory({ ...inventory, activeBackground: item.id });
     }
  };

  return (
    <div className="w-full h-screen bg-neutral-900 flex items-center justify-center overflow-hidden font-sans select-none relative">
      
      {/* Background Pattern for Desktop */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Game Container - Constrained Width */}
      <div className="relative w-full max-w-[600px] h-full sm:h-[95vh] sm:rounded-2xl sm:border-[8px] sm:border-slate-800 bg-slate-950 shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col">
        
        {/* 1. The Game Layer */}
        <GameCanvas 
          score={score}
          onScore={handleScore}
          onMiss={handleMiss}
          onBombHit={handleBombHit}
          onZeroScore={handleZeroScore}
          onHeal={handleHeal}
          isPlaying={appState === 'PLAYING'}
          lives={lives}
          gameMode={gameMode}
          activeCharacter={inventory.activeCharacter}
          activeBackground={inventory.activeBackground}
          activeDrugEffect={appState === 'PLAYING' ? inventory.activeDrug : null} 
          onConsumeShield={handleConsumeShield}
        />

        {/* 2. Prologue Layer */}
        {appState === 'PROLOGUE' && (
           <Prologue onComplete={() => setAppState('MENU')} />
        )}

        {/* 3. UI Overlay Layer */}
        {appState !== 'PROLOGUE' && (
          <GameUI 
            score={score}
            scoreP2={scoreP2}
            missed={missed}
            caught={caught}
            timeLeft={timeLeft}
            lives={lives}
            highScore={highScores[gameMode] || 0}
            wallet={wallet}
            isPlaying={appState === 'PLAYING'}
            isGameOver={appState === 'GAMEOVER'}
            gameMode={gameMode}
            onStart={handleStart}
            onReset={handleReset}
            onSetMode={setGameMode}
            onOpenShop={() => setShowShop(true)}
          />
        )}

        {/* 4. Shop Modal Layer */}
        <ShopModal 
           isOpen={showShop} 
           onClose={() => setShowShop(false)}
           wallet={wallet}
           inventory={inventory}
           onBuy={handleBuy}
           onEquip={handleEquip}
        />
      </div>
    </div>
  );
}

export default App;
