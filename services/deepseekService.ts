
import { AIAnalysisResult, Tile } from "../types";
import { calculateTileCounts } from "../utils";

// 阿里云百炼 DeepSeek API 配置
const API_KEY = "sk-6fd662a93f394d54bf808c1284f124b2";
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// 强健的符号标准化函数：将 AI 的各种输出格式统一为游戏内部符号
const normalizeToInternalSymbol = (aiOutput: string): string => {
  if (!aiOutput) return "";
  let s = aiOutput.trim();

  // 1. 处理风牌 (Winds)
  // 匹配: E, East, Dong, 东, 東, 东风, etc.
  if (/^e(ast)?$/i.test(s) || s.includes('东') || s.includes('東')) return '東';
  if (/^s(outh)?$/i.test(s) || s.includes('南')) return '南';
  if (/^w(est)?$/i.test(s) || s.includes('西')) return '西';
  if (/^n(orth)?$/i.test(s) || s.includes('北')) return '北';

  // 2. 处理箭牌 (Dragons)
  // 匹配: Red, Zhong, 中, 红中
  if (/^red$/i.test(s) || s.includes('红中') || s === '中') return '中';
  // 匹配: Green, Fa, 发, 發, 发财
  if (/^green$/i.test(s) || s.includes('发') || s.includes('發') || s.includes('fa')) return '发';
  // 匹配: White, Bai, 白, 白板
  if (/^white$/i.test(s) || s.includes('白') || s.includes('bai')) return '白';

  // 3. 处理数牌 (Suits)
  // 预处理中文数字: 一万 -> 1万
  const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = 0; i < 9; i++) {
    // 替换开头的中文数字，或者紧跟花色的中文数字
    if (s.startsWith(cnNums[i])) {
         s = s.replace(cnNums[i], digits[i]);
    }
  }

  // 提取数字部分
  const numMatch = s.match(/\d/);
  const num = numMatch ? numMatch[0] : '';

  if (num) {
    // 匹配万子 (Man)
    if (s.includes('万') || s.includes('萬') || /m$/i.test(s)) return `${num}萬`;
    // 匹配筒子 (Pin)
    if (s.includes('筒') || s.includes('饼') || /p$/i.test(s)) return `${num}筒`;
    // 匹配条子 (Sou)
    if (s.includes('条') || s.includes('索') || /s$/i.test(s)) return `${num}条`;
  }

  // 如果无法识别，返回原始值尝试直接匹配
  return s;
};

// 在手牌中查找匹配的牌
const findMatchingTileInHand = (aiOutput: string, hand: Tile[]): string | null => {
  const normalizedTarget = normalizeToInternalSymbol(aiOutput);
  
  // 尝试在手牌中找到 symbol 完全匹配的牌
  const match = hand.find(t => t.symbol === normalizedTarget);
  
  return match ? match.symbol : null;
};

