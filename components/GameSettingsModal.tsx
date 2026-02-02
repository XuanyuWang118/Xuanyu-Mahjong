import React from 'react';
import { GameSettings, BotDifficulty } from '../types';
import { X, Save, Diamond, BrainCircuit, Settings } from 'lucide-react';

interface GameSettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onCancel: () => void;
  playerGold: number;
  setPlayerGold: (gold: number) => void;
}

const GameSettingsModal: React.FC<GameSettingsModalProps> = ({ settings, onSave, onCancel, playerGold, setPlayerGold }) => {
  const [localSettings, setLocalSettings] = React.useState<GameSettings>(settings);
  const [customGold, setCustomGold] = React.useState<number>(playerGold);

  const handleSave = () => {
    setPlayerGold(customGold);
    onSave(localSettings);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-gray-900 border-2 border-yellow-600/50 p-8 rounded-3xl w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col gap-6 text-white animate-fade-in-up">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-3xl font-black text-yellow-500 flex items-center gap-3">
            <Settings className="w-8 h-8 text-yellow-600" />
            雀坛博弈配置
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">底番金币倍率</label>
            <input 
              type="number" 
              value={localSettings.baseFanValue}
              onChange={(e) => setLocalSettings({ ...localSettings, baseFanValue: Math.max(1, parseInt(e.target.value) || 0) })}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-2xl font-mono focus:ring-2 focus:ring-yellow-600 outline-none text-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> 对手造诣 (AI 难度)
            </label>
            <div className="grid grid-cols-3 gap-3">
                {(Object.values(BotDifficulty)).map(diff => (
                    <button
                        key={diff}
                        onClick={() => setLocalSettings({ ...localSettings, botDifficulty: diff })}
                        className={`py-3 rounded-xl font-black transition-all border-2 ${localSettings.botDifficulty === diff ? 'bg-yellow-600 border-yellow-400 text-black scale-105 shadow-xl' : 'bg-gray-800 border-transparent text-gray-400 hover:border-white/20'}`}
                    >
                        {diff === 'easy' ? '初学' : diff === 'medium' ? '老练' : '宗师'}
                    </button>
                ))}
            </div>
          </div>

          <div className="bg-yellow-600/5 p-6 rounded-2xl border border-yellow-600/20 shadow-inner">
            <label className="block text-xs font-black text-yellow-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Diamond className="w-4 h-4" /> 手中筹码 (金币总额)
            </label>
            <div className="flex flex-col gap-3">
                <input 
                  type="number" 
                  value={customGold}
                  onChange={(e) => setCustomGold(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-yellow-900/50 rounded-xl p-3 text-2xl font-mono text-center text-yellow-500 focus:ring-2 focus:ring-yellow-600 outline-none"
                />
                <p className="text-[10px] text-gray-500 text-center font-bold">修改此值将直接影响您的全局继承金币</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="mt-4 py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-xl rounded-2xl shadow-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <Save size={24} />
          封印配置
        </button>
      </div>
    </div>
  );
};

export default GameSettingsModal;