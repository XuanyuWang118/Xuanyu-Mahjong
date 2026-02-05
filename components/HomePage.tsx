
import React, { useState, useEffect } from 'react';
import { PlayerHistory, UserProfile } from '../types';
import { Play, Settings, History, MessageSquare, Diamond, User, LogOut, KeyRound } from 'lucide-react';
import MahjongTile from './MahjongTile';

interface HomePageProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  playerHistory: PlayerHistory;
  playerGold: number;
  currentUser: UserProfile | null;
  onLogin: (u: string, p: string) => boolean;
  onRegister: (u: string, p: string) => boolean;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
    onStartGame, onOpenSettings, playerHistory, playerGold, 
    currentUser, onLogin, onRegister, onLogout 
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    if (playerHistory.suggestions && playerHistory.suggestions.length > 0) {
      setSuggestion(playerHistory.suggestions[playerHistory.suggestions.length - 1]);
    }
  }, [playerHistory.suggestions]);

  const handleSaveSuggestion = () => {
    if (suggestion.trim()) {
      alert('建议已保存！(仅本地演示)');
      setSuggestion('');
    }
  };

  const handleAuthSubmit = () => {
      if (!usernameInput || !passwordInput) return;
      if (authMode === 'login') {
          if (onLogin(usernameInput, passwordInput)) setAuthMode('none');
      } else {
          if (onRegister(usernameInput, passwordInput)) setAuthMode('none');
      }
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-[#1e3a1b] to-gray-900 flex flex-col items-center justify-center text-white font-serif overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url('https://haowallpaper.com/link/common/file/previewFileImg/15562159040205120')` }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-contrast-110 pointer-events-none"></div>
      </div>

      {/* Auth Modal */}
      {authMode !== 'none' && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
              <div className="bg-gray-900 border border-yellow-500/30 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
                  <button onClick={() => setAuthMode('none')} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                      <KeyRound /> {authMode === 'login' ? '账户登录' : '创建星界档案'}
                  </h2>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-400 uppercase font-bold">用户名</label>
                          <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 mt-1 focus:border-yellow-500 outline-none text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 uppercase font-bold">密码</label>
                          <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 mt-1 focus:border-yellow-500 outline-none text-white" />
                      </div>
                      <button onClick={handleAuthSubmit} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold text-black mt-2">
                          {authMode === 'login' ? '立即登录' : '注册并登录'}
                      </button>
                      <div className="text-center text-xs text-gray-400 mt-4 cursor-pointer hover:text-white" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                          {authMode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* User Status Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
          {currentUser ? (
              <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-full border border-yellow-500/30 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center font-bold text-black">{currentUser.nickname[0].toUpperCase()}</div>
                  <div className="flex flex-col">
                      <span className="text-xs text-gray-300">欢迎回来</span>
                      <span className="text-sm font-bold text-yellow-400">{currentUser.nickname}</span>
                  </div>
                  <button onClick={onLogout} className="ml-2 p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-colors" title="注销"><LogOut size={16} /></button>
              </div>
          ) : (
              <div className="flex gap-2">
                  <button onClick={() => setAuthMode('login')} className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-full border border-white/10 text-sm font-bold backdrop-blur-md">登录</button>
                  <button onClick={() => setAuthMode('register')} className="px-4 py-2 bg-yellow-600/80 hover:bg-yellow-500 rounded-full text-black text-sm font-bold backdrop-blur-md">注册</button>
              </div>
          )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 bg-black/40 rounded-3xl shadow-3xl border-4 border-yellow-200/30 max-w-4xl w-full backdrop-blur-md animate-fade-in-up">
        <h1 className="font-calligraphy text-9xl text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] text-center tracking-tighter" style={{ textShadow: '0 0 10px #fde047, 0 0 20px #eab308, 0 0 30px #ca8a04' }}>
          星星麻将
        </h1>
        <p className="text-xl text-yellow-100/90 mb-6 text-center italic tracking-widest font-light drop-shadow-md">
          “如果流星有署名，夜空里都是你的名字。”
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button 
            onClick={onStartGame} 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-yellow-600/80 hover:bg-yellow-500/80 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.4)] uppercase text-2xl font-black tracking-widest transition-all hover:scale-105 active:scale-95 border-2 border-yellow-300/50 text-white backdrop-blur-sm"
          >
            <Play size={32} fill="currentColor" />
            进入星空
          </button>
          <button 
            onClick={onOpenSettings} 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-800/60 hover:bg-gray-700/60 rounded-2xl shadow-lg uppercase text-2xl font-bold tracking-wider transition-all hover:scale-105 active:scale-95 border-2 border-gray-400/50 backdrop-blur-sm"
          >
            <Settings size={32} />
            调整星轨
          </button>
        </div>

        <div className="bg-gray-900/60 p-6 rounded-2xl w-full max-w-2xl shadow-inner border border-white/10 mt-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
            <History size={24} />
            星途战绩
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-gray-200">
            <div className="flex justify-between border-r border-white/10 pr-4"><span>名下星币:</span> <span className="text-yellow-400 font-mono flex items-center gap-1"><Diamond size={12}/>{playerGold}</span></div>
            <div className="flex justify-between pl-4"><span>摘星次数:</span> <span className="text-white font-bold">{playerHistory.totalWins} 局</span></div>
            <div className="flex justify-between border-r border-white/10 pr-4"><span>累计盈余:</span> <span className="text-green-400 font-mono">{playerHistory.totalGoldEarned}</span></div>
            <div className="flex justify-between pl-4"><span>最高星光:</span> <span className="text-red-400 font-black">{playerHistory.maxFanWin} 番</span></div>
            
            {playerHistory.maxFanHand && (
              <div className="col-span-2 pt-4 border-t border-white/5">
                <span className="text-xs text-gray-400 block mb-2 font-bold uppercase tracking-tighter">高光时刻:</span>
                <div className="flex flex-wrap gap-1 justify-center bg-black/40 p-3 rounded-xl">
                  {playerHistory.maxFanHand.map(tile => (
                    <MahjongTile key={tile.id} tile={tile} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900/60 p-6 rounded-2xl w-full max-w-2xl shadow-inner border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><MessageSquare size={24} />星语心愿</span>
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)} 
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showSuggestions ? '折叠星愿' : '许下心愿'}
            </button>
          </h3>
          {showSuggestions && (
            <div className="space-y-3">
              <textarea
                className="w-full p-3 bg-black/60 text-gray-100 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none placeholder-gray-500"
                rows={3}
                placeholder="向流星许愿..."
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
              ></textarea>
              <button 
                onClick={handleSaveSuggestion} 
                className="w-full py-3 bg-yellow-600/80 hover:bg-yellow-500/80 text-white font-black rounded-xl shadow-xl transition-all active:scale-95"
              >
                发送星愿
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-gray-400 text-xs font-bold tracking-widest uppercase">
           开发者：泓峥萧瑟
        </div>
      </div>
    </div>
  );
};

export default HomePage;
