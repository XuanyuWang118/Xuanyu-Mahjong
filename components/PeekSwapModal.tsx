
import React, { useState, useEffect } from 'react';
import { Tile, Player } from '../types';
import MahjongTile from './MahjongTile';
import { Eye, ArrowLeftRight, Clock } from 'lucide-react';
import { sortHand } from '../utils';

interface PeekSwapModalProps {
    type: 'check_hand' | 'exchange_tile';
    targetPlayer: Player;
    myHand: Tile[];
    onClose: () => void;
    onSwap: (myTileId: string, targetTileId: string) => void;
}

const PeekSwapModal: React.FC<PeekSwapModalProps> = ({ type, targetPlayer, myHand, onClose, onSwap }) => {
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedMyTile, setSelectedMyTile] = useState<string | null>(null);
    const [selectedTargetTile, setSelectedTargetTile] = useState<string | null>(null);

    // 倒计时逻辑
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onClose]);

    // 验牌逻辑：显示全部牌
    // 换牌逻辑：显示一半牌 (前半部分)
    const visibleTiles = type === 'check_hand' 
        ? targetPlayer.hand 
        : targetPlayer.hand.slice(0, Math.ceil(targetPlayer.hand.length / 2));

    const handleSwapConfirm = () => {
        if (selectedMyTile && selectedTargetTile) {
            onSwap(selectedMyTile, selectedTargetTile);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 max-w-4xl w-full flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(168,85,247,0.4)] relative">
                
                {/* Header */}
                <div className="absolute top-4 right-4 flex items-center gap-2 text-red-500 font-mono text-xl font-bold animate-pulse">
                    <Clock /> {timeLeft}s
                </div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
                    {type === 'check_hand' ? <Eye size={32} /> : <ArrowLeftRight size={32} />}
                    {type === 'check_hand' ? `洞悉 ${targetPlayer.name} 的手牌` : `与 ${targetPlayer.name} 交换`}
                </h2>

                {/* Target Player Hand Area */}
                <div className="w-full bg-black/40 p-6 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
                    <span className="text-gray-400 text-sm uppercase tracking-widest">{targetPlayer.name} 的手牌区域 {type === 'exchange_tile' && '(随机可见)'}</span>
                    <div className="flex flex-wrap justify-center gap-2">
                        {visibleTiles.map(tile => (
                            <div key={tile.id} className="relative">
                                <MahjongTile 
                                    tile={tile} 
                                    size="lg" 
                                    selected={selectedTargetTile === tile.id}
                                    onClick={() => type === 'exchange_tile' && setSelectedTargetTile(tile.id)}
                                    className={type === 'exchange_tile' ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
                                />
                                {type === 'exchange_tile' && selectedTargetTile === tile.id && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] px-2 rounded-full whitespace-nowrap">目标</div>
                                )}
                            </div>
                        ))}
                        {type === 'exchange_tile' && (
                             <div className="flex items-center justify-center px-4 text-gray-600 font-mono text-xs border-2 border-dashed border-gray-700 rounded-lg">
                                 ??? (隐藏)
                             </div>
                        )}
                    </div>
                </div>

                {/* My Hand Area (Only for Swap) */}
                {type === 'exchange_tile' && (
                    <>
                        <div className="text-purple-400 font-bold text-xl"><ArrowLeftRight className="rotate-90" /></div>
                        <div className="w-full bg-black/40 p-6 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
                            <span className="text-yellow-500 text-sm uppercase tracking-widest">选择你的一张牌</span>
                            <div className="flex flex-wrap justify-center gap-2">
                                {myHand.map(tile => (
                                    <div key={tile.id} className="relative">
                                        <MahjongTile 
                                            tile={tile} 
                                            size="md" 
                                            selected={selectedMyTile === tile.id}
                                            onClick={() => setSelectedMyTile(tile.id)}
                                            className="cursor-pointer hover:-translate-y-2 transition-transform"
                                        />
                                        {selectedMyTile === tile.id && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-600 text-black font-bold text-[10px] px-2 rounded-full whitespace-nowrap">交出</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSwapConfirm}
                            disabled={!selectedMyTile || !selectedTargetTile}
                            className={`
                                px-12 py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-xl transition-all
                                ${selectedMyTile && selectedTargetTile 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 active:scale-95' 
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                            `}
                        >
                            确认交换
                        </button>
                    </>
                )}

                {/* Actions */}
                {type === 'check_hand' && (
                    <button onClick={onClose} className="mt-4 px-8 py-2 border border-white/20 hover:bg-white/10 rounded-full text-gray-300">
                        关闭视界
                    </button>
                )}
            </div>
        </div>
    );
};

export default PeekSwapModal;
