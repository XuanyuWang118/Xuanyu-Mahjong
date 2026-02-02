import React from 'react';
import { Player, Tile, HuResult } from '../types';
import MahjongTile from './MahjongTile';
import { Trophy, ArrowRightCircle, Star } from 'lucide-react';

interface EndGameModalProps {
  summary: {
    winnerName: string;
    winType: 'ron' | 'tsumo' | null;
    allPlayersHands: Player[]; // All players with their full, sorted hands
    winningTile: Tile | null; // The tile that completed the winning hand
    winnerId: number | null;
    huResult: HuResult | null; // Detailed fan calculation result
    playerGoldChanges: { id: number; change: number }[]; // Gold change for each player
  };
  onRestartGame: () => void;
}

const EndGameModal: React.FC<EndGameModalProps> = ({ summary, onRestartGame }) => {
  const { winnerName, winType, allPlayersHands, winningTile, winnerId, huResult, playerGoldChanges } = summary;

  const getWinMessage = () => {
    if (winType === 'tsumo') {
      return `${winnerName} 自摸胡牌!`;
    } else if (winType === 'ron' && winningTile) {
      const discarderChange = playerGoldChanges.find(c => c.id !== winnerId && c.change < 0);
      const discarder = allPlayersHands.find(p => p.id === discarderChange?.id); // Find who paid for Ron
      return `${winnerName} 放铳胡牌! (由 ${discarder?.name || '某玩家'} 点炮 ${winningTile.symbol})`;
    } else {
      return "本局流局 (无人胡牌)";
    }
  };

  const isBankrupt = (player: Player) => player.gold <= 0;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex flex-col items-center justify-center p-4 animate-in zoom-in-90 duration-300">
      <div className="bg-gradient-to-br from-gray-800 to-gray-950 p-8 rounded-3xl shadow-2xl border-4 border-yellow-600/50 max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="text-center mb-8">
          <Trophy size={80} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
          <h1 className="text-5xl font-black text-white uppercase tracking-wider mb-2 drop-shadow-lg">
            {winnerId !== null ? '对局结束!' : '本局流局'}
          </h1>
          <p className="text-xl text-yellow-200 font-semibold mb-4">{getWinMessage()}</p>
          <div className="h-1 w-24 bg-yellow-500 mx-auto rounded-full"></div>
        </div>

        {huResult && huResult.meetsMinFan && (
          <div className="bg-green-900/40 p-4 rounded-xl mb-6 text-center border border-green-700 shadow-lg animate-in zoom-in-90 duration-500">
            <h3 className="text-2xl font-bold text-green-200 mb-2 flex items-center justify-center gap-2">
                <Star className="text-yellow-400" />
                胡牌类型: <span className="text-yellow-400">{huResult.totalFan}番</span>
            </h3>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-green-100">
              {huResult.fanList.map((fan, i) => (
                <span key={i} className="px-3 py-1 bg-green-800 rounded-full">{fan.name} ({fan.fan}番)</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8 mb-8">
          {allPlayersHands.map(player => {
            const goldChange = playerGoldChanges.find(gc => gc.id === player.id)?.change || 0;
            const goldChangeColor = goldChange > 0 ? 'text-green-400' : goldChange < 0 ? 'text-red-400' : 'text-gray-400';
            const goldChangeSign = goldChange > 0 ? '+' : '';

            return (
              <div 
                key={player.id} 
                className={`bg-gray-900/60 p-5 rounded-2xl border border-gray-700 shadow-xl flex flex-col gap-4 
                            ${player.id === winnerId ? 'ring-4 ring-yellow-500 transform scale-[1.02] transition-transform duration-300' : ''}
                            ${isBankrupt(player) ? 'grayscale border-red-500 ring-2 ring-red-500' : ''}`}
              >
                <h3 className={`text-xl font-bold ${player.id === winnerId ? 'text-yellow-400' : 'text-gray-300'} flex items-center justify-between`}>
                  <span>{player.name} {player.id === winnerId && <span className="text-sm">(赢家)</span>}</span>
                  <span className={`text-lg font-mono ${goldChangeColor}`}>{goldChangeSign}{goldChange} 金币 (当前: {player.gold}) {isBankrupt(player) && <span className="text-red-500 ml-2">(破产)</span>}</span>
                </h3>
                
                <div className="flex flex-wrap gap-2 items-end">
                  {/* Display Melds */}
                  {player.melds.map((meld, i) => (
                    <div key={i} className="flex gap-0.5 bg-black/40 p-1.5 rounded-lg border border-white/10 shadow-lg">
                      {meld.tiles.map((t, tileIdx) => (
                        <MahjongTile 
                          key={t.id} 
                          tile={t} 
                          size="md" 
                          hidden={meld.type === 'angang' && (tileIdx === 0 || tileIdx === 3)} // Show all for angang in modal
                          highlight={winningTile?.id === t.id} // Highlight winning tile if it's part of a meld
                        />
                      ))}
                    </div>
                  ))}

                  {/* Display Hand */}
                  <div className="flex gap-1 ml-4 flex-wrap">
                    {player.hand.map(tile => (
                      <MahjongTile 
                        key={tile.id} 
                        tile={tile} 
                        size="md" 
                        highlight={player.id === winnerId && winningTile?.id === tile.id} // Highlight winning tile in hand
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={onRestartGame} 
          className="w-full mt-4 flex items-center justify-center gap-3 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-xl shadow-lg uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <ArrowRightCircle size={28} />
          下一局
        </button>
      </div>
    </div>
  );
};

export default EndGameModal;
