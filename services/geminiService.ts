import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Player, Tile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get suit suffix (duplicated from utils.ts for independent service, consider shared helper)
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
  roundWind: string
): Promise<AIAnalysisResult> => {
  
  const handStr = playerHand.map(t => `${t.value}${getSuitSymbolSuffix(t.suit)}`).join(', '); // Use Chinese suffix
  const discardStr = allDiscards.map(t => t.symbol).join(', '); // Already Chinese symbols
  const meldStr = allMelds.map(t => t.symbol).join(', '); // Already Chinese symbols

  const prompt = `
    You are a professional Mahjong AI (136-tile Chinese Standard).

    **Primary Goal:**
    Your objective is to win as quickly as possible (achieve Tenpai/Hu) while minimizing the risk of discarding a winning tile for an opponent (avoiding Dianpao/Ron). For this analysis, **do not prioritize high-scoring hands (Fan value)**. The focus is purely on speed and safety.
    
    **Board State:**
    - Round Wind: ${roundWind}
    - My Hand: [${handStr}]
    - Visible Discards (All players): [${discardStr}]
    - Exposed Melds (All players): [${meldStr}]
    
    **Analysis Task:**
    1. **Shanten**: Calculate the number of tiles needed to reach a winning hand (Tenpai is 0).
    2. **Uke-ire**: List all specific tiles that would improve the hand's shanten.
    3. **Recommended Discard**: Based on speed and safety, identify the single best tile to discard now.
    4. **Danger Assessment**: For each tile currently in my hand, provide a danger score (0-100) representing the probability of another player calling Ron on it if discarded. A score of 0 is completely safe, 100 is extremely dangerous.
    5. **Reasoning**: Briefly explain your discard choice, referencing the balance between moving towards Tenpai and the risk of the discard.
    
    Return the analysis in strict JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedDiscard: { type: Type.STRING, description: "Symbol of best tile to discard (e.g., '1萬', '東')" }, // Updated description
            shanten: { type: Type.NUMBER, description: "Steps to Tenpai (0-6)" },
            winningProbability: { type: Type.NUMBER, description: "0-100%" },
            potentialFan: { type: Type.INTEGER, description: "Estimated score" },
            reasoning: { type: Type.STRING, description: "Strategy brief" },
            strategyType: { type: Type.STRING, enum: ["offensive", "defensive", "balanced"] },
            effectiveTiles: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of symbols (e.g., '1萬', '東') that improve hand" // Updated description
            },
            dangerAssessment: {
                type: Type.ARRAY,
                description: "List of risk scores for tiles",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        tile: { type: Type.STRING },
                        score: { type: Type.INTEGER }
                    },
                    required: ["tile", "score"]
                }
            }
          },
          required: ["recommendedDiscard", "shanten", "winningProbability", "potentialFan", "reasoning", "strategyType", "effectiveTiles", "dangerAssessment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("AI Strategy Error:", error);
    return {
      recommendedDiscard: "?",
      shanten: 3,
      winningProbability: 0,
      potentialFan: 0,
      reasoning: "AI Service Unavailable",
      strategyType: "balanced",
      effectiveTiles: [],
      dangerAssessment: []
    };
  }
};