export const getMahjongStrategy = async (
  playerHand: Tile[],
  allDiscards: Tile[],
  allMelds: Tile[], 
  roundWind: string,
  seatWind: string,
  signal?: AbortSignal // 新增：支持取消请求
): Promise<AIAnalysisResult> => {
  
  // 1. 准备统计数据
  const tileCounts = calculateTileCounts(allDiscards, allMelds, playerHand);
  
  const depletedInfo = Object.entries(tileCounts)
    .filter(([_, count]) => count === 0)
    .map(([symbol]) => symbol)
    .join('、') || "无";
    
  const scarceInfo = Object.entries(tileCounts)
    .filter(([_, count]) => count === 1)
    .map(([symbol]) => symbol)
    .join('、') || "无";

  // 2. 准备 Prompt 数据
  // 关键修复：直接使用 t.symbol (如 '1萬', '東') 而不是重新拼接，确保 Prompt 中的牌名与游戏内部一致
  const handStr = playerHand.map(t => t.symbol).join(', ');
  const discardStr = allDiscards.slice(-20).map(t => t.symbol).join(', '); 
  const meldStr = allMelds.map(t => t.symbol).join(', ');

  const systemPrompt = `
    你是一位世界级的中国麻将战术大师。请根据当前手牌和场况进行深度分析，并给出最优弃牌建议。

    【重要：牌名标准】
    为了确保系统能识别你的建议，请严格使用以下中文牌名格式：
    - 万子：1萬, 2萬 ... 9萬
    - 筒子：1筒, 2筒 ... 9筒
    - 条子：1条, 2条 ... 9条
    - 字牌：東, 南, 西, 北, 中, 发, 白

    【核心决策总原则（按优先级）】

    0. **结构完整性最高优先级**
      - 在存在其他合法弃牌的情况下，禁止拆散（按照禁止拆散的程度排序）：
        - 已成顺子 / 刻子
        - 任意对子（数牌对子、字牌对子）
        - 两面搭子（如 3萬4萬、6筒7筒）
        - 单面搭子（如 1条2条、8筒9筒）
      - 拆对子仅允许在以下情况之一：
        - 手牌 ≥ 3 向听且无孤张可弃
        - 非役牌字牌对子，且场上已出现 ≥ 2 张
        - strategyType 明确为 defensive

    1. **牌效优先**
      - 向听数较高时，优先打孤张：
        风/箭（非役） > 1/9 > 2/8 > 中张
      - 优先保留进张数多的搭子与复合形

    2. **绝张保护**
      - 严禁选择导致听牌为绝张或近似绝张的弃牌

    3. **弃牌候选筛选流程**
      - 第一步：排除所有结构牌（对子、搭子、顺子、刻子）
      - 第二步：在剩余牌中按牌效优先级选择弃牌
      - 第三步：若弃牌导致向听数上升或有效进张显著减少，则放弃该方案

    4. **输出一致性**
      - reasoning 字段中必须明确包含：
        “建议打出 [牌名]”

    【输出要求】
    请严格返回 JSON 格式，不要包含 markdown 标记。
    JSON 结构如下：
    {
      "recommendedDiscard": "牌名 (必须使用上述标准格式，且必须在手牌中)",
      "shanten": 数字,
      "winningProbability": 数字 (0-100),
      "potentialFan": 数字 (预估番数),
      "reasoning": "建议打出 [牌名]... (简练分析)",
      "strategyType": "offensive" | "defensive" | "balanced",
      "effectiveTiles": ["进张1", "进张2"...],
      "dangerAssessment": [
        { "tile": "牌名", "score": 0-100 }
      ]
    }
  `;


  const userPrompt = `
    局况信息：
    - 场风：${roundWind}，自风：${seatWind}
    - 场上可见弃牌(最近)：[${discardStr}]
    - 场上副露：[${meldStr}]
    - 我的手牌：[${handStr}]
    - 【绝张(余0)】: [${depletedInfo}]
    - 【短缺(余1)】: [${scarceInfo}]

    请给出你的专业分析与出牌建议。
  `;

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-v3.2", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, 
        response_format: { type: "json_object" } 
      }),
      signal: signal // 传递 abort signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error("Empty response from AI");

    // 清洗 Markdown
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\s*/, '');
    }
    if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanContent);

    // --- 校验逻辑 ---
    
    const aiRecommendedRaw = result.recommendedDiscard || "";
    let validDiscard = "";
    let finalReasoning = result.reasoning || "";

    // 使用增强的匹配器在手牌中查找
    const matchedSymbol = findMatchingTileInHand(aiRecommendedRaw, playerHand);

    if (matchedSymbol) {
        validDiscard = matchedSymbol;
        // 同步文案
        if (!finalReasoning.includes(validDiscard)) {
            finalReasoning = `建议打出 ${validDiscard}。${finalReasoning}`;
        }
    } else {
        console.warn(`AI 推荐了不存在的牌: "${aiRecommendedRaw}" (Raw)，标准化失败。执行回退。`);
        
        // 回退策略：打出最后一张牌
        const fallbackTile = playerHand[playerHand.length - 1] || playerHand[0];
        validDiscard = fallbackTile?.symbol || "N/A";
        
        finalReasoning = `(系统修正) AI 原本建议打出 ${aiRecommendedRaw}，但无法在手牌中找到该牌。系统已自动调整为打出 ${validDiscard}。`;
    }

    return {
      recommendedDiscard: validDiscard,
      shanten: typeof result.shanten === 'number' ? result.shanten : 3,
      winningProbability: result.winningProbability || 0,
      potentialFan: result.potentialFan || 0,
      reasoning: finalReasoning,
      strategyType: result.strategyType || "balanced",
      effectiveTiles: Array.isArray(result.effectiveTiles) ? result.effectiveTiles : [],
      dangerAssessment: Array.isArray(result.dangerAssessment) ? result.dangerAssessment : []
    } as AIAnalysisResult;

  } catch (error: any) {
    if (error.name === 'AbortError') {
        throw error; // 让调用者处理 AbortError
    }
    console.error("DeepSeek Strategy Error:", error);
    return {
      recommendedDiscard: playerHand[playerHand.length - 1]?.symbol || "N/A",
      shanten: -1,
      winningProbability: 0,
      potentialFan: 0,
      reasoning: `分析服务暂时不可用: ${error instanceof Error ? error.message : '未知错误'}`,
      strategyType: "balanced",
      effectiveTiles: [],
      dangerAssessment: []
    };
  }
};
