import React from 'react';
import { Player, Tile } from '../types';
import MahjongTile from './MahjongTile';
import { Diamond } from 'lucide-react';

interface PlayerAreaProps {
  player: Player;
  isActive: boolean;
  revealHand?: boolean;
  isWinner?: boolean;
  winningTile?: Tile | null;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({ player, isActive, revealHand = false, isWinner = false, winningTile = null }) => {
  const isHorizontal = player.position === 'left' || player.position === 'right';
  const isTop = player.position === 'top';

  const containerClass = {
    top: 'flex-col-reverse items-center w-full',
    left: 'flex-row-reverse items-center h-full',
    right: 'flex-row items-center h-full',
    bottom: '' 
  }[player.position];

  const handClass = {
    top: 'flex flex-row gap-0.5 rotate-180 mb-4',
    left: 'flex flex-col gap-0.5 -mr-12 z-10',
    right: 'flex flex-col gap-0.5 -ml-12 z-10',
    bottom: ''
  }[player.position];

  const meldContainerClass = {
    top: 'flex gap-2 mr-8 mb-2 rotate-180',
    left: 'flex gap-2 mt-[82px] -mr-6 rotate-90',
    right: 'flex gap-2 mt-[132px] -ml-6 -rotate-90',
    bottom: ''
  }[player.position];

  return (
    <div className={`flex ${containerClass} relative p-4 transition-all duration-300 ${isActive && !revealHand ? 'opacity-100 scale-105' : 'opacity-80'} ${isWinner ? 'ring-4 ring-yellow-400 rounded-xl shadow-lg' : ''}`}>
      
      <div 
        data-debug-id={`player-info-${player.position}`}
        className={`absolute 
                   ${player.position === 'top' ? 'top-[10px] left-[200px]' : (player.position === 'left' || player.position === 'right' ? 'top-[350px]' : 'top-1/2 -translate-y-1/2')} 
                   ${player.position === 'left' ? '-left-2' : player.position === 'right' ? '-right-2' : player.position === 'top' ? '' : 'left-1/2 -translate-x-1/2'} 
                   bg-black/80 text-white text-xs px-3 py-2 rounded-xl backdrop-blur-md z-20 border border-white/20 shadow-2xl flex flex-col items-center gap-1 min-w-[80px]`}
      >
        <span className="font-bold tracking-wider">{player.name}</span>
        <div className="flex items-center gap-1 text-yellow-400 font-mono">
           <Diamond size={10} fill="currentColor" />
           <span>{player.gold}</span>
        </div>
        {isActive && !revealHand && <div className="mt-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>}
        {isWinner && <span className="text-[10px] text-yellow-400 font-black border border-yellow-400 px-1 rounded">WIN</span>}
      </div>

      <div className="flex gap-4 items-center">
        <div data-debug-id={`player-hand-${player.position}`} className={handClass}>
          {player.hand.map((tile) => (
            <MahjongTile 
              key={`hand-${tile.id}`} 
              tile={tile} 
              hidden={!revealHand} 
              size="sm"
              className={isHorizontal ? (player.position === 'left' ? 'rotate-90' : '-rotate-90') : ''}
              highlight={isWinner && winningTile?.id === tile.id}
            />
          ))}
        </div>

        {player.melds.length > 0 && (
          <div data-debug-id={`meld-area-${player.position}`} className={meldContainerClass}>
            {player.melds.map((meld, i) => (
              <div key={i} className="flex gap-0.5 bg-black/30 p-1 rounded-md border border-white/5">
                {meld.tiles.map((tile, j) => (
                   <MahjongTile 
                      key={`meld-${tile.id}`} 
                      tile={tile} 
                      size="sm"
                      hidden={meld.type === 'angang' && (j === 0 || j === 3) && !revealHand}
                   />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerArea;