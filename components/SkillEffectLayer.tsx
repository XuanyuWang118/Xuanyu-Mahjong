
import React, { useEffect, useState } from 'react';
import { SkillVisualEffect } from '../types';
import { Bomb, MoveDown } from 'lucide-react';

interface SkillEffectLayerProps {
  effects: SkillVisualEffect[];
  onEffectComplete: (id: string) => void;
}

const SkillEffectLayer: React.FC<SkillEffectLayerProps> = ({ effects, onEffectComplete }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[2500] overflow-hidden">
      {effects.map(effect => (
        <SingleEffect key={effect.id} effect={effect} onComplete={() => onEffectComplete(effect.id)} />
      ))}
    </div>
  );
};

const SingleEffect: React.FC<{ effect: SkillVisualEffect; onComplete: () => void }> = ({ effect, onComplete }) => {
  const [step, setStep] = useState<'intro' | 'action' | 'impact'>('intro');

  useEffect(() => {
    // 技能文字展示时间
    const t1 = setTimeout(() => setStep('action'), 1200); 
    // 动作持续时间 (火球飞行等)
    const t2 = setTimeout(() => setStep('impact'), 2000);
    // 整体结束时间
    const t3 = setTimeout(onComplete, 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  // 根据 player ID 获取位置 CSS
  const getPositionStyle = (pid: number | undefined) => {
    if (pid === undefined) return {}; 
    // 简化的位置映射: 0=bottom, 1=right, 2=top, 3=left
    // 对应 App.tsx 中的布局逻辑
    switch (pid) {
      case 0: return { bottom: '10%', left: '50%', transform: 'translate(-50%, 0)' };
      case 1: return { top: '50%', right: '10%', transform: 'translate(0, -50%)' };
      case 2: return { top: '10%', left: '50%', transform: 'translate(-50%, 0)' };
      case 3: return { top: '50%', left: '10%', transform: 'translate(0, -50%)' };
      default: return {};
    }
  };

  const getSkillName = (type: string) => {
    switch(type) {
      case 'check_hand': return '我要验牌';
      case 'exchange_tile': return '偷梁换柱';
      case 'fireball': return '吃我一炮';
      case 'arrow_volley': return '万箭齐发';
      default: return '';
    }
  };

  return (
    <div className="absolute inset-0">
      
      {/* Stage 1: 文字霸屏特效 */}
      {step === 'intro' && (
        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-500">
           <div className="relative">
              <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-t from-yellow-500 via-red-500 to-yellow-300 font-calligraphy drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] scale-150 animate-pulse">
                {getSkillName(effect.type)}
              </h1>
              <div className="absolute -inset-10 bg-black/50 blur-3xl -z-10 rounded-full"></div>
           </div>
        </div>
      )}

      {/* Stage 2 & 3: 技能具体特效 */}
      {(step === 'action' || step === 'impact') && (
        <>
            {/* --- 火球术 --- */}
            {effect.type === 'fireball' && effect.targetId !== undefined && (
                <>
                    {/* 飞行过程 */}
                    {step === 'action' && (
                        <div 
                            className="absolute w-20 h-20 bg-orange-500 rounded-full blur-md animate-ping"
                            style={{ 
                                left: '50%', bottom: '20%', // Start from player
                                animation: 'none',
                                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                ...getPositionStyle(effect.targetId) // Move to target
                            }}
                        >
                            <div className="absolute inset-0 bg-red-600 rounded-full blur-sm"></div>
                        </div>
                    )}
                    {/* 命中爆炸 */}
                    {step === 'impact' && (
                        <div 
                            className="absolute w-64 h-64 pointer-events-none"
                            style={getPositionStyle(effect.targetId)}
                        >
                            <div className="absolute inset-0 bg-orange-600 rounded-full blur-xl animate-ping opacity-0" style={{ animationDuration: '0.5s' }}></div>
                            <Bomb size={120} className="text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl font-black text-red-600 font-calligraphy rotate-12 drop-shadow-lg">BOOM!</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* --- 万箭齐发 --- */}
            {effect.type === 'arrow_volley' && (
                <>
                    {/* 漫天箭雨 */}
                    {[0, 1, 2, 3].filter(id => id !== effect.sourceId).map(targetId => (
                        <div key={targetId} className="absolute w-32 h-32" style={getPositionStyle(targetId)}>
                            {[...Array(20)].map((_, i) => (
                                <MoveDown 
                                    key={i}
                                    size={48} 
                                    className="text-black absolute drop-shadow-md"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: step === 'action' ? '-500px' : '20px',
                                        opacity: step === 'action' ? 0.8 : 0,
                                        transition: `top 0.5s ease-in ${i * 0.05}s, opacity 0.3s ease-in ${0.4 + i*0.05}s`,
                                        transform: `rotate(${Math.random() * 30 - 15}deg) scaleY(2)`
                                    }}
                                />
                            ))}
                            {step === 'impact' && (
                                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                                    <div className="bg-red-900/40 w-full h-full rounded-full blur-xl"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}
        </>
      )}
    </div>
  );
};

export default SkillEffectLayer;
