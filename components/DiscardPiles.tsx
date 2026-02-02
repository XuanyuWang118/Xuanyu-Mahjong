import React from 'react';
import { Player, Tile } from '../types';
import MahjongTile from './MahjongTile';

interface DiscardPilesProps {
  players: Player[];
}

const DiscardPiles: React.FC<DiscardPilesProps> = ({ players }) => {
  const renderPile = (position: 'bottom' | 'right' | 'top' | 'left') => {
    const player = players.find(p => p.position === position);
    if (!player || player.discards.length === 0) return null;

    const discards = player.discards;
    
    // Grid settings
    let containerStyle: React.CSSProperties = { 
      position: 'absolute',
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 24px)', // 6 tiles per row
      gap: '2px',
      padding: '4px',
      backgroundColor: 'rgba(0,0,0,0.15)',
      borderRadius: '4px',
      zIndex: 10
    };

    // Re-aligned coordinates relative to center wind at 250px
    switch (position) {
      case 'bottom':
        // Below center (250 + 100)
        containerStyle = { ...containerStyle, top: '350px', left: '50%', transform: 'translateX(-50%)' };
        break;
      case 'top':
        // Above center (250 - 150) -> top 100
        containerStyle = { ...containerStyle, top: '100px', left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
        break;
      case 'left':
        // Left of center (at 250px height)
        containerStyle = { ...containerStyle, left: '320px', top: '250px', transform: 'translateY(-50%) rotate(90deg)' };
        break;
      case 'right':
        // Right of center (at 250px height)
        containerStyle = { ...containerStyle, right: '320px', top: '250px', transform: 'translateY(-50%) rotate(-90deg)' };
        break;
    }

    return (
      <div data-debug-id={`discard-pile-${position}`} style={containerStyle} className="shadow-inner border border-white/5">
        {discards.map((tile, idx) => (
          <div key={`discard-${tile.id}-${idx}`} className="w-6 h-8 flex items-center justify-center">
             <MahjongTile 
               tile={tile} 
               size="sm" 
               className="shadow-sm" 
             />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {renderPile('bottom')}
      {renderPile('right')}
      {renderPile('top')}
      {renderPile('left')}
    </div>
  );
};

export default DiscardPiles;