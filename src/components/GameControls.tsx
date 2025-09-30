import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GameState } from "./SlotMachine";

interface GameControlsProps {
  gameState: GameState;
  onSpin: () => void;
  onBetChange: (betPerLine: number) => void;
  onMaxBet: () => void;
  onPaylineChange?: (paylines: number) => void;
  onAutoSpinStart: (count: number) => void;
  onAutoSpinStop: () => void;
}

export const GameControls = ({ gameState, onSpin, onBetChange, onMaxBet, onPaylineChange, onAutoSpinStart, onAutoSpinStop }: GameControlsProps) => {
  const totalBet = gameState.betPerLine * gameState.activePaylines;
  const canSpin = !gameState.isSpinning && (gameState.balance >= totalBet || gameState.freeSpins > 0);
  
  // Debug logging
  console.log('GameControls Debug:', {
    isSpinning: gameState.isSpinning,
    balance: gameState.balance,
    totalBet,
    freeSpins: gameState.freeSpins,
    canSpin,
    betPerLine: gameState.betPerLine,
    activePaylines: gameState.activePaylines
  });
  
  const autoSpinOptions = [10, 25, 50, 100];
  
  return (
    <div className="casino-panel space-y-2 lg:space-y-3">
      {/* Balance Display - Compact */}
      <div className="text-center p-2 bg-secondary/30 rounded-lg">
        <div className="text-xs text-muted-foreground font-casino-light">BALANCE</div>
        <div className="text-xl lg:text-2xl font-casino text-casino-gold">
          {gameState.balance.toLocaleString()}
        </div>
      </div>

      {/* MAIN SPIN BUTTON - Most Prominent */}
      {!gameState.autoSpinActive ? (
        <Button
          onClick={(e) => {
            console.log('Spin button clicked!', { canSpin, disabled: !canSpin });
            if (canSpin) {
              onSpin();
            }
          }}
          disabled={!canSpin}
          type="button"
          className={`w-full h-14 lg:h-16 text-xl lg:text-2xl font-casino ${
            canSpin ? 'cursor-pointer' : 'cursor-not-allowed'
          } ${
            gameState.freeSpins > 0 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 animate-pulse' 
              : 'btn-casino-primary'
          }`}
        >
          {gameState.isSpinning ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              SPINNING...
            </div>
          ) : gameState.freeSpins > 0 ? (
            '🎉 FREE SPIN 🎉'
          ) : (
            '🎰 SPIN TO WIN 🎰'
          )}
        </Button>
      ) : (
        <>
          {/* Auto Spin Active Button */}
          <Button
            onClick={onSpin}
            disabled={!canSpin}
            className="w-full h-14 lg:h-16 text-xl lg:text-2xl font-casino cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {gameState.isSpinning ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AUTO SPINNING...
              </div>
            ) : (
              `🔄 AUTO SPIN (${gameState.autoSpinRemaining})`
            )}
          </Button>

          {/* Stop Auto Spin */}
          <Button
            onClick={onAutoSpinStop}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            STOP AUTO SPIN
          </Button>
        </>
      )}


      {/* Bet Controls - Compact Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Bet Per Line */}
        <div className="bg-secondary/20 rounded p-2 border border-border/30">
          <div className="text-center mb-1">
            <div className="text-[10px] text-muted-foreground font-casino-light">BET/LINE</div>
            <div className="text-base lg:text-lg font-casino text-casino-neon">{gameState.betPerLine}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBetChange(Math.max(1, gameState.betPerLine - 1))}
              disabled={gameState.isSpinning || gameState.betPerLine <= 1}
              className="h-6 w-full p-0 font-casino btn-casino-secondary text-xs"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBetChange(gameState.betPerLine + 1)}
              disabled={gameState.isSpinning || (gameState.betPerLine + 1) * gameState.activePaylines > gameState.balance}
              className="h-6 w-full p-0 font-casino btn-casino-secondary text-xs"
            >
              +
            </Button>
          </div>
        </div>

        {/* Active Paylines */}
        <div className="bg-secondary/20 rounded p-2 border border-border/30">
          <div className="text-center mb-1">
            <div className="text-[10px] text-muted-foreground font-casino-light">PAYLINES</div>
            <div className="text-base lg:text-lg font-casino text-casino-neon">{gameState.activePaylines}/5</div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaylineChange?.(Math.max(1, gameState.activePaylines - 1))}
              disabled={gameState.isSpinning || gameState.activePaylines <= 1}
              className="h-6 w-full p-0 font-casino btn-casino-secondary text-xs"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaylineChange?.(Math.min(5, gameState.activePaylines + 1))}
              disabled={gameState.isSpinning || gameState.activePaylines >= 5 || gameState.betPerLine * (gameState.activePaylines + 1) > gameState.balance}
              className="h-6 w-full p-0 font-casino btn-casino-secondary text-xs"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Total Bet Display */}
      <div className="text-center p-2 bg-casino-neon/10 border border-casino-neon/20 rounded">
        <div className="text-xs text-muted-foreground font-casino-light">TOTAL BET</div>
        <div className="text-lg lg:text-xl font-casino text-casino-neon">
          {totalBet.toLocaleString()}
        </div>
      </div>

      {/* Auto Spin Options - Compact */}
      {!gameState.autoSpinActive && (
        <div className="grid grid-cols-4 gap-1.5">
          {autoSpinOptions.map((count) => (
            <Button
              key={count}
              onClick={() => onAutoSpinStart(count)}
              disabled={gameState.isSpinning || !canSpin}
              variant="outline"
              size="sm"
              className="btn-casino-secondary text-[10px] lg:text-xs h-7"
            >
              🔄 {count}
            </Button>
          ))}
        </div>
      )}

      {/* Quick Actions - Compact */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onMaxBet}
          disabled={gameState.isSpinning || gameState.autoSpinActive}
          className="btn-casino-secondary text-xs h-8"
        >
          MAX BET
        </Button>
        
        <Button
          onClick={() => onBetChange(1)}
          disabled={gameState.isSpinning || gameState.autoSpinActive}
          className="btn-casino-secondary text-xs h-8"
        >
          MIN BET
        </Button>
      </div>

      {/* Collapsible Info Sections */}
      {(gameState.freeSpins > 0 || gameState.multiplier > 1 || gameState.inBonus) && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded p-2">
          <div className="text-center space-y-1">
            {gameState.freeSpins > 0 && (
              <div>
                <div className="text-xs font-casino text-purple-300 animate-pulse">🎉 FREE SPINS</div>
                <div className="text-lg font-casino text-casino-gold">{gameState.freeSpins}</div>
              </div>
            )}
            {gameState.multiplier > 1 && (
              <div>
                <div className="text-xs font-casino text-pink-300 animate-pulse">⚡ MULTIPLIER</div>
                <div className="text-lg font-casino text-casino-gold">{gameState.multiplier}x</div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState.autoSpinActive && (
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded p-2">
          <div className="text-center space-y-1">
            <div className="text-xs font-casino text-blue-300 animate-pulse">🔄 AUTO SPIN ACTIVE</div>
            <div className="text-lg font-casino text-casino-gold">{gameState.autoSpinRemaining}</div>
            <div className="text-[10px] text-blue-200">spins remaining</div>
          </div>
        </div>
      )}

      {gameState.bonusDropProgress > 0 && (
        <div className="bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border border-orange-400/30 rounded p-2">
          <div className="text-center mb-2">
            <h4 className="text-xs font-casino text-orange-300">🎁 BONUS DROP</h4>
            <div className="text-[10px] text-orange-200">
              {gameState.bonusDropProgress}/9
            </div>
          </div>
          
          {/* 3x3 Grid Visual - Smaller */}
          <div className="grid grid-cols-3 gap-1 mx-auto max-w-[80px]">
            {gameState.bonusDropsCollected.map((collected, index) => (
              <div
                key={index}
                className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] transition-all ${
                  collected 
                    ? 'bg-orange-500 border-orange-300 text-white' 
                    : 'bg-gray-700 border-gray-500 text-gray-400'
                }`}
              >
                {collected ? '🎁' : '•'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Win Display */}
      {gameState.lastWin > 0 && (
        <div className="text-center p-2 bg-casino-green/20 border border-casino-green/30 rounded">
          <div className="text-xs text-casino-green font-casino-light">LAST WIN</div>
          <div className="text-lg font-casino text-casino-green">
            +{gameState.lastWin.toLocaleString()}
          </div>
          {(gameState.winningLines?.length || 0) > 1 && (
            <div className="text-[10px] text-casino-green/80 font-casino-light">
              {gameState.winningLines.length} lines
            </div>
          )}
        </div>
      )}
    </div>
  );
};
