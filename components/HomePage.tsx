import React, { useState, useEffect } from 'react';
import { PlayerHistory } from '../types';
import { Play, Settings, History, MessageSquare, Diamond } from 'lucide-react';
import MahjongTile from './MahjongTile';

interface HomePageProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  playerHistory: PlayerHistory;
  playerGold: number;
}

const HomePage: React.FC<HomePageProps> = ({ onStartGame, onOpenSettings, playerHistory, playerGold }) => {
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (playerHistory.suggestions && playerHistory.suggestions.length > 0) {
      setSuggestion(playerHistory.suggestions[playerHistory.suggestions.length - 1]);
    }
  }, [playerHistory.suggestions]);

  const handleSaveSuggestion = () => {
    if (suggestion.trim()) {
      const newSuggestions = [...playerHistory.suggestions, suggestion.trim()];
      localStorage.setItem('mahjongPlayerHistory', JSON.stringify({ ...playerHistory, suggestions: newSuggestions }));
      alert('建议已保存！');
      setSuggestion('');
    }
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-[#1e3a1b] to-gray-900 flex flex-col items-center justify-center text-white font-serif overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] z-0"></div>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 bg-black/60 rounded-3xl shadow-3xl border-4 border-yellow-600/50 max-w-4xl w-full backdrop-blur-sm animate-fade-in-up">
        <h1 className="font-calligraphy text-9xl text-yellow-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] text-center tracking-tighter">
          無双麻将
        </h1>
        <p className="text-xl text-yellow-100/80 mb-6 text-center italic tracking-widest font-light">
          “在这个世界上，能赢的只有一种人，就是懂得审时度势的人。”
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button 
            onClick={onStartGame} 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-red-700 hover:bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.4)] uppercase text-2xl font-black tracking-widest transition-all hover:scale-105 active:scale-95 border-2 border-red-500"
          >
            <Play size={32} fill="currentColor" />
            进入局中
          </button>
          <button 
            onClick={onOpenSettings} 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl shadow-lg uppercase text-2xl font-bold tracking-wider transition-all hover:scale-105 active:scale-95 border-2 border-gray-600"
          >
            <Settings size={32} />
            调整策略
          </button>
        </div>

        <div className="bg-gray-900/80 p-6 rounded-2xl w-full max-w-2xl shadow-inner border border-white/5 mt-6">
          <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <History size={24} />
            江湖战绩
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-gray-300">
            <div className="flex justify-between border-r border-white/10 pr-4"><span>名下金币:</span> <span className="text-yellow-400 font-mono flex items-center gap-1"><Diamond size={12}/>{playerGold}</span></div>
            <div className="flex justify-between pl-4"><span>大获全胜:</span> <span className="text-white font-bold">{playerHistory.totalWins} 局</span></div>
            <div className="flex justify-between border-r border-white/10 pr-4"><span>累计盈余:</span> <span className="text-green-400 font-mono">{playerHistory.totalGoldEarned}</span></div>
            <div className="flex justify-between pl-4"><span>最高番数:</span> <span className="text-red-400 font-black">{playerHistory.maxFanWin} 番</span></div>
            
            {playerHistory.maxFanHand && (
              <div className="col-span-2 pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500 block mb-2 font-bold uppercase tracking-tighter">传世牌局快照:</span>
                <div className="flex flex-wrap gap-1 justify-center bg-black/40 p-3 rounded-xl">
                  {playerHistory.maxFanHand.map(tile => (
                    <MahjongTile key={tile.id} tile={tile} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900/80 p-6 rounded-2xl w-full max-w-2xl shadow-inner border border-white/5">
          <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><MessageSquare size={24} />雀友留言</span>
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)} 
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {showSuggestions ? '合上卷轴' : '挥毫致意'}
            </button>
          </h3>
          {showSuggestions && (
            <div className="space-y-3">
              <textarea
                className="w-full p-3 bg-black/60 text-gray-100 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-600 outline-none"
                rows={3}
                placeholder="留下您的改进良策..."
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
              ></textarea>
              <button 
                onClick={handleSaveSuggestion} 
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-black rounded-xl shadow-xl transition-all active:scale-95"
              >
                保存建议
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-gray-600 text-xs font-bold tracking-widest uppercase">
           开发者：泓峥萧瑟
        </div>
      </div>
    </div>
  );
};

export default HomePage;