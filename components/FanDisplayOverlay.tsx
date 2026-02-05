
import React from 'react';
import { HuResult } from '../types';

interface FanDisplayOverlayProps {
  huResult: HuResult;
  winnerName: string;
}

const FanDisplayOverlay: React.FC<FanDisplayOverlayProps> = ({ huResult, winnerName }) => {
  return (
    <div className="fixed inset-0 z-[2000] pointer-events-none flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-500"></div>
      
      <div className="relative flex flex-col items-center">
        <div className="text-9xl font-black text-yellow-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-in zoom-in-50 duration-300 flex items-baseline gap-4">
          {huResult.huType === 'tsumo' ? '自 摸' : '胡 牌'}
          <span className="text-4xl text-white opacity-80">{winnerName}</span>
        </div>
        
        <div className="mt-8 flex gap-4 animate-in slide-in-from-bottom-20 duration-500 delay-300 flex-wrap justify-center max-w-4xl">
           {huResult.fanList.map((fan, i) => (
             <div key={i} className="px-6 py-2 bg-gradient-to-t from-red-900/80 to-red-600/80 text-white rounded-full border-2 border-yellow-500/50 shadow-2xl font-bold text-xl flex items-center gap-2">
                {fan.name} <span className="text-yellow-300">+{fan.fan}</span>
             </div>
           ))}
           {huResult.dealerMultiplier && huResult.dealerMultiplier > 1 && (
             <div className="px-6 py-2 bg-gradient-to-t from-yellow-900/80 to-yellow-600/80 text-white rounded-full border-2 border-yellow-500/50 shadow-2xl font-bold text-xl flex items-center gap-2">
                庄家倍率 <span className="text-yellow-300">× {huResult.dealerMultiplier}</span>
             </div>
           )}
        </div>

        <div className="mt-6 text-6xl font-black text-white animate-in zoom-in-150 duration-700 delay-500 drop-shadow-2xl text-center">
           共计 <span className="text-yellow-400 italic">{huResult.totalFan}</span> 番
           {huResult.dealerMultiplier && huResult.dealerMultiplier > 1 ? (
             <span className="ml-4 text-yellow-300 text-4xl">× 庄家{huResult.dealerMultiplier}</span>
           ) : null}
        </div>
      </div>
    </div>
  );
};

export default FanDisplayOverlay;
