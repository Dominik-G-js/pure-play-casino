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
    <div className="casino-panel space-y-4 lg:space-y-6">
      <div className="text-center">
        <h3 className="text-lg lg:text-xl font-casino text-casino-gold mb-2 lg:mb-4">GAME CONTROLS</h3>
      </div>

      {/* Auto Spin Display */}
      {gameState.autoSpinActive && (
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-3 lg:p-4">
          <div className="text-center space-y-2">
            <div className="text-sm lg:text-lg font-casino text-blue-300 animate-pulse">🔄 AUTO SPIN ACTIVE</div>
            <div className="text-xl lg:text-2xl font-casino text-casino-gold">{gameState.autoSpinRemaining}</div>
            <div className="text-xs lg:text-sm text-blue-200">spins remaining</div>
          </div>
        </div>
      )}

      {/* Bonus Drop Collection Progress */}
      {gameState.bonusDropProgress > 0 && (
        <div className="bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border border-orange-400/30 rounded-xl p-4">
          <div className="text-center mb-4">
            <h4 className="text-lg font-casino text-orange-300 mb-2">🎁 BONUS DROP COLLECTION</h4>
            <div className="text-sm text-orange-200">
              Progress: {gameState.bonusDropProgress}/9 positions
            </div>
          </div>
          
          {/* 3x3 Grid Visual */}
          <div className="grid grid-cols-3 gap-2 mx-auto max-w-[120px]">
            {gameState.bonusDropsCollected.map((collected, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs transition-all ${
                  collected 
                    ? 'bg-orange-500 border-orange-300 text-white animate-pulse' 
                    : 'bg-gray-700 border-gray-500 text-gray-400'
                }`}
              >
                {collected ? '🎁' : '•'}
              </div>
            ))}
          </div>
          
          {gameState.bonusDropProgress === 8 && (
            <div className="text-center mt-3 text-yellow-300 font-casino text-sm animate-pulse">
              ONE MORE FOR MEGA BONUS!
            </div>
          )}
        </div>
      )}

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
        {/* Auto Spin & Main Action Buttons */}
        {!gameState.autoSpinActive ? (
          <>
            {/* Manual Spin Button */}
            <Button
              onClick={(e) => {
                console.log('Spin button clicked!', { canSpin, disabled: !canSpin });
                if (canSpin) {
                  onSpin();
                }
              }}
              disabled={!canSpin}
              type="button"
              className={`w-full h-12 lg:h-14 text-lg lg:text-xl font-casino ${
                canSpin ? 'cursor-pointer' : 'cursor-not-allowed'
              } ${
                gameState.freeSpins > 0 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 animate-pulse' 
                  : 'btn-casino-primary'
              }`}
            >
              {gameState.isSpinning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  SPINNING...
                </div>
              ) : gameState.freeSpins > 0 ? (
                'FREE SPIN'
              ) : (
                'SPIN TO WIN'
              )}
            </Button>

            {/* Auto Spin Options */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {autoSpinOptions.map((count) => (
                <Button
                  key={count}
                  onClick={() => onAutoSpinStart(count)}
                  disabled={gameState.isSpinning || !canSpin}
                  variant="outline"
                  size="sm"
                  className="btn-casino-secondary text-xs lg:text-sm"
                >
                  🔄 {count}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Auto Spin Active Button */}
            <Button
              onClick={onSpin}
              disabled={!canSpin}
              className="w-full h-12 lg:h-14 text-lg lg:text-xl font-casino cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {gameState.isSpinning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onMaxBet}
            disabled={gameState.isSpinning || gameState.autoSpinActive}
            className="btn-casino-secondary text-sm lg:text-base"
          >
            MAX BET
          </Button>
          
          <Button
            onClick={() => onBetChange(1)}
            disabled={gameState.isSpinning || gameState.autoSpinActive}
            className="btn-casino-secondary text-sm lg:text-base"
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