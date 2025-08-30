import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GameState } from "./SlotMachine";

interface GameControlsProps {
  gameState: GameState;
  onSpin: () => void;
  onBetChange: (bet: number) => void;
  onMaxBet: () => void;
}

export const GameControls = ({ gameState, onSpin, onBetChange, onMaxBet }: GameControlsProps) => {
  const betOptions = [1, 5, 10, 25, 50, 100];

  return (
    <div className="casino-panel space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-casino text-casino-gold mb-4">GAME CONTROLS</h3>
      </div>

      {/* Balance Display */}
      <div className="text-center p-4 bg-secondary/30 rounded-xl">
        <div className="text-sm text-muted-foreground font-casino-light mb-1">BALANCE</div>
        <div className="text-3xl font-casino text-casino-gold">
          {gameState.balance.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">credits</div>
      </div>

      {/* Bet Controls */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground font-casino-light mb-2">BET AMOUNT</div>
          <div className="text-2xl font-casino text-casino-neon mb-4">
            {gameState.bet}
          </div>
        </div>

        {/* Bet Slider */}
        <div className="px-4">
          <Slider
            value={[gameState.bet]}
            onValueChange={([value]) => onBetChange(value)}
            max={Math.min(100, gameState.balance)}
            min={1}
            step={1}
            className="w-full"
            disabled={gameState.isSpinning}
          />
        </div>

        {/* Quick Bet Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {betOptions.slice(0, 6).map((bet) => (
            <Button
              key={bet}
              variant="outline"
              size="sm"
              onClick={() => onBetChange(bet)}
              disabled={gameState.isSpinning || bet > gameState.balance}
              className={`btn-casino-secondary text-xs ${
                gameState.bet === bet ? 'bg-casino-gold/20 border-casino-gold' : ''
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
          disabled={gameState.isSpinning || gameState.balance < gameState.bet}
          className="w-full btn-casino-primary h-14 text-xl"
        >
          {gameState.isSpinning ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              SPINNING...
            </div>
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
        </div>
      )}
    </div>
  );
};