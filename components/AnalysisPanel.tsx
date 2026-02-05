
import React from 'react';
import { AIAnalysisResult, WinningTileHint } from '../types';
import { Sparkles, Brain, Move, Target, AlertCircle } from 'lucide-react';
import MahjongTile from './MahjongTile';

interface AnalysisPanelProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  className?: string;
  winningHints?: WinningTileHint[]; // 新增：听牌提示数据
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, loading, onAnalyze, onDragStart, className = '', winningHints = [] }) => {
  const isTenpai = winningHints && winningHints.length > 0;

  return (
    <div 
        className={`text-white p-4 rounded-xl backdrop-blur-md border shadow-2xl flex flex-col gap-4 transition-all ${className || 'bg-gray-900/90 border-gray-700'}`}
    >
      <div 
        className={`flex items-center justify-between border-b border-white/10 pb-2 ${onDragStart ? 'cursor-move' : ''}`}
        onMouseDown={onDragStart}
      >
        <h2 className="text-sm font-bold flex items-center gap-2 text-yellow-400 uppercase tracking-widest">
          <Brain className="w-5 h-5" />
          星星人麻将大师
        </h2>
        <div className="flex items-center gap-2">
            {analysis?.strategyType && (
            <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold tracking-wider
                ${analysis.strategyType === 'offensive' ? 'bg-red-900 text-red-200' : 
                analysis.strategyType === 'defensive' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                {analysis.strategyType === 'offensive' ? '进攻' : analysis.strategyType === 'defensive' ? '防守' : '平衡'}
            </span>
            )}
            {onDragStart && <Move className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {/* 听牌提示区域 (整合在最上方) */}
      {isTenpai && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 animate-in slide-in-from-left-2 fade-in">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/20">
                 <AlertCircle className="text-red-500 animate-pulse" size={16} />
                 <span className="text-red-200 font-bold text-xs tracking-wider">已听牌 (Waiting)</span>
             </div>
             <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                 {winningHints.map((hint, index) => (
                     <div key={index} className="flex items-center justify-between bg-black/20 p-2 rounded border border-white/5">
                         <div className="flex items-center gap-2">
                            <MahjongTile tile={hint.tile} size="sm" className="w-8 h-10 text-xs" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400">剩余</span>
                                <span className={`font-mono text-xs font-bold ${hint.countLeft === 0 ? 'text-red-500' : 'text-green-400'}`}>
                                     {hint.countLeft}张
                                </span>
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-[10px] text-gray-400">预估</span>
                             <span className="text-yellow-400 font-bold text-xs">{hint.fan}番</span>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
      )}

      {/* 普通 AI 分析内容 */}
      {!analysis && !loading && !isTenpai && (
        <div className="text-center py-4 text-gray-400 text-xs">
          <p>等待操作...</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-4 space-y-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
          <span className="text-xs font-medium text-yellow-200">正在思考最佳策略...</span>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
          
          {/* Top Recommendations */}
          <div className="bg-black/20 p-3 rounded-lg border border-white/10 flex justify-between items-center">
            <div>
                <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">推荐弃牌</div>
                <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                    {analysis.recommendedDiscard}
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">向听数</div>
                <div className="text-lg font-bold text-white">
                    {analysis.shanten <= 0 ? <span className="text-red-400 animate-pulse">听牌</span> : `${analysis.shanten}向听`}
                </div>
            </div>
          </div>

          {/* Uke-ire (Effective Tiles) */}
          <div className="bg-black/20 p-2 rounded-lg border border-white/5">
             <div className="flex items-center gap-2 mb-1 text-green-400">
                <Target className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase">进张 (Effective)</span>
             </div>
             <div className="flex flex-wrap gap-1">
                {analysis.effectiveTiles && analysis.effectiveTiles.length > 0 ? (
                    analysis.effectiveTiles.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-green-900/30 border border-green-500/30 rounded text-[10px] font-mono text-green-100">
                            {t}
                        </span>
                    ))
                ) : <span className="text-[10px] text-gray-500">无</span>}
             </div>
          </div>

          {/* Reasoning */}
          <div className="bg-black/20 p-2 rounded-lg border-l-2 border-yellow-500">
            <h3 className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-2">
              策略大师
            </h3>
            <p className="text-[10px] text-gray-300 leading-relaxed">
              {analysis.reasoning}
            </p>
          </div>
        </div>
      )}

      <button 
        onClick={onAnalyze}
        disabled={loading}
        className="mt-auto w-full py-2 bg-yellow-600/80 hover:bg-yellow-500/80 rounded-lg font-bold text-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg"
      >
        {loading ? '分析中...' : '大师指点'}
      </button>
    </div>
  );
};

export default AnalysisPanel;
