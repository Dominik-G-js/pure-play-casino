import { useState, useEffect, useRef } from "react";
import { ReelGrid } from "./ReelGrid";
import { GameControls } from "./GameControls";
import { GameStats } from "./GameStats";
import { ParticleSystem } from "./ParticleSystem";
import { SoundManager } from "./SoundManager";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣', '🃏', '💥', '🎁', '🌟'];
const SYMBOL_VALUES = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 5,
  '🔔': 10,
  '⭐': 15,
  '💎': 25,
  '7️⃣': 50,
  '🌟': 100, // MEGA symbol
  '🃏': 0, // Wild - substitutes any symbol
  '💥': 0, // Scatter - bonus trigger
  '🎁': 0  // Bonus Drop - collection symbol
};

// 5-reel paylines (20 lines total)
const PAYLINES = [
  // Horizontal lines
  [1, 1, 1, 1, 1], // Center line (0)
  [0, 0, 0, 0, 0], // Top line (1)
  [2, 2, 2, 2, 2], // Bottom line (2)
  
  // V-shapes
  [0, 1, 2, 1, 0], // V-shape down (3)
  [2, 1, 0, 1, 2], // V-shape up (4)
  
  // Zig-zags
  [0, 1, 0, 1, 0], // Zig-zag top (5)
  [2, 1, 2, 1, 2], // Zig-zag bottom (6)
  [1, 0, 1, 0, 1], // Zig-zag center-up (7)
  [1, 2, 1, 2, 1], // Zig-zag center-down (8)
  
  // Diagonals
  [0, 0, 1, 2, 2], // Diagonal down (9)
  [2, 2, 1, 0, 0], // Diagonal up (10)
  
  // Special patterns
  [1, 0, 0, 0, 1], // M-shape top (11)
  [1, 2, 2, 2, 1], // M-shape bottom (12)
  [0, 1, 1, 1, 0], // W-shape top (13)
  [2, 1, 1, 1, 2], // W-shape bottom (14)
  
  // Additional patterns
  [0, 2, 0, 2, 0], // Large zig-zag (15)
  [2, 0, 2, 0, 2], // Large zig-zag reverse (16)
  [1, 1, 0, 1, 1], // Center dip (17)
  [1, 1, 2, 1, 1], // Center peak (18)
  [0, 1, 2, 2, 2]  // Rising line (19)
];

const BONUS_SYMBOLS = ['💥', '🃏'];

export interface GameState {
  balance: number;
  bet: number;
  isSpinning: boolean;
  wins: number;
  losses: number;
  totalWon: number;
  totalBet: number;
  lastWin: number;
  activePaylines: number;
  betPerLine: number;
  freeSpins: number;
  inBonus: boolean;
  multiplier: number;
  winningLines: number[];
  bonusDropsCollected: boolean[];
  bonusDropProgress: number;
  autoSpinActive: boolean;
  autoSpinCount: number;
  autoSpinRemaining: number;
}

