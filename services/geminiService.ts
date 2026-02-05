
import { AIAnalysisResult, Tile } from "../types";

// 阿里云百炼 DeepSeek API 配置
const API_KEY = "sk-6fd662a93f394d54bf808c1284f124b2";
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// 辅助函数：获取花色后缀
const getSuitSymbolSuffix = (suit: string): string => {
  if (suit === 'man') return '萬';
  if (suit === 'pin') return '筒';
  if (suit === 'sou') return '条';
  return ''; 
};

export const getMahjongStrategy = async (
  playerHand: Tile[],
  allDiscards: Tile[],
  allMelds: Tile[], 
  roundWind: string,
  seatWind: string
): Promise<AIAnalysisResult> => {
  
  // 1. 准备 Prompt 数据
  const handStr = playerHand.map(t => `${t.value}${getSuitSymbolSuffix(t.suit)}`).join(', ');
  const discardStr = allDiscards.slice(-20).map(t => t.symbol).join(', '); // 仅取最近20张，节省token
  const meldStr = allMelds.map(t => t.symbol).join(', ');

  const systemPrompt = `
    你是一个中国麻将（136张国标/日本麻将通用规则）的高级AI助手。
    你的目标是分析玩家手牌，给出最佳出牌建议。
    
    请严格按照以下 JSON 格式返回结果，不要包含 markdown 格式标记：
    {
      "recommendedDiscard": "牌的名称，如 '1萬', '東'",
      "shanten": 数字 (向听数, 0表示听牌),
      "winningProbability": 数字 (0-100),
      "potentialFan": 数字 (预估番数),
      "reasoning": "简短的策略分析 (30字以内)",
      "strategyType": "offensive" 或 "defensive" 或 "balanced",
      "effectiveTiles": ["进张牌1", "进张牌2"],
      "dangerAssessment": [{"tile": "牌名", "score": 危险度0-100}]
    }
  `;

  const userPrompt = `
    当前局况：
    - 场风：${roundWind}
    - 自风：${seatWind}
    - 我的手牌：[${handStr}]
    - 场上最近弃牌：[${discardStr}]
    - 场上副露：[${meldStr}]

    请分析并给出 JSON 结果。
  `;

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-v3.2", // 使用 DeepSeek V3 模型
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // 降低随机性，提高策略稳定性
        response_format: { type: "json_object" } // 强制 JSON 模式
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error("Empty response from AI");

    // 修复：清理可能存在的 Markdown 代码块标记 (```json ... ```)
    let cleanContent = content.trim();
    // 移除开头的 ```json 或 ```
    if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\s*/, '');
    }
    // 移除结尾的 ```
    if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.replace(/\s*```$/, '');
    }

    // 解析 JSON
    const result = JSON.parse(cleanContent);

    // 数据清洗与容错
    return {
      recommendedDiscard: result.recommendedDiscard || playerHand[0].symbol,
      shanten: typeof result.shanten === 'number' ? result.shanten : 3,
      winningProbability: result.winningProbability || 20,
      potentialFan: result.potentialFan || 1,
      reasoning: result.reasoning || "AI 正在深度思考...",
      strategyType: result.strategyType || "balanced",
      effectiveTiles: Array.isArray(result.effectiveTiles) ? result.effectiveTiles : [],
      dangerAssessment: Array.isArray(result.dangerAssessment) ? result.dangerAssessment : []
    } as AIAnalysisResult;

  } catch (error) {
    console.error("DeepSeek Strategy Error:", error);
    // 降级策略：如果 API 失败，返回一个基础的本地兜底数据
    return {
      recommendedDiscard: playerHand[playerHand.length - 1]?.symbol || "N/A",
      shanten: -1,
      winningProbability: 0,
      potentialFan: 0,
      reasoning: `AI思考受阻 (${error instanceof Error ? error.message : 'Unknown'})`,
      strategyType: "balanced",
      effectiveTiles: [],
      dangerAssessment: []
    };
  }
};
