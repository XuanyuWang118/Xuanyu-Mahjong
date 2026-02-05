
import React from 'react';
import { Tile } from '../types';

interface MahjongTileProps {
  tile: Tile;
  onClick?: () => void;
  selected?: boolean;
  highlight?: boolean; // For AI recommendation
  hidden?: boolean; // For opponents hand
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isHorizontal?: boolean; // For discard pile or side players
  riskScore?: number; // 新增：风险评分 (0-100)
}

const MahjongTile: React.FC<MahjongTileProps> = ({ 
  tile, 
  onClick, 
  selected, 
  highlight, 
  hidden, 
  size = 'md',
  className = '',
  isHorizontal = false,
  riskScore
}) => {
  
  const sizeClasses = {
    sm: 'w-6 h-8 text-[10px]',
    md: 'w-10 h-14 text-sm',
    lg: 'w-12 h-16 text-base'
  };

  const getTileContent = () => {
    if (hidden) return <div className="w-full h-full bg-blue-800 rounded-sm border-2 border-white/20 opacity-90" />;

    const { suit, value, symbol } = tile; // Use symbol directly for display
    let color = 'text-gray-800';
    
    // Simple visual mapping for SVG replacement logic
    if (suit === 'man') {
      color = 'text-red-700';
    } else if (suit === 'pin') {
      color = 'text-blue-600';
    } else if (suit === 'sou') {
      color = 'text-green-700';
    } else if (suit === 'wind') {
      color = 'text-black';
    } else if (suit === 'dragon') {
      if (value === 'Red') { color = 'text-red-600'; }
      if (value === 'Green') { color = 'text-green-600'; }
      if (value === 'White') { color = 'text-blue-800'; } 
    }

    return (
      <div className={`flex flex-col items-center justify-center h-full w-full leading-none font-bold ${color}`}>
         {/* Use symbol for display for all tiles, especially for honors */}
         {suit === 'dragon' && value === 'White' ? (
             <div className="w-[80%] h-[80%] border-2 border-blue-800/50 rounded-sm flex items-center justify-center">
                <span className="scale-100">{symbol}</span>
             </div>
         ) : (
             <span className="scale-125">{symbol}</span>
         )}
      </div>
    );
  };

  // 风险颜色计算
  const getRiskColor = (score: number) => {
      if (score >= 70) return 'bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.8)]'; // High risk
      if (score >= 35) return 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.8)]'; // Medium risk
      return 'bg-green-500/50'; // Low risk
  };

  const riskClass = riskScore !== undefined ? getRiskColor(riskScore) : null;

  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-[#FDF6E3] rounded shadow-md border border-gray-300
        flex items-center justify-center select-none transition-all duration-200
        ${sizeClasses[size]}
        ${selected ? '-translate-y-4 shadow-xl ring-2 ring-yellow-400 z-10' : ''}
        ${highlight ? 'ring-4 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] z-10' : ''}
        ${isHorizontal ? 'rotate-90 mx-1' : ''}
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${className}
      `}
      style={{
        boxShadow: selected ? undefined : '2px 4px 6px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,10,0.05)'
      }}
    >
      {/* 风险指示线 (仅在非隐藏且非横向展示时显示) */}
      {riskClass && !hidden && !isHorizontal && riskScore !== undefined && riskScore > 10 && (
          <div 
            className={`absolute -top-1.5 left-1 right-1 h-1 rounded-full ${riskClass} z-20`} 
            title={`危险度: ${riskScore}`} 
          />
      )}

      {/* 3D Depth Effect at bottom */}
      {!isHorizontal && <div className="absolute bottom-0 w-full h-[12%] bg-[#E6DCC3] rounded-b opacity-80 pointer-events-none" />}
      
      {getTileContent()}
      
      {highlight && (
        <div className="absolute -top-3 -right-3 bg-green-600 border border-white text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-lg z-30 uppercase tracking-tighter">
          BEST
        </div>
      )}
    </div>
  );
};

export default MahjongTile;
