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
  roundNumber: number; // 0-3 for East, 4-7 for South etc.
  honbaNumber: number; // 连庄次数
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
}

export interface PlayerHistory {
  totalWins: number;
  totalGoldEarned: number;
  maxFanWin: number;
  maxFanHand: Tile[] | null;
  suggestions: string[];
}
