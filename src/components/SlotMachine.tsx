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
    <div className="casino-panel max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="gold-text text-3xl mb-2">TRIPLE DIAMOND SLOTS</h2>
        <p className="text-muted-foreground font-casino-light">
          Match 3 symbols to win big!
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Statistics */}
        <div className="lg:col-span-1">
          <GameStats gameState={gameState} />
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slot Reels */}
          <div className="relative">
            <div className="flex justify-center gap-4 mb-6">
              {reelResults.map((symbol, index) => (
                <SlotReel
                  key={index}
                  symbol={symbol}
                  isSpinning={gameState.isSpinning}
                  delay={index * 500}
                />
              ))}
            </div>

            {/* Particle Effects */}
            {showParticles && (
              <div ref={particleRef} className="absolute inset-0 pointer-events-none">
                <ParticleSystem />
              </div>
            )}
          </div>

          {/* Game Controls */}
          <GameControls
            gameState={gameState}
            onSpin={spin}
            onBetChange={updateBet}
            onMaxBet={maxBet}
          />

          {/* Paylines */}
          <div className="casino-panel bg-secondary/30">
            <h3 className="text-lg font-casino text-casino-gold mb-4 text-center">ALL SYMBOLS & PAYOUTS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {Object.entries(SYMBOL_VALUES).map(([symbol, value]) => (
                <div key={symbol} className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors border border-border/30">
                  <span className="text-4xl mb-2">{symbol}</span>
                  <span className="font-casino text-casino-gold text-lg">{value}x</span>
                  <span className="text-xs text-muted-foreground font-casino-light">bet</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-casino-gold/10 border border-casino-gold/20 rounded-lg">
              <p className="text-center text-sm font-casino-light text-muted-foreground">
                <span className="text-casino-gold font-casino">3 matching symbols:</span> Full payout • 
                <span className="text-casino-gold font-casino ml-2">2 matching symbols:</span> Half payout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};