export const SlotMachine = () => {
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const defaultState = {
      balance: 1000,
      bet: 20,
      isSpinning: false,
      wins: 0,
      losses: 0,
      totalWon: 0,
      totalBet: 0,
      lastWin: 0,
      activePaylines: 10,
      betPerLine: 2,
      freeSpins: 0,
      inBonus: false,
      multiplier: 1,
      winningLines: [],
      bonusDropsCollected: Array(15).fill(false), // 5x3 grid = 15 positions
      bonusDropProgress: 0,
      autoSpinActive: false,
      autoSpinCount: 0,
      autoSpinRemaining: 0
    };
    
    const saved = localStorage.getItem('slot-machine-state');
    if (saved) {
      try {
        const savedState = JSON.parse(saved);
        // Merge saved state with defaults to ensure all properties exist
        return { ...defaultState, ...savedState };
      } catch {
        // If parsing fails, use default state
        return defaultState;
      }
    }
    return defaultState;
  });

  const [reelResults, setReelResults] = useState([
    ['🍒', '🍋', '🍊'], // Reel 1 (top, center, bottom)
    ['🍒', '🍋', '🍊'], // Reel 2  
    ['🍒', '🍋', '🍊'], // Reel 3
    ['🍒', '🍋', '🍊'], // Reel 4
    ['🍒', '🍋', '🍊']  // Reel 5
  ]);
  const [showParticles, setShowParticles] = useState(false);
  const soundManager = useRef(new SoundManager());
  const particleRef = useRef<HTMLDivElement>(null);

  // Auto spin effect
  useEffect(() => {
    if (gameState.autoSpinActive && gameState.autoSpinRemaining > 0 && !gameState.isSpinning) {
      const timer = setTimeout(() => {
        spin();
      }, 1000); // 1 second delay between auto spins
      
      return () => clearTimeout(timer);
    }
  }, [gameState.autoSpinActive, gameState.autoSpinRemaining, gameState.isSpinning]);

  // Save game state to localStorage
  useEffect(() => {
    localStorage.setItem('slot-machine-state', JSON.stringify(gameState));
  }, [gameState]);

  const getRandomSymbol = () => {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  };

  const getRandomReel = () => {
    return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  };

  const checkMultilineWins = (grid: string[][]) => {
    let totalWin = 0;
    let winningLines: number[] = [];
    let scatterCount = 0;
    let wildCount = 0;
    let megaSymbolCount = 0;
    let bonusDropsFound: number[] = [];
    
    // Count special symbols and bonus drops across entire grid
    grid.forEach((reel, reelIndex) => {
      reel.forEach((symbol, symbolIndex) => {
        if (symbol === '💥') scatterCount++;
        if (symbol === '🃏') wildCount++;
        if (symbol === '🌟') megaSymbolCount++;
        if (symbol === '🎁') {
          const position = reelIndex * 3 + symbolIndex;
          bonusDropsFound.push(position);
        }
      });
    });
    
    // Process bonus drops collection
    if (bonusDropsFound.length > 0) {
      const newCollectedDrops = [...gameState.bonusDropsCollected];
      bonusDropsFound.forEach(position => {
        if (!newCollectedDrops[position]) {
          newCollectedDrops[position] = true;
        }
      });
      
      const newProgress = newCollectedDrops.filter(Boolean).length;
      const wasComplete = gameState.bonusDropProgress === 15;
      const isNowComplete = newProgress === 15;
      
      // Update bonus drops state
      setGameState(prev => ({
        ...prev,
        bonusDropsCollected: newCollectedDrops,
        bonusDropProgress: newProgress
      }));
      
      // Trigger MEGA BONUS if all positions are filled
      if (!wasComplete && isNowComplete) {
        const megaBonus = gameState.betPerLine * gameState.activePaylines * 100;
        totalWin += megaBonus;
        
        // Reset collection and give mega bonus
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            bonusDropsCollected: Array(15).fill(false),
            bonusDropProgress: 0,
            freeSpins: prev.freeSpins + 30,
            multiplier: 10
          }));
          
          toast({
            title: "🎁🎉🎉 ULTIMATE MEGA JACKPOT! 🎉🎉🎁",
            description: `ALL 15 BONUS DROPS COLLECTED! ${megaBonus} Credits + 30 Free Spins + 10x Multiplier!`,
            className: "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black font-bold text-xl"
          });
        }, 1000);
      } else if (bonusDropsFound.length > 0) {
        toast({
          title: "🎁 BONUS DROP COLLECTED!",
          description: `Progress: ${newProgress}/15 positions filled`,
          className: "bg-gradient-to-r from-orange-500 to-red-500 text-white"
        });
      }
    }
    
    // Check each payline
    PAYLINES.forEach((payline, lineIndex) => {
      if (lineIndex >= gameState.activePaylines) return;
      
      const lineSymbols = [
        grid[0][payline[0]], 
        grid[1][payline[1]], 
        grid[2][payline[2]],
        grid[3][payline[3]],
        grid[4][payline[4]]
      ];
      
      let lineWin = 0;
      
      // Check for wilds and substitute
      const processedSymbols = lineSymbols.map(symbol => 
        symbol === '🃏' ? lineSymbols.find(s => s !== '🃏' && s !== '💥' && s !== '🎁' && s !== '🌟') || symbol : symbol
      );
      
      // Count matching symbols from left to right
      let matchCount = 1;
      const firstSymbol = processedSymbols[0];
      
      for (let i = 1; i < processedSymbols.length; i++) {
        if (processedSymbols[i] === firstSymbol) {
          matchCount++;
        } else {
          break;
        }
      }
      
      // Award wins based on match count (5, 4, 3 of a kind)
      if (matchCount >= 3 && firstSymbol !== '💥' && firstSymbol !== '🎁' && SYMBOL_VALUES[firstSymbol as keyof typeof SYMBOL_VALUES]) {
        const baseValue = SYMBOL_VALUES[firstSymbol as keyof typeof SYMBOL_VALUES];
        
        // Multipliers: 3-of-kind = 1x, 4-of-kind = 3x, 5-of-kind = 10x
        const matchMultiplier = matchCount === 5 ? 10 : matchCount === 4 ? 3 : 1;
        lineWin = baseValue * gameState.betPerLine * matchMultiplier * gameState.multiplier;
      }
      
      if (lineWin > 0) {
        totalWin += lineWin;
        winningLines.push(lineIndex);
      }
    });
    
    // MEGA SYMBOL BONUS - ultra rare jackpot
    if (megaSymbolCount >= 3) {
      const megaWin = megaSymbolCount * gameState.betPerLine * gameState.activePaylines * 50;
      totalWin += megaWin;
      
      setGameState(prev => ({
        ...prev,
        freeSpins: prev.freeSpins + 50,
        multiplier: 20
      }));
      
      toast({
        title: "🌟💰 MEGA SYMBOL JACKPOT! 💰🌟",
        description: `${megaSymbolCount} MEGA Symbols! ${megaWin} Credits + 50 Free Spins + 20x Multiplier!`,
        className: "bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-600 text-black font-bold text-2xl animate-pulse"
      });
    }
    
    // WILD MADNESS - 5+ wilds trigger wild bonus
    if (wildCount >= 5) {
      const wildBonus = wildCount * gameState.betPerLine * gameState.activePaylines * 10;
      totalWin += wildBonus;
      
      setGameState(prev => ({
        ...prev,
        freeSpins: prev.freeSpins + 15,
        multiplier: Math.min(prev.multiplier + 3, 20)
      }));
      
      toast({
        title: "🃏💥 WILD MADNESS! 💥🃏",
        description: `${wildCount} Wilds! ${wildBonus} Credits + 15 Free Spins!`,
        className: "bg-gradient-to-r from-purple-500 to-purple-800 text-white font-bold text-xl"
      });
    }
    
    // Scatter bonus (3 or more scatters trigger free spins)
    if (scatterCount >= 3) {
      const scatterWin = scatterCount * gameState.betPerLine * gameState.activePaylines * 2;
      totalWin += scatterWin;
      
      // Award free spins based on scatter count
      const freeSpinsAwarded = scatterCount === 3 ? 10 : scatterCount === 4 ? 20 : 40;
      
      setGameState(prev => ({
        ...prev,
        freeSpins: prev.freeSpins + freeSpinsAwarded,
        inBonus: true,
        multiplier: Math.min(prev.multiplier + scatterCount - 2, 20)
      }));
      
      toast({
        title: "💥🎉 SCATTER BONUS! 🎉💥",
        description: `${scatterCount} Scatters! ${freeSpinsAwarded} Free Spins + ${Math.min(gameState.multiplier + scatterCount - 2, 20)}x Multiplier!`,
        className: "bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold text-xl"
      });
    }
    
    return { totalWin, winningLines, scatterCount };
  };

  const spin = async () => {
    const totalBet = gameState.betPerLine * gameState.activePaylines;
    
    // Check if spin is allowed (must not be spinning AND either have balance OR free spins)
    if (gameState.isSpinning || (gameState.balance < totalBet && gameState.freeSpins <= 0)) {
      if (gameState.balance < totalBet && gameState.freeSpins <= 0) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough credits to place this bet and no free spins available.",
          variant: "destructive"
        });
      }
      return;
    }

    // Use free spin if available
    const usingFreeSpin = gameState.freeSpins > 0;
    
    setGameState(prev => {
      return {
        ...prev,
        isSpinning: true,
        balance: usingFreeSpin ? prev.balance : prev.balance - totalBet,
        totalBet: prev.totalBet + (usingFreeSpin ? 0 : totalBet),
        freeSpins: usingFreeSpin ? prev.freeSpins - 1 : prev.freeSpins,
        winningLines: []
      };
    });

    // Play spin sound
    soundManager.current.playSpinSound();

    // Simulate spinning animation delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Generate 5x3 grid (5 reels, 3 symbols each)
    const newGrid = [
      getRandomReel(), // Reel 1
      getRandomReel(), // Reel 2  
      getRandomReel(), // Reel 3
      getRandomReel(), // Reel 4
      getRandomReel()  // Reel 5
    ];
    
    setReelResults(newGrid);

    const { totalWin, winningLines, scatterCount } = checkMultilineWins(newGrid);
    
    setGameState(prev => ({
      ...prev,
      isSpinning: false,
      balance: prev.balance + totalWin,
      wins: totalWin > 0 ? prev.wins + 1 : prev.wins,
      losses: totalWin === 0 ? prev.losses + 1 : prev.losses,
      totalWon: prev.totalWon + totalWin,
      lastWin: totalWin,
      winningLines: winningLines,
      // Reset multiplier if not in bonus and no scatters
      multiplier: !prev.inBonus && scatterCount < 3 ? 1 : prev.multiplier,
      // Exit bonus if no free spins left
      inBonus: prev.freeSpins > 1 || scatterCount >= 3 ? prev.inBonus : false,
      // Auto spin countdown
      autoSpinRemaining: prev.autoSpinActive ? Math.max(0, prev.autoSpinRemaining - 1) : 0,
      autoSpinActive: prev.autoSpinActive && prev.autoSpinRemaining > 1
    }));

    if (totalWin > 0) {
      setShowParticles(true);
      soundManager.current.playWinSound();
      
      let toastMessage = `You won ${totalWin} credits!`;
      if ((winningLines?.length || 0) > 1) {
        toastMessage += ` (${winningLines.length} lines)`;
      }
      if (gameState.multiplier > 1) {
        toastMessage += ` with ${gameState.multiplier}x multiplier!`;
      }
      
      toast({
        title: "🎉 Winner!",
        description: toastMessage,
        className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
      });

      setTimeout(() => setShowParticles(false), 3000);
    } else {
      soundManager.current.playLoseSound();
    }
  };

  const updateBet = (newBetPerLine: number) => {
    const totalBet = newBetPerLine * gameState.activePaylines;
    if (!gameState.isSpinning && totalBet <= gameState.balance) {
      setGameState(prev => ({ ...prev, betPerLine: newBetPerLine, bet: totalBet }));
    }
  };

  const updatePaylines = (newPaylines: number) => {
    const totalBet = gameState.betPerLine * newPaylines;
    if (!gameState.isSpinning && totalBet <= gameState.balance && newPaylines >= 1 && newPaylines <= 20) {
      setGameState(prev => ({ 
        ...prev, 
        activePaylines: newPaylines,
        bet: gameState.betPerLine * newPaylines
      }));
    }
  };

  const maxBet = () => {
    const maxPossible = Math.min(20, Math.floor(gameState.balance / gameState.activePaylines));
    updateBet(maxPossible);
  };

  const startAutoSpin = (count: number) => {
    if (!gameState.isSpinning && gameState.balance >= (gameState.betPerLine * gameState.activePaylines)) {
      setGameState(prev => ({
        ...prev,
        autoSpinActive: true,
        autoSpinCount: count,
        autoSpinRemaining: count
      }));
    }
  };

  const stopAutoSpin = () => {
    setGameState(prev => ({
      ...prev,
      autoSpinActive: false,
      autoSpinRemaining: 0
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 lg:p-4">
      {/* Casino Machine Frame - Compact Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Machine Header - Compact */}
        <div className="relative bg-gradient-to-b from-red-600 to-red-800 rounded-xl p-2 lg:p-4 mb-3 shadow-inner">
          <div className="text-center">
            <h1 className="text-2xl lg:text-4xl font-casino text-yellow-300 drop-shadow-lg tracking-wider">
              🎰 VEGAS FORTUNE 🎰
            </h1>
            <p className="text-yellow-200 font-casino-light text-sm lg:text-base">
              MULTI-LINE JACKPOT MACHINE
            </p>
          </div>
        </div>

        {/* Main Game Area - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          
          {/* Left Panel - Stats (Hidden on mobile, sidebar on desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 lg:p-6 border-4 border-yellow-500">
              <GameStats gameState={gameState} />
            </div>
          </div>

          {/* Center - Slot Machine (Takes most space) */}
          <div className="col-span-1 lg:col-span-2 xl:col-span-3">
            <div className="bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-3 lg:p-4 border-4 border-yellow-400 shadow-2xl relative overflow-hidden">
              
              {/* Slot Window - Compact */}
              <div className="relative bg-black rounded-xl p-4 lg:p-6 mb-3 border-4 border-gray-600 shadow-inner mx-auto max-w-xl">
                {/* Payline Indicators */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Center Line */}
                  <div className="absolute top-1/2 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform -translate-y-0.5 opacity-80"></div>
                  {/* Top Line */}
                  <div className="absolute top-10 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60"></div>
                  {/* Bottom Line */}
                  <div className="absolute bottom-10 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60"></div>
                  {/* Diagonal Lines */}
                  <div className="absolute inset-6">
                    <svg className="w-full h-full opacity-40">
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(255,0,255,0.6)" strokeWidth="2"/>
                      <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(0,255,255,0.6)" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>

                {/* Reels Container */}
                <div className="relative z-10 flex justify-center">
                  <ReelGrid 
                    grid={reelResults}
                    isSpinning={gameState.isSpinning}
                    winningLines={gameState.winningLines}
                  />
                </div>

                {/* Win Line Highlight */}
                {gameState.lastWin > 0 && !gameState.isSpinning && (
                  <div className="absolute inset-0 border-4 border-yellow-400 rounded-2xl animate-pulse shadow-lg shadow-yellow-400/50"></div>
                )}
              </div>

              {/* Game Controls - Compact and directly below */}
              <div className="bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-xl p-2 lg:p-3 border-2 border-yellow-300">
                <GameControls
                  gameState={gameState}
                  onSpin={spin}
                  onBetChange={updateBet}
                  onMaxBet={maxBet}
                  onPaylineChange={updatePaylines}
                  onAutoSpinStart={startAutoSpin}
                  onAutoSpinStop={stopAutoSpin}
                />
              </div>
            </div>

            {/* Particle Effects */}
            {showParticles && (
              <div ref={particleRef} className="absolute inset-0 pointer-events-none z-50">
                <ParticleSystem />
              </div>
            )}
          </div>

          {/* Right Panel - Payouts (Collapsible on mobile) */}
          <div className="col-span-1 lg:col-span-1">
            <div className="bg-gradient-to-b from-green-800 to-green-900 rounded-xl p-3 lg:p-4 border-4 border-green-500">
              <h3 className="text-lg lg:text-xl font-casino text-green-300 mb-3 text-center">💰 VÝPLATY</h3>
              
              {/* Jackpot Display */}
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-2 mb-3 text-center border-2 border-yellow-300">
                <div className="text-black font-casino text-xs lg:text-sm">JACKPOT</div>
                <div className="text-black font-casino text-base lg:text-xl">{(gameState.bet * 100).toLocaleString()}</div>
              </div>

              {/* Symbol Payouts - Compact */}
              <div className="space-y-1.5 lg:space-y-2">
                {/* MEGA Symbol - Ultra Rare */}
                <div className="flex items-center justify-between bg-yellow-600/50 rounded p-1.5 lg:p-2 border-2 border-yellow-400 animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg lg:text-xl">🌟</span>
                    <div className="text-yellow-200 text-xs">
                      <div className="font-casino font-bold">MEGA</div>
                      <div>5=1000x</div>
                    </div>
                  </div>
                  <div className="text-yellow-300 font-casino text-xs lg:text-sm font-bold">
                    ULTRA!
                  </div>
                </div>
                
                {/* Top paying symbols */}
                {Object.entries(SYMBOL_VALUES)
                  .filter(([symbol, value]) => value >= 25)
                  .map(([symbol, value]) => (
                  <div key={symbol} className="flex items-center justify-between bg-green-700/50 rounded p-1.5 lg:p-2 border border-green-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg lg:text-xl">{symbol}</span>
                      <div className="text-green-200 text-xs">
                        <div>5={value * 10}x</div>
                      </div>
                    </div>
                    <div className="text-green-300 font-casino text-xs lg:text-sm">
                      {(value * gameState.bet * 10).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Symbols - Compact */}
              <div className="mt-2 space-y-1.5">
                <div className="bg-purple-900/50 rounded p-1.5 border border-purple-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🃏</span>
                    <div className="text-purple-200 text-[10px] lg:text-xs">
                      <div className="font-casino">WILD</div>
                      <div>Nahrazuje symboly</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-900/50 rounded p-1.5 border border-red-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">💥</span>
                    <div className="text-red-200 text-[10px] lg:text-xs">
                      <div className="font-casino">SCATTER</div>
                      <div>3+ = Free Spins!</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-900/50 rounded p-1.5 border border-orange-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🎁</span>
                    <div className="text-orange-200 text-[10px] lg:text-xs">
                      <div className="font-casino">BONUS DROP</div>
                      <div>Sbírej 15 = MEGA!</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Win multipliers info */}
              <div className="mt-3 bg-blue-900/30 rounded p-2 border border-blue-600">
                <div className="text-center text-blue-200 text-[10px] lg:text-xs">
                  <div className="font-casino mb-1">VÝHERNÍ NÁSOBKY</div>
                  <div className="space-y-0.5">
                    <div>5-of-kind: <span className="text-yellow-300">10x</span></div>
                    <div>4-of-kind: <span className="text-green-300">3x</span></div>
                    <div>3-of-kind: <span className="text-blue-300">1x</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Stats Panel */}
            <div className="lg:hidden mt-3">
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-3 border-4 border-yellow-500">
                <GameStats gameState={gameState} />
              </div>
            </div>
          </div>
        </div>

        {/* Machine Footer - Compact */}
        <div className="mt-3 bg-gradient-to-r from-purple-800 to-purple-900 rounded-xl p-2 lg:p-3 border-2 border-purple-600">
          <div className="text-center text-purple-200 font-casino-light text-xs lg:text-sm">
            <p>Licensed Gaming Machine • RNG Certified • Responsible Gaming</p>
            <div className="flex justify-center gap-2 lg:gap-3 mt-1 text-[10px] lg:text-xs">
              <span>RTP: 96.5%</span>
              <span>Max Win: 1000x</span>
              <span>Volatility: High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};