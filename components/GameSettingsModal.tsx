
import React from 'react';
import { GameSettings, BotDifficulty, UserProfile } from '../types';
import { X, Save, Diamond, BrainCircuit, Settings, Zap, Image as ImageIcon, Users, UserCog, Volume2 } from 'lucide-react';

interface GameSettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onCancel: () => void;
  playerGold: number;
  setPlayerGold: (gold: number) => void;
  playerDiamonds: number;
  setPlayerDiamonds: (diamonds: number) => void;
  currentUser: UserProfile | null;
  onUpdateProfile: (nickname: string, password?: string) => void;
}

const GameSettingsModal: React.FC<GameSettingsModalProps> = ({ 
    settings, onSave, onCancel, 
    playerGold, setPlayerGold, playerDiamonds, setPlayerDiamonds,
    currentUser, onUpdateProfile
}) => {
  const [localSettings, setLocalSettings] = React.useState<GameSettings>(settings);
  const [customGold, setCustomGold] = React.useState<number>(playerGold);
  const [customDiamonds, setCustomDiamonds] = React.useState<number>(playerDiamonds);
  
  // Profile local state
  const [nickname, setNickname] = React.useState(currentUser?.nickname || '');
  const [newPassword, setNewPassword] = React.useState('');

  const handleSave = () => {
    setPlayerGold(customGold);
    setPlayerDiamonds(customDiamonds);
    if (currentUser) {
        onUpdateProfile(nickname, newPassword || undefined);
    }
    onSave(localSettings);
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in zoom-in-95">
      <div className="bg-gray-900 border-2 border-yellow-600/50 p-8 rounded-3xl w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-3xl font-black text-yellow-500 flex items-center gap-3">
            <Settings className="w-8 h-8 text-yellow-600" />
            星界法则设定
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 左列：游戏性设置 */}
            <div className="space-y-6">
                
                {/* 音量控制 */}
                <div>
                   <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <Volume2 className="w-4 h-4" /> 音效音量 ({localSettings.volume}%)
                   </label>
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={localSettings.volume} 
                      onChange={(e) => setLocalSettings({...localSettings, volume: parseInt(e.target.value)})}
                      className="w-full accent-yellow-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                   />
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">星光基础倍率 (底番)</label>
                    <input 
                    type="number" 
                    value={localSettings.baseFanValue}
                    onChange={(e) => setLocalSettings({ ...localSettings, baseFanValue: Math.max(1, parseInt(e.target.value) || 0) })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-lg font-mono focus:ring-2 focus:ring-yellow-600 outline-none text-yellow-400"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" /> 诸星智慧 (AI)
                    </label>
                    <div className="flex gap-2">
                        {(Object.values(BotDifficulty)).map(diff => (
                            <button
                                key={diff}
                                onClick={() => setLocalSettings({ ...localSettings, botDifficulty: diff })}
                                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${localSettings.botDifficulty === diff ? 'bg-yellow-600 border-yellow-400 text-black shadow-lg' : 'bg-gray-800 border-transparent text-gray-400 hover:border-white/20'}`}
                            >
                                {diff === 'easy' ? '流星' : diff === 'medium' ? '行星' : '恒星'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-cyan-900/10 p-4 rounded-2xl border border-cyan-500/20 shadow-inner space-y-3">
                    <label className="block text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap className="w-4 h-4" /> 初始资源设定
                    </label>
                    <div className="space-y-3">
                         <div>
                            <span className="text-[10px] text-gray-400 block mb-1 flex items-center gap-1"><Diamond size={10} /> 初始金币 (Star Dust)</span>
                            <input 
                                type="number"
                                value={customGold}
                                onChange={(e) => setCustomGold(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border border-yellow-500/30 rounded-lg p-2 font-mono text-yellow-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 block mb-1 flex items-center gap-1"><Zap size={10} /> 当前钻石 (Gems)</span>
                            <input 
                                type="number"
                                value={customDiamonds}
                                onChange={(e) => setCustomDiamonds(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border border-cyan-500/50 rounded-lg p-2 font-mono text-cyan-400 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 右列：个性化与账户 */}
            <div className="space-y-6">
                 {/* 个性化 */}
                 <div className="bg-purple-900/10 p-4 rounded-2xl border border-purple-500/20 shadow-inner space-y-3">
                    <label className="block text-xs font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> 视界定制 (背景图URL)
                    </label>
                    <input 
                        type="text" 
                        placeholder="https://..."
                        value={localSettings.backgroundImageUrl || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, backgroundImageUrl: e.target.value })}
                        className="w-full bg-black/50 border border-purple-500/30 rounded-lg p-2 text-xs text-purple-200 focus:outline-none placeholder-gray-600"
                    />
                    <div className="text-[10px] text-gray-500">支持输入图片链接，留空则使用默认星空。</div>
                </div>

                {/* 机器人名称 */}
                <div className="bg-gray-800/30 p-4 rounded-2xl border border-white/5 space-y-3">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users className="w-4 h-4" /> 对手重命名
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <input type="text" value={localSettings.botNames.left} onChange={e => setLocalSettings({...localSettings, botNames: {...localSettings.botNames, left: e.target.value}})} className="bg-black/50 border border-gray-600 rounded p-1 text-xs text-center text-gray-300" placeholder="左家" />
                        <input type="text" value={localSettings.botNames.top} onChange={e => setLocalSettings({...localSettings, botNames: {...localSettings.botNames, top: e.target.value}})} className="bg-black/50 border border-gray-600 rounded p-1 text-xs text-center text-gray-300" placeholder="对家" />
                        <input type="text" value={localSettings.botNames.right} onChange={e => setLocalSettings({...localSettings, botNames: {...localSettings.botNames, right: e.target.value}})} className="bg-black/50 border border-gray-600 rounded p-1 text-xs text-center text-gray-300" placeholder="右家" />
                    </div>
                </div>

                {/* 账户管理 (仅登录后可见) */}
                {currentUser ? (
                    <div className="bg-green-900/10 p-4 rounded-2xl border border-green-500/20 shadow-inner space-y-3">
                        <label className="block text-xs font-black text-green-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <UserCog className="w-4 h-4" /> 档案管理 ({currentUser.username})
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <span className="text-[10px] text-gray-400 block mb-1">修改昵称</span>
                                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-black/50 border border-green-500/30 rounded p-1.5 text-sm text-green-200" />
                             </div>
                             <div>
                                <span className="text-[10px] text-gray-400 block mb-1">修改密码</span>
                                <input type="password" placeholder="留空不修改" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black/50 border border-green-500/30 rounded p-1.5 text-sm text-green-200" />
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                        <p className="text-xs text-gray-400">当前为游客身份，登录后可自定义档案。</p>
                    </div>
                )}
            </div>
        </div>

        <button 
          onClick={handleSave}
          className="mt-4 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-xl rounded-2xl shadow-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <Save size={24} />
          保存并应用
        </button>
      </div>
    </div>
  );
};

export default GameSettingsModal;
