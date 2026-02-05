
import React, { useState } from 'react';
import { SKILLS } from '../constants';
import { Skill } from '../types';
import { Zap, HelpCircle, X } from 'lucide-react';

interface SkillMenuProps {
  diamonds: number;
  onSelectSkill: (skill: Skill) => void;
  disabled: boolean;
}

const SkillMenu: React.FC<SkillMenuProps> = ({ diamonds, onSelectSkill, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end gap-4" data-debug-id="skill-menu">
      
      {/* Skill List */}
      {isOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
          {SKILLS.map((skill) => {
            const canAfford = diamonds >= skill.cost;
            return (
              <div key={skill.id} className="relative group flex items-center justify-end gap-2">
                {/* Tooltip */}
                {activeTooltip === skill.id && (
                  <div className="absolute right-[110%] top-1/2 -translate-y-1/2 w-48 bg-black/90 text-white text-xs p-3 rounded-xl border border-yellow-500/30 shadow-xl z-[600]">
                    <h4 className="font-bold text-yellow-400 mb-1">{skill.name}</h4>
                    <p className="text-gray-300 leading-relaxed">{skill.description}</p>
                    <div className="mt-2 text-right text-gray-500 text-[10px]">(点击其他区域关闭)</div>
                  </div>
                )}

                {/* Info Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === skill.id ? null : skill.id); }}
                  className="bg-gray-800/80 text-gray-400 hover:text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                >
                   <HelpCircle size={14} />
                </button>

                {/* Skill Button */}
                <button
                  onClick={() => {
                    if (canAfford && !disabled) {
                        onSelectSkill(skill);
                        setIsOpen(false);
                    }
                  }}
                  disabled={!canAfford || disabled}
                  className={`
                    relative flex items-center justify-between w-40 px-4 py-3 rounded-xl border-2 shadow-lg backdrop-blur-md transition-all active:scale-95
                    ${canAfford && !disabled
                        ? 'bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border-purple-400/50 hover:border-yellow-400 hover:shadow-purple-500/50 text-white cursor-pointer' 
                        : 'bg-gray-900/80 border-gray-700 text-gray-500 cursor-not-allowed grayscale'}
                  `}
                >
                  <span className="font-bold tracking-wider text-sm">{skill.name}</span>
                  <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                    <Zap size={10} className={canAfford ? "text-cyan-400" : "text-gray-600"} fill="currentColor" />
                    <span className="font-mono text-xs">{skill.cost}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleMenu}
        disabled={disabled}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)] border-2 border-purple-400 transition-all duration-300
          ${isOpen ? 'bg-gray-900 rotate-45' : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:scale-110 rotate-0'}
          ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isOpen ? <X size={32} className="text-white" /> : <Zap size={32} className="text-white fill-white animate-pulse" />}
      </button>

      {/* Global Click Handler to close tooltips */}
      {activeTooltip && (
        <div className="fixed inset-0 z-[550] bg-transparent" onClick={() => setActiveTooltip(null)} />
      )}
    </div>
  );
};

export default SkillMenu;
