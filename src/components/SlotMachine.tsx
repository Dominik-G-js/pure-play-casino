import { useState, useEffect, useRef } from "react";
import { SlotReel } from "./SlotReel";
import { GameControls } from "./GameControls";
import { GameStats } from "./GameStats";
import { ParticleSystem } from "./ParticleSystem";
import { SoundManager } from "./SoundManager";
import { useToast } from "@/hooks/use-toast";

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣'];
const SYMBOL_VALUES = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 5,
  '🔔': 10,
  '⭐': 15,
  '💎': 25,
  '7️⃣': 50
};

export interface GameState {
  balance: number;
  bet: number;
  isSpinning: boolean;
  wins: number;
  losses: number;
  totalWon: number;
  totalBet: number;
  lastWin: number;
}

export const SlotMachine = () => {
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('slot-machine-state');
    return saved ? JSON.parse(saved) : {
      balance: 1000,
      bet: 10,
      isSpinning: false,
      wins: 0,
      losses: 0,
      totalWon: 0,
      totalBet: 0,
      lastWin: 0
    };
  });

  const [reelResults, setReelResults] = useState(['🍒', '🍒', '🍒']);
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

  const checkWin = (results: string[]) => {
    // Check for three of a kind
    if (results[0] === results[1] && results[1] === results[2]) {
      return SYMBOL_VALUES[results[0] as keyof typeof SYMBOL_VALUES] * gameState.bet;
    }
    
    // Check for two of a kind
    if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
      const symbol = results[0] === results[1] ? results[0] : 
                   results[1] === results[2] ? results[1] : results[0];
      return Math.floor(SYMBOL_VALUES[symbol as keyof typeof SYMBOL_VALUES] * gameState.bet * 0.5);
    }
    
    return 0;
  };

  const spin = async () => {
    if (gameState.isSpinning || gameState.balance < gameState.bet) {
      if (gameState.balance < gameState.bet) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough credits to place this bet.",
          variant: "destructive"
        });
      }
      return;
    }

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      balance: prev.balance - prev.bet,
      totalBet: prev.totalBet + prev.bet
    }));

    // Play spin sound
    soundManager.current.playSpinSound();

    // Simulate spinning animation delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    const results = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    setReelResults(results);

    const winAmount = checkWin(results);
    
    setGameState(prev => ({
      ...prev,
      isSpinning: false,
      balance: prev.balance + winAmount,
      wins: winAmount > 0 ? prev.wins + 1 : prev.wins,
      losses: winAmount === 0 ? prev.losses + 1 : prev.losses,
      totalWon: prev.totalWon + winAmount,
      lastWin: winAmount
    }));

    if (winAmount > 0) {
      setShowParticles(true);
      soundManager.current.playWinSound();
      
      toast({
        title: "🎉 Winner!",
        description: `You won ${winAmount} credits!`,
        className: "bg-casino-gradient text-primary-foreground"
      });

      setTimeout(() => setShowParticles(false), 3000);
    } else {
      soundManager.current.playLoseSound();
    }
  };

  const updateBet = (newBet: number) => {
    if (!gameState.isSpinning && newBet <= gameState.balance) {
      setGameState(prev => ({ ...prev, bet: newBet }));
    }
  };

  const maxBet = () => {
    const maxPossible = Math.min(100, gameState.balance);
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

                  {/* Reels Container */}
                  <div className="flex justify-center gap-2 relative z-10">
                    {reelResults.map((symbol, index) => (
                      <div key={index} className="relative">
                        {/* Reel Frame */}
                        <div className="absolute -inset-2 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-xl shadow-lg"></div>
                        <SlotReel
                          symbol={symbol}
                          isSpinning={gameState.isSpinning}
                          delay={index * 500}
                        />
                      </div>
                    ))}
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
                  {Object.entries(SYMBOL_VALUES).map(([symbol, value]) => (
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