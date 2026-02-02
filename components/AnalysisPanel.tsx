import React from 'react';
import { AIAnalysisResult } from '../types';
import { Sparkles, Brain, Move, Target } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, loading, onAnalyze, onDragStart }) => {
  return (
    <div 
        className="bg-gray-900/90 text-white p-4 rounded-xl backdrop-blur-md border border-gray-700 w-full md:w-80 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
    >
      <div 
        className="flex items-center justify-between border-b border-gray-700 pb-2 cursor-move"
        onMouseDown={onDragStart}
      >
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
          <Brain className="w-6 h-6" />
          AI 智能助手 {/* Original: AI Advisor */}
        </h2>
        <div className="flex items-center gap-2">
            {analysis?.strategyType && (
            <span className={`px-2 py-0.5 text-xs rounded-full uppercase font-bold tracking-wider
                ${analysis.strategyType === 'offensive' ? 'bg-red-900 text-red-200' : 
                analysis.strategyType === 'defensive' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                {analysis.strategyType === 'offensive' ? '进攻型' : analysis.strategyType === 'defensive' ? '防守型' : '平衡型'} {/* Original: offensive, defensive, balanced */}
            </span>
            )}
            <Move className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {!analysis && !loading && (
        <div className="text-center py-8 text-gray-400">
          <p>等待玩家操作...</p> {/* Original: Waiting for turn... */}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8 space-y-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
          <span className="text-sm font-medium text-yellow-200">正在分析牌局...</span> {/* Original: Simulating 10,000 Hands... */}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          
          {/* Top Recommendations */}
          <div className="bg-indigo-900/40 p-3 rounded-lg border border-indigo-500/30 flex justify-between items-center">
            <div>
                <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">推荐弃牌</div> {/* Original: Best Discard */}
                <div className="text-2xl font-bold text-yellow-400">{analysis.recommendedDiscard}</div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">向听数</div> {/* Original: Shanten */}
                <div className="text-xl font-bold text-white">
                    {analysis.shanten <= 0 ? <span className="text-red-500 animate-pulse">听牌</span> : `${analysis.shanten}向听`} {/* Original: TENPAI / X-Shanten */}
                </div>
            </div>
          </div>

          {/* Uke-ire (Effective Tiles) */}
          <div className="bg-gray-800/50 p-3 rounded-lg">
             <div className="flex items-center gap-2 mb-2 text-green-400">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">有效牌 (进张列表)</span> {/* Original: Effective Tiles (Wait List), adjusted to 进张列表 for clarity */}
             </div>
             <div className="flex flex-wrap gap-1">
                {analysis.effectiveTiles && analysis.effectiveTiles.length > 0 ? (
                    analysis.effectiveTiles.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-green-900/50 border border-green-500/30 rounded text-xs font-mono">
                            {t}
                        </span>
                    ))
                ) : <span className="text-xs text-gray-500">无</span>} {/* Original: None */}
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <div className="flex justify-between items-end mb-1">
                 <span className="text-[10px] text-gray-400 uppercase">胡牌率</span> {/* Original: Win Prob */}
                 <span className="font-bold text-yellow-500">{analysis.winningProbability}%</span>
              </div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-yellow-500 h-full" style={{width: `${analysis.winningProbability}%`}}></div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded-lg">
               <div className="flex justify-between items-end mb-1">
                 <span className="text-[10px] text-gray-400 uppercase">预估番数</span> {/* Original: Est. Fan */}
                 <span className="font-bold text-green-500">{analysis.potentialFan}</span>
              </div>
              <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < analysis.potentialFan ? 'bg-green-500' : 'bg-gray-700'}`} />
                  ))}
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-gray-800/30 p-3 rounded-lg border-l-2 border-yellow-500">
            <h3 className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-2">
              策略分析 {/* Original: Strategy */}
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              {analysis.reasoning}
            </p>
          </div>
        </div>
      )}

      <button 
        onClick={onAnalyze}
        disabled={loading}
        className="mt-auto w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
      >
        刷新 AI 建议 {/* Original: Refresh AI Analysis */}
      </button>
    </div>
  );
};

export default AnalysisPanel;