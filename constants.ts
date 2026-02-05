
import { Tile, FanType, Skill } from './types';

export const SUITS = ['man', 'pin', 'sou'] as const;
export const WINDS = ['E', 'S', 'W', 'N'] as const;
export const DRAGONS = ['Red', 'Green', 'White'] as const;

export const INITIAL_HAND_SIZE = 13;
export const STARTING_GOLD = 50000; 
export const STARTING_DIAMONDS = 50; // 默认初始钻石
export const DIAMOND_REWARD_PER_GAME = 5; // 默认每局奖励
export const BASE_FAN_VALUE = 1000;

export const ROUND_WINDS: ('E' | 'S' | 'W' | 'N')[] = ['E', 'S', 'W', 'N'];

export const SKILLS: Skill[] = [
  {
    id: 'check_hand',
    name: '我要验牌',
    cost: 2,
    description: '查看任意一名玩家的全部手牌，持续10秒。',
    isTargeted: true
  },
  {
    id: 'exchange_tile',
    name: '偷梁换柱',
    cost: 3,
    description: '查看任意玩家的一半手牌，并可用自己的一张牌与其交换，持续10秒。',
    isTargeted: true
  },
  {
    id: 'fireball',
    name: '吃我一炮',
    cost: 1,
    description: '发射大火球攻击一名玩家，炸出一个大黑坑，持续3秒。',
    isTargeted: true
  },
  {
    id: 'arrow_volley',
    name: '万箭齐发',
    cost: 2,
    description: '向全场其他玩家发射密集箭雨，持续3秒。',
    isTargeted: false // 全场攻击
  }
];

export const FAN_TYPES: FanType[] = [
  // 第一类：结构性番种 (Level 1)
  { name: '国士无双', fan: 88, isAccumulable: false },
  { name: '四暗刻', fan: 64, isAccumulable: false },
  { name: '七对', fan: 24, isAccumulable: false },
  { name: '碰碰胡', fan: 6, isAccumulable: false },
  // 第二类：组成性番种 (Level 2)
  { name: '清一色', fan: 24, isAccumulable: false },
  { name: '混一色', fan: 6, isAccumulable: false },
  { name: '全带幺', fan: 12, isAccumulable: false },
  { name: '三色三同顺', fan: 8, isAccumulable: false },
  // 第三类：状态性番种 (Level 3)
  { name: '门前清', fan: 2, isAccumulable: true },
  { name: '自摸', fan: 1, isAccumulable: true },
  { name: '明杠', fan: 1, isAccumulable: true },
  { name: '暗杠', fan: 2, isAccumulable: true },
  { name: '箭刻', fan: 1, isAccumulable: true },
  { name: '圈风刻', fan: 1, isAccumulable: true },
  { name: '门风刻', fan: 1, isAccumulable: true },
  { name: '单吊将', fan: 1, isAccumulable: true },
  { name: '嵌张', fan: 1, isAccumulable: true },
  { name: '杠上开花', fan: 1, isAccumulable: true }, 
  { name: '平胡', fan: 1, isAccumulable: false }, 
  { name: '平和', fan: 1, isAccumulable: true },
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
