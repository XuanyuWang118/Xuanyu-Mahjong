
export type Suit = 'man' | 'pin' | 'sou' | 'wind' | 'dragon';

export interface Tile {
  id: string;
  suit: Suit;
  value: number | string;
  symbol: string;
}

export enum BotDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface Meld {
  type: 'chow' | 'pong' | 'kong' | 'angang';
  tiles: Tile[];
  fromPlayer?: number;
  isConcealed: boolean;
}

export interface Player {
  id: number;
  name: string;
  position: 'bottom' | 'right' | 'top' | 'left';
  hand: Tile[];
  discards: Tile[];
  melds: Meld[];
  score: number;
  gold: number;
  seatWind: 'E' | 'S' | 'W' | 'N';
}

export interface FanType {
  name: string;
  fan: number;
  isAccumulable: boolean;
}

export interface HuResult {
  isHu: boolean;
  fanList: FanType[];
  totalFan: number;
  meetsMinFan: boolean;
  huType: 'ron' | 'tsumo' | 'draw' | null;
  winningTile: Tile | null;
  winnerId: number | null;
  dealerMultiplier?: number;
}

export interface AIAnalysisResult {
  recommendedDiscard: string;
  shanten: number;
  winningProbability: number;
  potentialFan: number;
  reasoning: string;
  strategyType: 'offensive' | 'defensive' | 'balanced';
  effectiveTiles: string[]; 
  dangerAssessment: { tile: string; score: number }[]; 
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  wall: Tile[];
  roundWind: 'E' | 'S' | 'W' | 'N';
  remainingTiles: number;
  isGameOver: boolean;
  winnerId: number | null;
  winType: 'ron' | 'tsumo' | null;
  lastDiscard: Tile | null;
  lastDiscarderIndex: number;
  waitingForUserAction: boolean;
  dealerId: number;
  roundNumber: number;
  honbaNumber: number;
}

export interface ActionOptions {
  canPong: boolean;
  canKong: boolean;
  canChow: boolean;
  canHu: boolean;
  chowOptions: Tile[][];
}

export interface GameSettings {
  baseFanValue: number;
  playerInitialGold: number;
  botDifficulty: BotDifficulty;
  playerInitialDiamonds: number; 
  diamondRewardPerGame: number;
  backgroundImageUrl?: string; // 新增：自定义背景
  botNames: { top: string; left: string; right: string }; // 新增：自定义机器人名称
  volume: number; // 新增：音量 (0-100)
  autoAIAnalysis: boolean; // 新增：是否自动进行AI分析
}

export interface PlayerHistory {
  totalWins: number;
  totalGoldEarned: number;
  maxFanWin: number;
  maxFanHand: Tile[] | null;
  suggestions: string[];
}

// --- 新增技能相关类型 ---

export type SkillType = 'check_hand' | 'exchange_tile' | 'fireball' | 'arrow_volley';

export interface Skill {
  id: SkillType;
  name: string;
  cost: number;
  description: string;
  isTargeted: boolean; 
}

export interface ActiveSkillState {
  skillId: SkillType;
  step: 'selecting_target' | 'executing';
}

export interface SkillVisualEffect {
  id: string;
  type: SkillType;
  sourceId: number;
  targetId?: number; 
  timestamp: number;
}

// --- 新增账户系统类型 ---
export interface UserProfile {
  username: string;
  // password: string; // Removed: Handled by Firebase Auth
  gold: number;
  diamonds: number;
  history: PlayerHistory;
  settings: GameSettings;
  nickname: string; // 显示名称，可修改
}

// --- 新增听牌提示类型 ---
export interface WinningTileHint {
  tile: Tile;
  fan: number;
  countLeft: number;
}
