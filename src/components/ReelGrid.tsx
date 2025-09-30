import { useState, useEffect } from "react";

interface ReelGridProps {
  grid: string[][];
  isSpinning: boolean;
  winningLines?: number[];
}

// 5-reel paylines
const PAYLINES = [
  // Horizontal lines
  [1, 1, 1, 1, 1], // Center
  [0, 0, 0, 0, 0], // Top  
  [2, 2, 2, 2, 2], // Bottom
  // V-shapes
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  // Zig-zags
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  // Diagonals
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  // Special patterns
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 2, 2, 2]
];

export const ReelGrid = ({ grid, isSpinning, winningLines }: ReelGridProps) => {
  const [spinningSymbols, setSpinningSymbols] = useState(grid || [
    ['🍒', '🍋', '🍊'],
    ['🍒', '🍋', '🍊'], 
    ['🍒', '🍋', '🍊'],
    ['🍒', '🍋', '🍊'],
    ['🍒', '🍋', '🍊']
  ]);

  useEffect(() => {
    if (isSpinning) {
      const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣', '🃏', '💥', '🎁', '🌟'];
      const interval = setInterval(() => {
        setSpinningSymbols([
          [symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)]],
          [symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)]],
          [symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)]],
          [symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)]],
          [symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)], 
           symbols[Math.floor(Math.random() * symbols.length)]]
        ]);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setSpinningSymbols(grid || [
        ['🍒', '🍋', '🍊'],
        ['🍒', '🍋', '🍊'], 
        ['🍒', '🍋', '🍊'],
        ['🍒', '🍋', '🍊'],
        ['🍒', '🍋', '🍊']
      ]);
    }
  }, [isSpinning, grid]);

  const getSymbolStyle = (reelIndex: number, positionIndex: number) => {
    let baseClasses = "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold transition-all duration-300 border-2 shadow-lg";
    
    // Check if this position is part of a winning line
    let isWinning = false;
    (winningLines || []).forEach(lineIndex => {
      const payline = PAYLINES[lineIndex];
      if (payline && payline[reelIndex] === positionIndex) {
        isWinning = true;
      }
    });

    if (isWinning && !isSpinning) {
      baseClasses += " bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-400 animate-pulse shadow-xl shadow-yellow-400/50";
    } else if (isSpinning) {
      baseClasses += " bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 animate-bounce";
    } else {
      // Symbol-specific styling
      const symbol = spinningSymbols?.[reelIndex]?.[positionIndex];
      if (symbol) {
        switch (symbol) {
        case '🌟': // MEGA symbol
          baseClasses += " bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-600 border-yellow-400 shadow-yellow-400/50 animate-pulse";
          break;
        case '🃏': // Wild
          baseClasses += " bg-gradient-to-br from-purple-500 to-purple-700 border-purple-400 shadow-purple-400/30";
          break;
        case '💥': // Scatter
          baseClasses += " bg-gradient-to-br from-red-500 to-red-700 border-red-400 shadow-red-400/30";
          break;
        case '🎁': // Bonus Drop
          baseClasses += " bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400 shadow-orange-400/30";
          break;
        case '💎':
        case '7️⃣':
          baseClasses += " bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400 shadow-blue-400/30";
          break;
        default:
          baseClasses += " bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500";
        }
      }
    }

    return baseClasses;
  };

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 p-2 sm:p-3 md:p-4 bg-black/80 rounded-xl md:rounded-2xl border-2 md:border-4 border-gray-600 shadow-inner relative w-full max-w-full overflow-hidden">
      {/* Payline overlays */}
      {(winningLines || []).map(lineIndex => {
        const payline = PAYLINES[lineIndex];
        if (!payline || isSpinning) return null;
        
        const colors = ['yellow-400', 'green-400', 'blue-400', 'purple-400', 'pink-400'];
        const color = colors[lineIndex % colors.length];
        
        return (
          <div key={lineIndex} className="absolute inset-4 pointer-events-none">
            {lineIndex < 3 ? (
              // Horizontal lines
              <div 
                className={`absolute left-0 right-0 h-1 bg-${color} opacity-80 animate-pulse`}
                style={{
                  top: lineIndex === 0 ? '50%' : lineIndex === 1 ? '16.67%' : '83.33%',
                }}
              />
            ) : (
              // Diagonal lines
              <svg className="w-full h-full opacity-60">
                <line 
                  x1={lineIndex === 3 ? "12.5%" : "87.5%"} 
                  y1={lineIndex === 3 ? "12.5%" : "12.5%"} 
                  x2={lineIndex === 3 ? "87.5%" : "12.5%"} 
                  y2={lineIndex === 3 ? "87.5%" : "87.5%"} 
                  stroke={`rgb(${color === 'purple-400' ? '168,85,247' : '236,72,153'})`} 
                  strokeWidth="4"
                  className="animate-pulse"
                />
              </svg>
            )}
          </div>
        );
      })}

      {/* Reel symbols */}
      {(spinningSymbols || []).map((reel, reelIndex) =>
        (reel || []).map((symbol, positionIndex) => (
            <div
              key={`${reelIndex}-${positionIndex}`}
              className={getSymbolStyle(reelIndex, positionIndex)}
              style={{
                animationDelay: isSpinning ? `${reelIndex * 200 + positionIndex * 100}ms` : '0ms'
              }}
            >
              {symbol || '🍒'}
            </div>
        ))
      )}
    </div>
  );
};