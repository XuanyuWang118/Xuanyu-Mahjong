
import React from 'react';
import { Player, Tile, HuResult } from '../types';
import MahjongTile from './MahjongTile';
import { Trophy, ArrowRightCircle, Star } from 'lucide-react';

interface EndGameModalProps {
  summary: {
    winnerName: string;
    winType: 'ron' | 'tsumo' | null;
    allPlayersHands: Player[]; 
    winningTile: Tile | null; 
    winnerId: number | null;
    huResult: HuResult | null; 
    playerGoldChanges: { id: number; change: number }[]; 
  };
  onRestartGame: () => void;
}

const EndGameModal: React.FC<EndGameModalProps> = ({ summary, onRestartGame }) => {
  const { winnerName, winType, allPlayersHands, winningTile, winnerId, huResult, playerGoldChanges } = summary;

  const getFanTagStyle = (name: string) => {
    const structural = ['国士无双', '四暗刻', '七对', '碰碰胡'];
    const compositional = ['清一色', '混一色', '全带幺', '三色三同顺'];
    if (structural.includes(name)) return "bg-red-900/40 border-red-500/50 text-red-200";
    if (compositional.includes(name)) return "bg-blue-900/40 border-blue-500/50 text-blue-200";
    return "bg-green-900/40 border-green-500/50 text-green-200";
  };

  const player0Change = playerGoldChanges.find(gc => gc.id === 0)?.change || 0;

  // Determine Title Text based on outcome for Player 0
  let titleText = "对局流局";
  let titleColor = "text-gray-400";
  
  if (winnerId === null) {
      titleText = "平分秋色";
      titleColor = "text-gray-200";
  } else if (player0Change > 0) {
      titleText = "大获全胜";
      titleColor = "text-yellow-400";
  } else if (player0Change < 0) {
      titleText = "虽败犹荣";
      titleColor = "text-gray-400";
  } else {
      titleText = "避其锋芒"; // 0 change but not draw (e.g. other players transferred gold)
      titleColor = "text-blue-300";
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-300 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a2e1a] to-[#0d140d] p-8 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] border-4 border-yellow-600/30 max-w-6xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar relative">
        <div className="text-center mb-8">
          <Trophy size={64} className={`${player0Change > 0 ? 'text-yellow-400 animate-pulse' : 'text-gray-600'} mx-auto mb-4`} />
          <h1 className={`text-6xl font-black ${titleColor} uppercase tracking-tighter mb-2 font-calligraphy`}>
            {titleText}
          </h1>
          <p className="text-2xl text-yellow-200 font-bold mb-4 tracking-widest">
            {winType === 'tsumo' ? `${winnerName} 自摸胡牌!` : winType === 'ron' ? `${winnerName} 放铳胡牌!` : "本局流局"}
          </p>
        </div>

        {huResult && (
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl mb-8 border border-white/10 shadow-inner">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
               <h3 className="text-3xl font-black text-white flex items-center gap-3">
                  <Star className="text-yellow-400 fill-yellow-400" />
                  番数构成
               </h3>
               <div className="text-4xl font-black text-yellow-500 italic">
                  Total: {huResult.totalFan} 番 {huResult.dealerMultiplier && huResult.dealerMultiplier > 1 ? ` × 庄家${huResult.dealerMultiplier}` : ''}
               </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {huResult.fanList.map((fan, i) => (
                <div key={i} className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all cursor-default ${getFanTagStyle(fan.name)}`}>
                  <span className="font-bold tracking-wider">{fan.name}</span>
                  <span className="font-black opacity-80">+{fan.fan}</span>
                </div>
              ))}
              {huResult.dealerMultiplier && huResult.dealerMultiplier > 1 && (
                <div className="px-5 py-2.5 rounded-xl border bg-yellow-900/40 border-yellow-500/50 text-yellow-200 font-bold">
                  庄家倍率 × {huResult.dealerMultiplier}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6 mb-10">
          {allPlayersHands.map(player => {
            const goldChange = playerGoldChanges.find(gc => gc.id === player.id)?.change || 0;
            return (
              <div key={player.id} className={`p-6 rounded-3xl border ${player.id === winnerId ? 'bg-yellow-600/10 border-yellow-500/50 scale-[1.02]' : 'bg-white/5 border-white/5 opacity-80'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-black text-white">{player.name} ({player.seatWind})</span>
                  <div className={`text-2xl font-black font-mono ${goldChange > 0 ? 'text-green-400' : goldChange < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {goldChange > 0 ? `+${goldChange}` : goldChange} Gold
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {player.melds.map((m, i) => <div key={i} className="flex gap-0.5 bg-black/40 p-2 rounded-2xl border border-white/5">{m.tiles.map((t, ti) => <MahjongTile key={t.id} tile={t} size="md" hidden={m.type === 'angang' && (ti === 0 || ti === 3)} />)}</div>)}
                  <div className="flex gap-1 ml-4">{player.hand.map(tile => <MahjongTile key={tile.id} tile={tile} size="md" highlight={player.id === winnerId && winningTile?.id === tile.id} />)}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onRestartGame} className="w-full py-6 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black text-2xl rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02]">
          <ArrowRightCircle size={32} /> 再战一回
        </button>
      </div>
    </div>
  );
};

export default EndGameModal;
