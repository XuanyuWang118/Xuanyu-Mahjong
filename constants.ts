import { Tile, FanType } from './types';

export const SUITS = ['man', 'pin', 'sou'] as const;
export const WINDS = ['E', 'S', 'W', 'N'] as const;
export const DRAGONS = ['Red', 'Green', 'White'] as const;

export const INITIAL_HAND_SIZE = 13;
export const STARTING_GOLD = 10000;
export const BASE_FAN_VALUE = 100;

export const ROUND_WINDS: ('E' | 'S' | 'W' | 'N')[] = ['E', 'S', 'W', 'N'];

export const FAN_TYPES: FanType[] = [
  { name: '平和', fan: 1, isAccumulable: false },
  { name: '门前清', fan: 2, isAccumulable: false },
  { name: '自摸', fan: 1, isAccumulable: true },
  { name: '箭刻', fan: 1, isAccumulable: true },
  { name: '圈风刻', fan: 1, isAccumulable: true },
  { name: '门风刻', fan: 1, isAccumulable: true },
  { name: '碰碰胡', fan: 6, isAccumulable: false },
  { name: '混一色', fan: 6, isAccumulable: false },
  { name: '三暗刻', fan: 6, isAccumulable: false },
  { name: '三色三同顺', fan: 8, isAccumulable: false },
  { name: '全带幺', fan: 12, isAccumulable: false },
  { name: '七对', fan: 24, isAccumulable: false },
  { name: '清一色', fan: 24, isAccumulable: false },
  { name: '四暗刻', fan: 64, isAccumulable: false },
  { name: '国士无双', fan: 88, isAccumulable: false },
  { name: '明杠', fan: 1, isAccumulable: true },
  { name: '暗杠', fan: 2, isAccumulable: true },
];

export const generateDeck = (): Tile[] => {
  const deck: Tile[] = [];
  const suitNames = { man: '萬', pin: '筒', sou: '条' };

  SUITS.forEach(suit => {
    for (let i = 1; i <= 9; i++) {
      for (let j = 0; j < 4; j++) {
        deck.push({
          id: `${suit}-${i}-${j}`,
          suit: suit,
          value: i,
          symbol: `${i}${suitNames[suit]}`
        });
      }
    }
  });

  const windMap: Record<string, string> = { 'E': '東', 'S': '南', 'W': '西', 'N': '北' };
  WINDS.forEach(wind => {
    for (let j = 0; j < 4; j++) {
      deck.push({
        id: `wind-${wind}-${j}`,
        suit: 'wind',
        value: wind,
        symbol: windMap[wind]
      });
    }
  });

  const dragonMap: Record<string, string> = { 'Red': '中', 'Green': '发', 'White': '白' };
  DRAGONS.forEach(dragon => {
    for (let j = 0; j < 4; j++) {
      deck.push({
        id: `dragon-${dragon}-${j}`,
        suit: 'dragon',
        value: dragon,
        symbol: dragonMap[dragon]
      });
    }
  });

  return deck;
};

export const getTilePriority = (tile: Tile): number => {
  const suitOrder = { 'man': 0, 'pin': 1, 'sou': 2, 'wind': 3, 'dragon': 4 };
  const base = suitOrder[tile.suit] * 100;
  if (typeof tile.value === 'number') return base + tile.value;
  const honorOrder: Record<string, number> = { 'E': 1, 'S': 2, 'W': 3, 'N': 4, 'Red': 5, 'Green': 6, 'White': 7 };
  return base + (honorOrder[tile.value as string] || 0);
};
