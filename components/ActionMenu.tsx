import React from 'react';
import { Tile, ActionOptions } from '../types';
import MahjongTile from './MahjongTile';

interface ActionMenuProps {
  discard: Tile | null;
  options: ActionOptions;
  onPong: () => void;
  onKong: () => void;
  onChow: (tiles: Tile[]) => void;
  onHu: () => void;
  onSkip: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ discard, options, onPong, onKong, onChow, onHu, onSkip }) => {
  if (!discard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 p-8 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 animate-in zoom-in-90 duration-300">
        
        <div className="text-center">
            <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase mb-2">
            Interaction
            </h3>
            <div className="h-1 w-20 bg-yellow-500 mx-auto rounded-full"></div>
        </div>

        <div className="flex flex-col items-center gap-3 p-4 bg-black/30 rounded-xl border border-white/5">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Target Tile</span>
          <MahjongTile tile={discard} size="lg" className="shadow-2xl scale-125" />
        </div>

        <div className="flex gap-4 flex-wrap justify-center min-w-[300px]">
          
          {options.canHu && (
             <button onClick={onHu} className="bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black text-2xl px-8 py-5 rounded-xl shadow-red-900/50 shadow-lg uppercase tracking-widest transition-transform hover:scale-110 active:scale-95 border-2 border-red-400 animate-pulse">
              胡 (RON)
            </button>
          )}

          {options.canPong && (
            <button onClick={onPong} className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 border border-blue-500">
              碰 (Pong)
            </button>
          )}

          {options.canKong && (
            <button onClick={onKong} className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 border border-purple-500">
              杠 (Kong)
            </button>
          )}

          {options.canChow && (
            <div className="flex flex-col gap-2">
              {options.chowOptions.map((combo, idx) => (
                <button 
                  key={idx}
                  onClick={() => onChow(combo)} 
                  className="bg-green-700 hover:bg-green-600 text-white p-2 px-4 rounded-xl shadow-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 border border-green-500"
                >
                  <span className="font-bold text-xl uppercase">吃</span>
                  <div className="flex gap-1 bg-black/20 p-1 rounded">
                    {combo.map(t => <MahjongTile key={t.id} tile={t} size="sm" />)}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button onClick={onSkip} className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold px-6 py-4 rounded-xl shadow-lg uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 border border-gray-600">
            过 (Skip)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionMenu;