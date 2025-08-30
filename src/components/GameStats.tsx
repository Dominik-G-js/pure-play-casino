import { GameState } from "./SlotMachine";

interface GameStatsProps {
  gameState: GameState;
}

export const GameStats = ({ gameState }: GameStatsProps) => {
  const winRate = gameState.wins + gameState.losses > 0 
    ? ((gameState.wins / (gameState.wins + gameState.losses)) * 100).toFixed(1)
    : 0;
    
  const netProfit = gameState.totalWon - gameState.totalBet;
  const profitColor = netProfit >= 0 ? 'text-casino-green' : 'text-casino-red';

  return (
    <div className="casino-panel space-y-4">
      <div className="text-center border-b border-border/30 pb-4">
        <h3 className="text-xl font-casino text-casino-gold">STATISTICS</h3>
      </div>

      <div className="space-y-4">
        {/* Win/Loss Record */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-casino-green/10 border border-casino-green/20 rounded-lg">
            <div className="text-2xl font-casino text-casino-green">{gameState.wins}</div>
            <div className="text-xs text-muted-foreground font-casino-light">WINS</div>
          </div>
          <div className="text-center p-3 bg-casino-red/10 border border-casino-red/20 rounded-lg">
            <div className="text-2xl font-casino text-casino-red">{gameState.losses}</div>
            <div className="text-xs text-muted-foreground font-casino-light">LOSSES</div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <div className="text-2xl font-casino text-casino-neon">{winRate}%</div>
          <div className="text-xs text-muted-foreground font-casino-light">WIN RATE</div>
        </div>

        {/* Financial Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded">
            <span className="text-sm font-casino-light text-muted-foreground">Total Bet:</span>
            <span className="font-casino text-casino-gold">{gameState.totalBet.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded">
            <span className="text-sm font-casino-light text-muted-foreground">Total Won:</span>
            <span className="font-casino text-casino-green">{gameState.totalWon.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded">
            <span className="text-sm font-casino-light text-muted-foreground">Net Profit:</span>
            <span className={`font-casino ${profitColor}`}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress Bar for Balance */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-casino-light text-muted-foreground">Balance Health</span>
            <span className="font-casino text-casino-gold">{Math.min(100, (gameState.balance / 1000) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-secondary/30 rounded-full h-2">
            <div 
              className="bg-casino-gradient h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (gameState.balance / 1000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-casino-light text-center">ACHIEVEMENTS</div>
          <div className="grid grid-cols-2 gap-2">
            {gameState.wins >= 10 && (
              <div className="text-center p-2 bg-casino-gold/10 border border-casino-gold/20 rounded text-xs">
                <div className="text-casino-gold">🏆</div>
                <div className="font-casino-light text-muted-foreground">10 Wins</div>
              </div>
            )}
            {gameState.totalWon >= 1000 && (
              <div className="text-center p-2 bg-casino-neon/10 border border-casino-neon/20 rounded text-xs">
                <div className="text-casino-neon">💰</div>
                <div className="font-casino-light text-muted-foreground">Big Winner</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};