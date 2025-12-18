
import React from 'react';
import { RefreshCcw, Play, Clock, Heart, ShoppingCart, Swords, Keyboard, Home, Crown, Flame } from 'lucide-react';
import { GameMode } from '../types';

interface GameUIProps {
  score: number;
  scoreP2?: number; // Optional for Versus
  missed: number;
  caught: number;
  timeLeft: number;
  lives: number;
  highScore: number;
  wallet: number; 
  isPlaying: boolean;
  isGameOver: boolean;
  gameMode: GameMode;
  onStart: () => void;
  onReset: () => void;
  onSetMode: (mode: GameMode) => void;
  onOpenShop: () => void; 
}

const GameUI: React.FC<GameUIProps> = ({ 
  score, 
  scoreP2 = 0,
  missed, 
  caught, 
  timeLeft,
  lives,
  highScore,
  wallet,
  isPlaying,
  isGameOver,
  gameMode,
  onStart,
  onReset,
  onSetMode,
  onOpenShop
}) => {

  // --- 1. Heads Up Display (HUD) ---
  if (isPlaying) {
    if (gameMode === 'VERSUS') {
        // --- VERSUS SPLIT HUD ---
        const p1Lead = score > scoreP2;
        const p2Lead = scoreP2 > score;

        return (
           <div className="absolute inset-0 pointer-events-none z-30">
               {/* Time Center */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 flex flex-col items-center shadow-xl z-50">
                   <span className="text-[10px] text-slate-400 font-bold uppercase">Time</span>
                   <span className={`text-2xl font-black font-mono leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft}
                   </span>
               </div>
               
               {/* P2 Score (Left - WASD) */}
               <div className="absolute top-4 left-4 flex flex-col items-start w-[40%]">
                   <div className={`w-full bg-red-900/80 border ${p2Lead ? 'border-yellow-400 shadow-yellow-500/20 shadow-lg' : 'border-red-500/50'} px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-300`}>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-red-300 font-bold uppercase block flex items-center gap-1">
                             <Keyboard size={10} /> P2 (WASD)
                          </span>
                          {p2Lead && <Crown size={14} className="text-yellow-400 fill-yellow-400 animate-bounce" />}
                       </div>
                       <span className="text-xl font-black font-mono text-white drop-shadow-md">
                           ${scoreP2.toLocaleString()}
                       </span>
                   </div>
               </div>

               {/* P1 Score (Right - ARROWS) */}
               <div className="absolute top-4 right-4 flex flex-col items-end w-[40%]">
                   <div className={`w-full bg-blue-900/80 border ${p1Lead ? 'border-yellow-400 shadow-yellow-500/20 shadow-lg' : 'border-blue-500/50'} px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-300 text-right`}>
                       <div className="flex justify-between items-center mb-1 flex-row-reverse">
                           <span className="text-[10px] text-blue-300 font-bold uppercase block flex items-center gap-1">
                             <Keyboard size={10} /> P1 (ARROWS)
                           </span>
                           {p1Lead && <Crown size={14} className="text-yellow-400 fill-yellow-400 animate-bounce" />}
                       </div>
                       <span className="text-xl font-black font-mono text-white drop-shadow-md">
                           ${score.toLocaleString()}
                       </span>
                   </div>
               </div>
           </div>
        );
    } else {
        // --- STANDARD HUD ---
        return (
          <div className="absolute inset-0 pointer-events-none z-30 flex flex-col items-center">
            
            {/* Top Center Command Bar */}
            <div className="mt-4 flex items-center bg-slate-900/90 border border-slate-600 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transform scale-90 sm:scale-100 origin-top">
                {/* Lives / Time */}
                <div className="flex flex-col items-center justify-center px-5 py-2 border-r border-slate-700 min-w-[80px]">
                    {gameMode === 'TIME' ? (
                        <>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Time</span>
                             <span className={`text-2xl font-black font-mono leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {timeLeft}
                             </span>
                        </>
                    ) : (
                        <>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">HP</span>
                             <div className="flex gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <Heart key={i} size={12} className={i < lives ? 'fill-red-500 text-red-500' : 'fill-slate-800 text-slate-800'} />
                                ))}
                             </div>
                        </>
                    )}
                </div>

                {/* Score */}
                <div className="flex flex-col items-end px-6 py-2 bg-gradient-to-br from-slate-800 to-slate-950 min-w-[160px]">
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Heist Value</span>
                    <span className="text-3xl font-black font-mono text-white drop-shadow-lg tracking-tight">
                        ${score.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Hints */}
            <div className="absolute bottom-8 flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full text-white text-[10px] backdrop-blur-sm border border-white/10 opacity-70">
                <Keyboard size={12} />
                <span className="font-mono tracking-wider">USE ARROW KEYS</span>
            </div>
          </div>
        );
    }
  }

  // --- 2. Game Over ---
  if (isGameOver) {
      const isWin = lives > 0 || gameMode === 'TIME' || gameMode === 'VERSUS';
      let title = isWin ? 'MISSION OVER' : 'BUSTED';
      let subtitle = 'Total Loot Secured';
      
      if (gameMode === 'VERSUS') {
          if (score > scoreP2) title = 'P1 WINS';
          else if (scoreP2 > score) title = 'P2 WINS';
          else title = 'DRAW';
          subtitle = 'Winner Loot';
      }

      return (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
             <div className="mb-6 relative text-center">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 tracking-tighter drop-shadow-lg uppercase italic transform -skew-x-6">
                    {title}
                </h2>
             </div>

             <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-sm mb-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                 {gameMode === 'VERSUS' ? (
                     <div className="flex justify-between items-center mb-4 px-2">
                         <div className={`text-center ${score > scoreP2 ? 'scale-110 transition-transform' : 'opacity-70'}`}>
                             <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Player 1</div>
                             <div className="text-2xl font-mono font-black text-white">${score.toLocaleString()}</div>
                         </div>
                         <div className="text-slate-600 font-black text-xl italic">VS</div>
                         <div className={`text-center ${scoreP2 > score ? 'scale-110 transition-transform' : 'opacity-70'}`}>
                             <div className="text-[10px] text-red-400 font-bold uppercase mb-1">Player 2</div>
                             <div className="text-2xl font-mono font-black text-white">${scoreP2.toLocaleString()}</div>
                         </div>
                     </div>
                 ) : (
                     <div className="text-center mb-8">
                        <div className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">{subtitle}</div>
                        <div className="text-5xl font-black font-mono text-green-400 drop-shadow-2xl">
                            ${score.toLocaleString()}
                        </div>
                     </div>
                 )}
                 
                 {gameMode !== 'VERSUS' && (
                     <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-950 p-3 rounded-xl text-center border border-slate-800">
                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Best</div>
                            <div className="font-bold text-yellow-500 text-xs sm:text-sm">${highScore.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl text-center border border-slate-800">
                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Caught</div>
                            <div className="font-bold text-white text-xs sm:text-sm">{caught}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl text-center border border-slate-800">
                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Missed</div>
                            <div className="font-bold text-red-400 text-xs sm:text-sm">{missed}</div>
                        </div>
                     </div>
                 )}
             </div>
             
             {/* Action Buttons */}
             <div className="flex flex-col gap-3 w-full max-w-sm">
                 <div className="flex gap-3">
                    <button 
                        onClick={onReset}
                        className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 rounded-2xl border border-slate-600 transition-all text-sm"
                    >
                        <Home size={18} /> 
                        <span>回主選單</span>
                    </button>
                    <button 
                        onClick={onOpenShop}
                        className="flex-1 flex justify-center items-center gap-2 bg-purple-900/80 hover:bg-purple-800 text-purple-100 font-bold py-3 rounded-2xl border border-purple-500/50 transition-all text-sm"
                    >
                        <ShoppingCart size={18} /> 
                        <span>黑市</span>
                    </button>
                 </div>
                 
                 <button 
                    onClick={onStart}
                    className="w-full flex justify-center items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-yellow-900/20 transition-all text-lg group relative overflow-hidden"
                 >
                    <span className="relative z-10 flex items-center gap-2">
                        <RefreshCcw size={20} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" /> 
                        <span>再幹一票</span>
                    </span>
                    <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-12 group-hover:animate-shimmer" />
                 </button>
             </div>
        </div>
      );
  }

  // --- 3. Main Menu ---
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[2px] p-6 animate-in fade-in duration-500">
       
       <div className="text-center mb-10 relative group cursor-default">
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all duration-1000 animate-pulse"></div>
           <div className="inline-block px-3 py-0.5 bg-yellow-500 text-black font-bold text-[10px] tracking-[0.3em] mb-3 transform -skew-x-12 shadow-lg">
              BANK HEIST SIMULATOR
           </div>
           <h1 className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl italic">
              銀行<span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600">大盜</span>
           </h1>
       </div>

       {/* Mode Selector */}
       <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl">
           {(['TIME', 'SURVIVAL', 'VERSUS'] as GameMode[]).map((mode) => (
             <button 
                key={mode}
                onClick={() => onSetMode(mode)}
                className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                    gameMode === mode 
                    ? (mode === 'TIME' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' : mode === 'SURVIVAL' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 scale-105' : 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 scale-105') 
                    : 'bg-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
             >
                {mode === 'TIME' && <Clock size={22} className={`mb-1 ${gameMode===mode ? 'animate-bounce' : ''}`} />}
                {mode === 'SURVIVAL' && <Heart size={22} className={`mb-1 ${gameMode===mode ? 'animate-pulse' : ''}`} />}
                {mode === 'VERSUS' && <Swords size={22} className={`mb-1 ${gameMode===mode ? 'animate-pulse' : ''}`} />}
                <span className="font-bold text-xs uppercase tracking-wider">
                    {mode === 'TIME' ? '限時' : mode === 'SURVIVAL' ? '生存' : '對決'}
                </span>
                {gameMode === mode && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                )}
             </button>
           ))}
       </div>

       {/* Main Actions */}
       <div className="flex flex-col gap-4 w-full max-w-sm">
          <button 
             onClick={onStart}
             className="group relative bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl py-5 rounded-2xl shadow-xl shadow-yellow-900/30 transition-all active:scale-95 overflow-hidden"
          >
             <span className="relative z-10 flex items-center justify-center gap-3">
               <Play className="fill-black w-6 h-6 group-hover:scale-125 transition-transform" /> 開始行動
             </span>
             <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:animate-shimmer" />
          </button>

          <button 
             onClick={onOpenShop}
             className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 text-white p-3 rounded-2xl border border-slate-700 transition-all hover:border-slate-500 group"
          >
             <div className="flex items-center gap-3">
               <div className="bg-purple-900/50 p-2.5 rounded-xl border border-purple-500/30 group-hover:scale-110 transition-transform">
                 <ShoppingCart size={20} className="text-purple-300" />
               </div>
               <div className="text-left">
                  <div className="font-bold text-sm group-hover:text-purple-300 transition-colors">黑市交易</div>
                  <div className="text-[10px] text-slate-400">Upgrades & Skins</div>
               </div>
             </div>
             <span className="font-mono text-green-400 font-bold text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                ${wallet.toLocaleString()}
             </span>
          </button>
       </div>
    </div>
  );
};

export default GameUI;
