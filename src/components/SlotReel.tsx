import { useState, useEffect } from "react";

interface SlotReelProps {
  symbol: string;
  isSpinning: boolean;
  delay: number;
}

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣'];

export const SlotReel = ({ symbol, isSpinning, delay }: SlotReelProps) => {
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isSpinning) {
      // Start spinning animation with delay
      const startSpin = setTimeout(() => {
        setAnimationClass('animate-spin-reel');
        
        // Change symbols rapidly during spin
        const symbolInterval = setInterval(() => {
          setCurrentSymbol(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        }, 100);

        // Stop spinning and show final result
        const stopSpin = setTimeout(() => {
          clearInterval(symbolInterval);
          setCurrentSymbol(symbol);
          setAnimationClass('bounce-win');
          
          // Remove bounce animation
          setTimeout(() => {
            setAnimationClass('');
          }, 800);
        }, 2000);

        return () => {
          clearInterval(symbolInterval);
          clearTimeout(stopSpin);
        };
      }, delay);

      return () => clearTimeout(startSpin);
    }
  }, [isSpinning, symbol, delay]);

  return (
    <div className="casino-reel w-32 h-32 md:w-40 md:h-40 flex items-center justify-center relative overflow-hidden">
      <div 
        className={`text-6xl md:text-7xl transition-all duration-300 ${animationClass}`}
        style={{
          filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
        }}
      >
        {currentSymbol}
      </div>
      
      {/* Spinning Overlay Effect */}
      {isSpinning && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse" />
      )}
      
      {/* Glow Effect for Special Symbols */}
      {(currentSymbol === '💎' || currentSymbol === '7️⃣') && !isSpinning && (
        <div className="absolute inset-0 bg-casino-gold/20 rounded-xl animate-pulse" />
      )}
    </div>
  );
};