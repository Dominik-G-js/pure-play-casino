import { useState, useEffect, useRef } from "react";
import { ReelGrid } from "./ReelGrid";
import { GameControls } from "./GameControls";
import { GameStats } from "./GameStats";
import { ParticleSystem } from "./ParticleSystem";
import { SoundManager } from "./SoundManager";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣', '🃏', '💥', '🎁'];
const SYMBOL_VALUES = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 5,
  '🔔': 10,
  '⭐': 15,
  '💎': 25,
  '7️⃣': 50,
  '🃏': 0, // Wild - substitutes any symbol
  '💥': 0, // Scatter - bonus trigger
  '🎁': 0  // Bonus Drop - collection symbol
};

const PAYLINES = [
  [1, 1, 1], // Center line
  [0, 0, 0], // Top line  
  [2, 2, 2], // Bottom line
  [0, 1, 2], // Diagonal down
  [2, 1, 0]  // Diagonal up
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
}

export const SlotMachine = () => {
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const defaultState = {
      balance: 1000,
      bet: 10,
      isSpinning: false,
      wins: 0,
      losses: 0,
      totalWon: 0,
      totalBet: 0,
      lastWin: 0,
      activePaylines: 5,
      betPerLine: 2,
      freeSpins: 0,
      inBonus: false,
      multiplier: 1,
      winningLines: [],
      bonusDropsCollected: [false, false, false, false, false, false, false, false, false], // 3x3 grid positions
      bonusDropProgress: 0
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
    ['🍒', '🍋', '🍊']  // Reel 3
  ]);
  const [showParticles, setShowParticles] = useState(false);
  const soundManager = useRef(new SoundManager());
  const particleRef = useRef<HTMLDivElement>(null);

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
    let bonusDropsFound: number[] = [];
    
    // Count scatter symbols and bonus drops across entire grid
    grid.forEach((reel, reelIndex) => {
      reel.forEach((symbol, symbolIndex) => {
        if (symbol === '💥') scatterCount++;
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
      const wasComplete = gameState.bonusDropProgress === 9;
      const isNowComplete = newProgress === 9;
      
      // Update bonus drops state
      setGameState(prev => ({
        ...prev,
        bonusDropsCollected: newCollectedDrops,
        bonusDropProgress: newProgress
      }));
      
      // Trigger MEGA BONUS if all positions are filled
      if (!wasComplete && isNowComplete) {
        const megaBonus = gameState.betPerLine * gameState.activePaylines * 50;
        totalWin += megaBonus;
        
        // Reset collection and give mega bonus
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            bonusDropsCollected: [false, false, false, false, false, false, false, false, false],
            bonusDropProgress: 0,
            freeSpins: prev.freeSpins + 20,
            multiplier: 5
          }));
          
          toast({
            title: "🎁🎉 MEGA BONUS JACKPOT! 🎉🎁",
            description: `ALL BONUS DROPS COLLECTED! ${megaBonus} Credits + 20 Free Spins + 5x Multiplier!`,
            className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg"
          });
        }, 1000);
      } else if (bonusDropsFound.length > 0) {
        toast({
          title: "🎁 BONUS DROP COLLECTED!",
          description: `Progress: ${newProgress}/9 positions filled`,
          className: "bg-gradient-to-r from-orange-500 to-red-500 text-white"
        });
      }
    }
    
    // Check each payline
    PAYLINES.forEach((payline, lineIndex) => {
      if (lineIndex >= gameState.activePaylines) return;
      
      const lineSymbols = [
        grid[0][payline[0]], // First reel, payline position
        grid[1][payline[1]], // Second reel, payline position  
        grid[2][payline[2]]  // Third reel, payline position
      ];
      
      let lineWin = 0;
      
      // Check for wilds and substitute
      const processedSymbols = lineSymbols.map(symbol => 
        symbol === '🃏' ? lineSymbols.find(s => s !== '🃏' && s !== '💥' && s !== '🎁') || symbol : symbol
      );
      
      // Check for three of a kind (including wilds)
      if (processedSymbols[0] === processedSymbols[1] && processedSymbols[1] === processedSymbols[2]) {
        const symbol = processedSymbols[0];
        if (symbol !== '💥' && symbol !== '🎁' && SYMBOL_VALUES[symbol as keyof typeof SYMBOL_VALUES]) {
          lineWin = SYMBOL_VALUES[symbol as keyof typeof SYMBOL_VALUES] * gameState.betPerLine * gameState.multiplier;
        }
      }
      // Check for two of a kind (including wilds)
      else if (processedSymbols[0] === processedSymbols[1] || 
               processedSymbols[1] === processedSymbols[2] || 
               processedSymbols[0] === processedSymbols[2]) {
        const symbol = processedSymbols[0] === processedSymbols[1] ? processedSymbols[0] : 
                      processedSymbols[1] === processedSymbols[2] ? processedSymbols[1] : processedSymbols[0];
        if (symbol !== '💥' && symbol !== '🎁' && SYMBOL_VALUES[symbol as keyof typeof SYMBOL_VALUES]) {
          lineWin = Math.floor(SYMBOL_VALUES[symbol as keyof typeof SYMBOL_VALUES] * gameState.betPerLine * 0.5 * gameState.multiplier);
        }
      }
      
      if (lineWin > 0) {
        totalWin += lineWin;
        winningLines.push(lineIndex);
      }
    });
    
    // Scatter bonus (3 or more scatters trigger free spins)
    if (scatterCount >= 3) {
      const scatterWin = scatterCount * gameState.betPerLine * gameState.activePaylines;
      totalWin += scatterWin;
      
      // Award free spins
      if (!gameState.inBonus) {
        setGameState(prev => ({
          ...prev,
          freeSpins: prev.freeSpins + (scatterCount * 5),
          inBonus: true,
          multiplier: Math.min(prev.multiplier + 1, 5)
        }));
        
        toast({
          title: "🎉 BONUS TRIGGERED!",
          description: `${scatterCount * 5} Free Spins + ${Math.min(gameState.multiplier + 1, 5)}x Multiplier!`,
          className: "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        });
      }
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

    // Generate 3x3 grid (3 reels, 3 symbols each)
    const newGrid = [
      getRandomReel(), // Reel 1
      getRandomReel(), // Reel 2  
      getRandomReel()  // Reel 3
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
      inBonus: prev.freeSpins > 1 || scatterCount >= 3 ? prev.inBonus : false
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
    if (!gameState.isSpinning && totalBet <= gameState.balance && newPaylines >= 1 && newPaylines <= 5) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Casino Machine Frame */}
      <div className="max-w-6xl mx-auto">
        <div className="relative bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 p-8 rounded-3xl shadow-2xl">
          {/* Decorative Lights */}
          <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-red-500 rounded-3xl opacity-75 animate-pulse blur-sm"></div>
          
          {/* Machine Header */}
          <div className="relative bg-gradient-to-b from-red-600 to-red-800 rounded-2xl p-6 mb-6 shadow-inner">
            <div className="text-center">
              <h1 className="text-5xl font-casino text-yellow-300 drop-shadow-lg tracking-wider mb-2">
                🎰 VEGAS FORTUNE 🎰
              </h1>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full animate-pulse ${
                    i % 2 === 0 ? 'bg-yellow-400' : 'bg-red-400'
                  }`} style={{animationDelay: `${i * 0.2}s`}}></div>
                ))}
              </div>
              <p className="text-yellow-200 font-casino-light text-xl">
                MULTI-LINE JACKPOT MACHINE
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Panel - Statistics */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border-4 border-yellow-500">
                <GameStats gameState={gameState} />
              </div>
            </div>

            {/* Center - Main Slot Machine */}
            <div className="lg:col-span-2">
              {/* Machine Body */}
              <div className="bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-3xl p-8 border-8 border-yellow-400 shadow-2xl relative overflow-hidden">
                {/* Chrome Details */}
                <div className="absolute inset-4 border-4 border-gray-300 rounded-2xl opacity-30"></div>
                
                {/* Slot Window */}
                <div className="relative bg-black rounded-2xl p-6 mb-6 border-4 border-gray-600 shadow-inner">
                  {/* Payline Indicators */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Center Line */}
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform -translate-y-0.5 opacity-80"></div>
                    {/* Top Line */}
                    <div className="absolute top-8 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-60"></div>
                    {/* Bottom Line */}
                    <div className="absolute bottom-8 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60"></div>
                    {/* Diagonal Lines */}
                    <div className="absolute inset-4">
                      <svg className="w-full h-full opacity-40">
                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(255,0,255,0.6)" strokeWidth="2"/>
                        <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(0,255,255,0.6)" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>

                  {/* Reels Container - New 3x3 Grid */}
                  <div className="relative z-10">
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

                {/* Machine Base */}
                <div className="bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-xl p-4 border-2 border-yellow-300">
          <GameControls
            gameState={gameState}
            onSpin={spin}
            onBetChange={updateBet}
            onMaxBet={maxBet}
            onPaylineChange={updatePaylines}
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

            {/* Right Panel - Payouts */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-green-800 to-green-900 rounded-2xl p-6 border-4 border-green-500">
                <h3 className="text-2xl font-casino text-green-300 mb-6 text-center">💰 PAYOUTS</h3>
                
                {/* Jackpot Display */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-4 mb-6 text-center border-2 border-yellow-300">
                  <div className="text-black font-casino text-lg">JACKPOT</div>
                  <div className="text-black font-casino text-2xl">{(gameState.bet * 100).toLocaleString()}</div>
                </div>

                {/* Symbol Payouts */}
                <div className="space-y-3">
                  {Object.entries(SYMBOL_VALUES)
                    .filter(([symbol, value]) => value > 0) // Only show symbols with payouts
                    .map(([symbol, value]) => (
                    <div key={symbol} className="flex items-center justify-between bg-green-700/50 rounded-lg p-3 border border-green-600">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{symbol}</span>
                        <div className="text-green-200 text-sm">
                          <div>3 = {value}x</div>
                          <div>2 = {Math.floor(value * 0.5)}x</div>
                        </div>
                      </div>
                      <div className="text-green-300 font-casino text-lg">
                        {(value * gameState.bet).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Symbols */}
                <div className="mt-4 space-y-2">
                  <div className="bg-purple-900/50 rounded-lg p-3 border border-purple-600">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🃏</span>
                      <div className="text-purple-200 text-sm">
                        <div className="font-casino">WILD</div>
                        <div>Substitutes any symbol</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-pink-900/50 rounded-lg p-3 border border-pink-600">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💥</span>
                      <div className="text-pink-200 text-sm">
                        <div className="font-casino">SCATTER</div>
                        <div>3+ = Free Spins</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-900/50 rounded-lg p-3 border border-orange-600">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎁</span>
                      <div className="text-orange-200 text-sm">
                        <div className="font-casino">BONUS DROP</div>
                        <div>Collect all 9 for MEGA BONUS!</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paylines Info */}
                <div className="mt-6 bg-blue-900/50 rounded-lg p-4 border border-blue-600">
                  <h4 className="text-blue-300 font-casino text-center mb-3">ACTIVE PAYLINES</h4>
                  <div className="space-y-2 text-sm text-blue-200">
                    <div className="flex justify-between">
                      <span>Center Line</span>
                      <span className="w-4 h-1 bg-yellow-400 rounded"></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top Line</span>
                      <span className="w-4 h-0.5 bg-green-400 rounded"></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bottom Line</span>
                      <span className="w-4 h-0.5 bg-blue-400 rounded"></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diagonals</span>
                      <span className="text-purple-400">╲╱</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Machine Footer */}
          <div className="mt-6 bg-gradient-to-r from-purple-800 to-purple-900 rounded-2xl p-4 border-2 border-purple-600">
            <div className="text-center text-purple-200 font-casino-light">
              <p>Licensed Gaming Machine • RNG Certified • Responsible Gaming</p>
              <div className="flex justify-center gap-4 mt-2 text-sm">
                <span>RTP: 96.5%</span>
                <span>Max Win: 1000x</span>
                <span>Volatility: High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};