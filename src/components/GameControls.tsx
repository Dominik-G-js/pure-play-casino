import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GameState } from "./SlotMachine";

interface GameControlsProps {
  gameState: GameState;
  onSpin: () => void;
  onBetChange: (betPerLine: number) => void;
  onMaxBet: () => void;
  onPaylineChange?: (paylines: number) => void;
}

export const GameControls = ({ gameState, onSpin, onBetChange, onMaxBet, onPaylineChange }: GameControlsProps) => {
  const totalBet = gameState.betPerLine * gameState.activePaylines;
  const canSpin = !gameState.isSpinning && (gameState.balance >= totalBet || gameState.freeSpins > 0);
  
  return (
    <div className="casino-panel space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-casino text-casino-gold mb-4">ADVANCED CONTROLS</h3>
      </div>

      {/* Free Spins & Bonus Display */}
      {(gameState.freeSpins > 0 || gameState.multiplier > 1 || gameState.inBonus) && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-xl p-4">
          <div className="text-center space-y-2">
            {gameState.freeSpins > 0 && (
              <div>
                <div className="text-lg font-casino text-purple-300 animate-pulse">🎉 FREE SPINS</div>
                <div className="text-2xl font-casino text-casino-gold">{gameState.freeSpins}</div>
              </div>
            )}
            {gameState.multiplier > 1 && (
              <div>
                <div className="text-lg font-casino text-pink-300 animate-pulse">⚡ MULTIPLIER</div>
                <div className="text-2xl font-casino text-casino-gold">{gameState.multiplier}x</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balance Display */}
      <div className="text-center p-4 bg-secondary/30 rounded-xl">
        <div className="text-sm text-muted-foreground font-casino-light mb-1">BALANCE</div>
        <div className="text-3xl font-casino text-casino-gold">
          {gameState.balance.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">credits</div>
      </div>

      {/* Multi-Line Betting Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bet Per Line */}
        <div className="bg-secondary/20 rounded-lg p-3 border border-border/30">
          <div className="text-center mb-2">
            <div className="text-xs text-muted-foreground font-casino-light">BET PER LINE</div>
            <div className="text-xl font-casino text-casino-neon">{gameState.betPerLine}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBetChange(Math.max(1, gameState.betPerLine - 1))}
              disabled={gameState.isSpinning || gameState.betPerLine <= 1}
              className="h-8 w-8 p-0 font-casino btn-casino-secondary"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBetChange(gameState.betPerLine + 1)}
              disabled={gameState.isSpinning || (gameState.betPerLine + 1) * gameState.activePaylines > gameState.balance}
              className="h-8 w-8 p-0 font-casino btn-casino-secondary"
            >
              +
            </Button>
          </div>
        </div>

        {/* Active Paylines */}
        <div className="bg-secondary/20 rounded-lg p-3 border border-border/30">
          <div className="text-center mb-2">
            <div className="text-xs text-muted-foreground font-casino-light">PAYLINES</div>
            <div className="text-xl font-casino text-casino-neon">{gameState.activePaylines}/5</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaylineChange?.(Math.max(1, gameState.activePaylines - 1))}
              disabled={gameState.isSpinning || gameState.activePaylines <= 1}
              className="h-8 w-8 p-0 font-casino btn-casino-secondary"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaylineChange?.(Math.min(5, gameState.activePaylines + 1))}
              disabled={gameState.isSpinning || gameState.activePaylines >= 5 || gameState.betPerLine * (gameState.activePaylines + 1) > gameState.balance}
              className="h-8 w-8 p-0 font-casino btn-casino-secondary"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Total Bet Display */}
      <div className="text-center p-4 bg-casino-neon/10 border border-casino-neon/20 rounded-xl">
        <div className="text-sm text-muted-foreground font-casino-light mb-1">TOTAL BET</div>
        <div className="text-2xl font-casino text-casino-neon">
          {totalBet.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {gameState.betPerLine} × {gameState.activePaylines} lines
        </div>
      </div>

      {/* Quick Bet Buttons */}
      <div className="space-y-2">
        <div className="text-center text-xs text-muted-foreground font-casino-light">QUICK BET PER LINE</div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 5, 10].map((bet) => (
            <Button
              key={bet}
              variant="outline"
              size="sm"
              onClick={() => onBetChange(bet)}
              disabled={gameState.isSpinning || bet * gameState.activePaylines > gameState.balance}
              className={`btn-casino-secondary text-xs ${
                gameState.betPerLine === bet ? 'bg-casino-gold/20 border-casino-gold' : ''
              }`}
            >
              {bet}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onSpin}
          disabled={!canSpin}
          className={`w-full h-14 text-xl font-casino cursor-pointer ${
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
            'FREE SPIN'
          ) : (
            'SPIN TO WIN'
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onMaxBet}
            disabled={gameState.isSpinning}
            className="btn-casino-secondary"
          >
            MAX BET
          </Button>
          
          <Button
            onClick={() => onBetChange(1)}
            disabled={gameState.isSpinning}
            className="btn-casino-secondary"
          >
            MIN BET
          </Button>
        </div>
      </div>

      {/* Last Win Display */}
      {gameState.lastWin > 0 && (
        <div className="text-center p-3 bg-casino-green/20 border border-casino-green/30 rounded-lg">
          <div className="text-sm text-casino-green font-casino-light">LAST WIN</div>
          <div className="text-xl font-casino text-casino-green">
            +{gameState.lastWin.toLocaleString()}
          </div>
          {(gameState.winningLines?.length || 0) > 1 && (
            <div className="text-xs text-casino-green/80 font-casino-light">
              {gameState.winningLines.length} winning lines
            </div>
          )}
        </div>
      )}
    </div>
  );
};