import React from 'react';

interface TileCounterProps {
  counts: Record<string, number>;
}

const TileCounter: React.FC<TileCounterProps> = ({ counts }) => {
  const renderRow = (label: string, symbols: string[], colorClass: string) => (
    <div className="mb-2">
      <div className="flex flex-wrap gap-1">
        {symbols.map(sym => {
           const count = counts[sym] ?? 4;
           const opacity = count === 0 ? 'opacity-20 grayscale' : count === 1 ? 'opacity-50' : 'opacity-100';
           const bg = count === 0 ? 'bg-red-900/20' : 'bg-black/20';
           
           return (
             <div key={sym} className={`relative w-8 h-10 ${bg} rounded border border-white/10 flex flex-col items-center justify-center ${opacity} transition-all`}>
               <span className={`text-[10px] font-bold ${colorClass}`}>{sym}</span>
               <div className={`absolute -bottom-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono border border-black
                  ${count >= 3 ? 'bg-green-500 text-white' : count === 2 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}
               `}>
                 {count}
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );

  const mans = Array.from({length: 9}, (_, i) => `${i+1}萬`);
  const pins = Array.from({length: 9}, (_, i) => `${i+1}筒`);
  const sous = Array.from({length: 9}, (_, i) => `${i+1}条`);

  return (
    <div className="bg-gray-900/90 text-white p-3 rounded-xl border border-gray-700 w-full shadow-2xl backdrop-blur-md">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-700 pb-1">
        牌堆计数 (实时)
      </h3>
      {renderRow('萬子', mans, 'text-red-400')}
      {renderRow('筒子', pins, 'text-blue-400')}
      {renderRow('索子', sous, 'text-green-400')}
      
      <div className="grid grid-cols-2 gap-2 mt-2">
         {renderRow('风牌', ['東', '南', '西', '北'], 'text-gray-200')}
         {renderRow('箭牌', ['中', '发', '白'], 'text-purple-300')}
      </div>
    </div>
  );
};

export default TileCounter;
