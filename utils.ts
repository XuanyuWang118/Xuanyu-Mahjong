
import { Tile, Suit, Meld, FanType, HuResult, BotDifficulty, AIAnalysisResult, WinningTileHint } from './types';
import { getTilePriority, FAN_TYPES, ROUND_WINDS, SUITS, WINDS, DRAGONS, generateDeck } from './constants';

export const shuffleDeck = (deck: Tile[]): Tile[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const sortHand = (hand: Tile[]): Tile[] => {
  return [...hand].sort((a, b) => getTilePriority(a) - getTilePriority(b));
};

export const checkCanPong = (hand: Tile[], discard: Tile): boolean => {
  const count = hand.filter(t => t.suit === discard.suit && t.value === discard.value).length;
  return count >= 2;
};

export const checkCanKong = (hand: Tile[], discard: Tile): boolean => {
  const count = hand.filter(t => t.suit === discard.suit && t.value === discard.value).length;
  return count >= 3;
};

export const checkCanChow = (hand: Tile[], discard: Tile): Tile[][] => {
  if (['wind', 'dragon'].includes(discard.suit)) return [];
  const val = discard.value as number;
  const suit = discard.suit;
  const potentialChows: Tile[][] = [];
  const suitTiles = hand.filter(t => t.suit === suit);
  const findVal = (v: number) => suitTiles.find(t => t.value === v);

  const m2 = findVal(val - 2);
  const m1 = findVal(val - 1);
  if (m2 && m1) potentialChows.push([m2, m1]);

  const p1 = findVal(val + 1);
  if (m1 && p1) potentialChows.push([m1, p1]);

  const p2 = findVal(val + 2);
  if (p1 && p2) potentialChows.push([p1, p2]);

  return potentialChows;
};

const getSuitSymbolSuffix = (suit: Suit): string => {
  if (suit === 'man') return '萬';
  if (suit === 'pin') return '筒';
  if (suit === 'sou') return '条';
  return ''; 
};

// 获取牌对应的音频文件名
export const getTileAudioFilename = (tile: Tile): string => {
  if (tile.suit === 'man') return `m${tile.value}`;
  if (tile.suit === 'pin') return `p${tile.value}`;
  if (tile.suit === 'sou') {
    // 特殊处理：幺鸡
    if (tile.value === 1) return 's1_yaoji';
    return `s${tile.value}`;
  }
  if (tile.suit === 'wind') {
    const map: Record<string, string> = { 'E': 'z1_dong', 'S': 'z2_nan', 'W': 'z3_xi', 'N': 'z4_bei' };
    return map[tile.value as string] || '';
  }
  if (tile.suit === 'dragon') {
    const map: Record<string, string> = { 'Red': 'z5_zhong', 'Green': 'z6_fa', 'White': 'z7_bai' };
    return map[tile.value as string] || '';
  }
  return '';
};

export const calculateTileCounts = (allDiscards: Tile[], allMelds: Tile[], myHand: Tile[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  SUITS.forEach(suit => {
    const symbolSuffix = getSuitSymbolSuffix(suit);
    for (let i = 1; i <= 9; i++) counts[`${i}${symbolSuffix}`] = 4;
  });
  WINDS.forEach(wind => {
    let symbol = wind === 'E' ? '東' : wind === 'S' ? '南' : wind === 'W' ? '西' : '北';
    counts[symbol] = 4;
  });
  DRAGONS.forEach(dragon => {
    let symbol = dragon === 'Red' ? '中' : dragon === 'Green' ? '发' : '白';
    counts[symbol] = 4;
  });

  const decrement = (t: Tile) => {
    if (counts[t.symbol] !== undefined) counts[t.symbol] = Math.max(0, counts[t.symbol] - 1);
  };
  allDiscards.forEach(decrement);
  allMelds.forEach(decrement);
  myHand.forEach(decrement);
  return counts;
};

const getTileSymbolMap = (tiles: Tile[]): Map<string, { count: number; tiles: Tile[] }> => {
  const map = new Map<string, { count: number; tiles: Tile[] }>();
  for (const tile of tiles) {
    const entry = map.get(tile.symbol) || { count: 0, tiles: [] };
    entry.count++;
    entry.tiles.push(tile);
    map.set(tile.symbol, entry);
  }
  return map;
};

const canFormSetsRecursive = (tiles: Tile[], setsToFind: number): boolean => {
  if (setsToFind === 0) return tiles.length === 0;
  if (tiles.length < setsToFind * 3) return false;
  const currentTiles = sortHand([...tiles]);
  if (currentTiles.length === 0) return setsToFind === 0;
  const firstTile = currentTiles[0];

  const tripletCount = currentTiles.filter(t => t.symbol === firstTile.symbol).length;
  if (tripletCount >= 3) {
    const remaining = currentTiles.filter((t, i) => {
       const firstThreeIndices = currentTiles.map((tile, idx) => tile.symbol === firstTile.symbol ? idx : -1).filter(idx => idx !== -1).slice(0, 3);
       return !firstThreeIndices.includes(i);
    });
    if (canFormSetsRecursive(remaining, setsToFind - 1)) return true;
  }

  if (['man', 'pin', 'sou'].includes(firstTile.suit) && typeof firstTile.value === 'number') {
    const firstValue = firstTile.value as number;
    const secondTileIdx = currentTiles.findIndex(t => t.suit === firstTile.suit && t.value === firstValue + 1);
    const thirdTileIdx = currentTiles.findIndex(t => t.suit === firstTile.suit && t.value === firstValue + 2);
    if (secondTileIdx !== -1 && thirdTileIdx !== -1) {
      const remaining = currentTiles.filter((_, i) => i !== 0 && i !== secondTileIdx && i !== thirdTileIdx);
      if (canFormSetsRecursive(remaining, setsToFind - 1)) return true;
    }
  }
  return false;
};

export const checkIfSevenPairs = (fullHand: Tile[]): boolean => {
  if (fullHand.length !== 14) return false;
  const tileCounts = getTileSymbolMap(fullHand);
  let pairCount = 0;
  for (const entry of tileCounts.values()) {
    if (entry.count === 2) pairCount += 1;
    else if (entry.count === 4) pairCount += 2;
    else if (entry.count !== 0) return false;
  }
  return pairCount === 7;
};

export const checkIfThirteenOrphans = (fullHand: Tile[]): boolean => {
  if (fullHand.length !== 14) return false;
  const target = ['1萬','9萬','1筒','9筒','1条','9条','東','南','西','北','中','发','白'];
  const counts = getTileSymbolMap(fullHand);
  let uniqueCount = 0;
  let pairFound = false;
  for (const sym of target) {
    if (counts.has(sym)) {
      uniqueCount++;
      if (counts.get(sym)!.count >= 2) pairFound = true;
    }
  }
  return uniqueCount === 13 && pairFound;
};

export const checkCanHu = (hand: Tile[], melds: Meld[], newTile: Tile): boolean => {
  const currentHand = [...hand, newTile];
  if (currentHand.length + melds.length * 3 !== 14) return false;
  const isOpen = melds.some(m => m.type !== 'angang');
  if (!isOpen) {
    if (checkIfSevenPairs(currentHand)) return true;
    if (checkIfThirteenOrphans(currentHand)) return true;
  }
  const setsNeeded = 4 - melds.length;
  const tileCounts = getTileSymbolMap(currentHand);
  for (const [symbol, entry] of tileCounts.entries()) {
    if (entry.count >= 2) {
      const remainingHand = [...currentHand];
      let removed = 0;
      for (let i = remainingHand.length - 1; i >= 0; i--) {
        if (remainingHand[i].symbol === symbol) {
          remainingHand.splice(i, 1);
          removed++;
          if (removed === 2) break;
        }
      }
      if (canFormSetsRecursive(remainingHand, setsNeeded)) return true;
    }
  }
  return false;
};

interface HandDecomposition { sets: Tile[][]; pair: Tile[]; }

function findSetsAndPair(tiles: Tile[], targetSets: number): HandDecomposition[] {
  const decompositions: HandDecomposition[] = [];
  const counts = getTileSymbolMap(tiles);
  for (const [symbol, entry] of counts.entries()) {
    if (entry.count >= 2) {
      const pair = entry.tiles.slice(0, 2);
      const remainingTiles = tiles.filter(t => !pair.some(p => p.id === t.id));
      const subDecompositions = findSetsRecursive(remainingTiles, targetSets); 
      for (const subDec of subDecompositions) decompositions.push({ sets: subDec.sets, pair: pair });
    }
  }
  return decompositions;
}

function findSetsRecursive(tiles: Tile[], setsToFind: number): { sets: Tile[][] }[] {
  if (setsToFind === 0) return tiles.length === 0 ? [{ sets: [] }] : [];
  const decompositions: { sets: Tile[][] }[] = [];
  const currentTiles = sortHand([...tiles]);
  if (currentTiles.length === 0) return [];
  const firstTile = currentTiles[0];
  const triplet = currentTiles.filter(t => t.symbol === firstTile.symbol);
  if (triplet.length >= 3) {
    const remaining = currentTiles.filter((t, i) => {
       const firstThreeIndices = currentTiles.map((tile, idx) => tile.symbol === firstTile.symbol ? idx : -1).filter(idx => idx !== -1).slice(0, 3);
       return !firstThreeIndices.includes(i);
    });
    const sub = findSetsRecursive(remaining, setsToFind - 1);
    for (const s of sub) decompositions.push({ sets: [triplet.slice(0, 3), ...s.sets] });
  }
  if (['man', 'pin', 'sou'].includes(firstTile.suit) && typeof firstTile.value === 'number') {
    const firstValue = firstTile.value as number;
    const secondIdx = currentTiles.findIndex(t => t.suit === firstTile.suit && t.value === firstValue + 1);
    const thirdIdx = currentTiles.findIndex(t => t.suit === firstTile.suit && t.value === firstValue + 2);
    if (secondIdx !== -1 && thirdIdx !== -1) {
      const remaining = currentTiles.filter((_, i) => i !== 0 && i !== secondIdx && i !== thirdIdx);
      const sub = findSetsRecursive(remaining, setsToFind - 1);
      for (const s of sub) decompositions.push({ sets: [[firstTile, currentTiles[secondIdx], currentTiles[thirdIdx]], ...s.sets] });
    }
  }
  return decompositions;
}

export const calculateHandFans = (
  fullHand: Tile[], 
  actualMelds: Meld[], 
  winningTile: Tile,
  isTsumo: boolean,
  isRon: boolean, 
  roundWind: 'E' | 'S' | 'W' | 'N',
  playerSeatWind: 'E' | 'S' | 'W' | 'N',
  allDiscards: Tile[], 
  allPlayersMelds: Meld[],
  winningPlayerId: number,
  isGangShangKaiHua: boolean = false
): HuResult => {
  let fanList: FanType[] = [];
  const addFan = (fanName: string) => {
    const baseFan = FAN_TYPES.find(f => f.name === fanName);
    if (baseFan) fanList.push({ ...baseFan });
  };

  const tileCounts = getTileSymbolMap(fullHand);
  const isOpen = actualMelds.some(m => m.type !== 'angang');

  // --- 第二步：结构解析 (Level 1) ---
  if (checkIfThirteenOrphans(fullHand)) {
    addFan('国士无双');
    return finalizeHuResult(fanList, isTsumo, winningTile, winningPlayerId);
  }

  const numConcealedSets = 4 - actualMelds.length;
  const concealedHandTiles = fullHand.filter(tile => !actualMelds.some(meld => meld.tiles.some(mTile => mTile.id === tile.id)));
  const decompositions = findSetsAndPair(concealedHandTiles, numConcealedSets);
  
  let isFourConcealed = false;
  if (decompositions.length > 0) {
    const { sets: concealedSets } = decompositions[0];
    const totalTriplets = actualMelds.filter(m => m.type === 'angang').length + concealedSets.filter(s => s[0].symbol === s[1].symbol).length;
    if (totalTriplets === 4 && !isOpen) {
      addFan('四暗刻');
      isFourConcealed = true;
    }
  }

  let isSevenPairs = false;
  if (!isFourConcealed && checkIfSevenPairs(fullHand)) {
    addFan('七对');
    isSevenPairs = true;
  }

  // --- 第三步 & 第四步：标准结构下的强结构与组成性判定 ---
  let isDanDiao = false;
  let isQianZhang = false;

  if (!isFourConcealed && !isSevenPairs && decompositions.length > 0) {
    // 遍历所有可能的分解以匹配听牌形态
    for (const dec of decompositions) {
      const { sets: concealedSets, pair } = dec;
      const allSets = [...actualMelds.map(m => m.tiles), ...concealedSets];

      // 碰碰胡
      if (allSets.every(s => s[0].symbol === s[1].symbol)) {
        addFan('碰碰胡');
      } else {
        // 平和
        const isAllChows = allSets.every(s => s[0].symbol !== s[1].symbol);
        if (isAllChows && !['wind', 'dragon'].includes(pair[0].suit)) addFan('平和');
      }

      // 全带幺
      const isTerminalOrHonor = (t: Tile) => (typeof t.value === 'number' && (t.value === 1 || t.value === 9)) || t.suit === 'wind' || t.suit === 'dragon';
      if (allSets.every(s => s.some(isTerminalOrHonor)) && isTerminalOrHonor(pair[0])) addFan('全带幺');

      // 三色三同顺
      for (let v = 1; v <= 7; v++) {
        const hasM = allSets.some(s => s[0].suit === 'man' && s[0].value === v && s[1].value === v+1);
        const hasP = allSets.some(s => s[0].suit === 'pin' && s[0].value === v && s[1].value === v+1);
        const hasS = allSets.some(s => s[0].suit === 'sou' && s[0].value === v && s[1].value === v+1);
        if (hasM && hasP && hasS) { addFan('三色三同顺'); break; }
      }

      // 听牌形态判定 (修订版重点)
      // 单吊将：胡牌张仅作为将牌使用
      if (pair.some(p => p.id === winningTile.id)) isDanDiao = true;
      // 嵌张：胡牌张作为顺子的中间张
      for (const set of concealedSets) {
        if (set[0].symbol !== set[1].symbol) { // 顺子
          const vals = set.map(t => t.value as number).sort();
          if (winningTile.value === vals[1] && set.some(t => t.id === winningTile.id)) isQianZhang = true;
        }
      }
      if (isDanDiao || isQianZhang) break; 
    }
  }

  // 组成性：清一色/混一色 (互斥)
  // 必须考虑手牌 + 已曝光的吃碰杠牌 (actualMelds)
  const allTilesToCheck = [...fullHand, ...actualMelds.flatMap(m => m.tiles)];
  const suits = new Set(allTilesToCheck.map(t => t.suit).filter(s => s !== 'wind' && s !== 'dragon'));
  const hasHonors = allTilesToCheck.some(t => t.suit === 'wind' || t.suit === 'dragon');
  
  if (suits.size === 1) {
    if (!hasHonors) addFan('清一色');
    else addFan('混一色');
  }

  // --- 第五步：状态性番种判定 ---
  if (!isOpen) addFan('门前清');
  if (isTsumo) addFan('自摸');

  // 杠/刻 状态
  actualMelds.forEach(m => {
    if (m.type === 'kong' && !m.isConcealed) addFan('明杠');
    if (m.type === 'angang') addFan('暗杠');
  });

  ['中', '发', '白'].forEach(sym => { if ((tileCounts.get(sym)?.count || 0) >= 3) addFan('箭刻'); });
  const windMap: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' };
  if ((tileCounts.get(windMap[roundWind])?.count || 0) >= 3) addFan('圈风刻');
  if ((tileCounts.get(windMap[playerSeatWind])?.count || 0) >= 3) addFan('门风刻');

  // 听牌形态应用 (互斥规则)
  if (isDanDiao) addFan('单吊将');
  else if (isQianZhang) addFan('嵌张');

  // 杠上开花
  if (isGangShangKaiHua && isTsumo) addFan('杠上开花');

  return finalizeHuResult(fanList, isTsumo, winningTile, winningPlayerId);
};

function finalizeHuResult(fanList: FanType[], isTsumo: boolean, winningTile: Tile, winnerId: number): HuResult {
  // 去重处理 (针对非累加番种)
  const uniqueFans: FanType[] = [];
  fanList.forEach(f => {
    if (f.isAccumulable || !uniqueFans.some(uf => uf.name === f.name)) {
      uniqueFans.push(f);
    }
  });

  if (uniqueFans.length === 0) {
    uniqueFans.push(FAN_TYPES.find(f => f.name === '平胡')!);
  }

  const totalFan = uniqueFans.reduce((sum, f) => sum + f.fan, 0);
  return { isHu: true, fanList: uniqueFans, totalFan, meetsMinFan: true, huType: isTsumo ? 'tsumo' : 'ron', winningTile, winnerId };
}

export const getScore = (tile: Tile, currentHand: Tile[]): number => {
  let score = 0;
  const handCounts = getTileSymbolMap(currentHand);
  const count = handCounts.get(tile.symbol)?.count || 0;
  if (['wind', 'dragon'].includes(tile.suit)) score += (count === 1 ? 50 : -20);
  else if (tile.value === 1 || tile.value === 9) score += (count === 1 ? 30 : -10);
  else score += (count === 1 ? 10 : -30);
  return score;
};

export const getBotDiscard = (hand: Tile[], roundWind: string, playerWind: string, difficulty: BotDifficulty): Tile => {
    const sorted = sortHand(hand);
    if (difficulty === BotDifficulty.EASY) return sorted[Math.floor(Math.random() * sorted.length)];
    let best = sorted[0], maxS = -Infinity;
    for (const t of sorted) {
        const s = getScore(t, sorted) + (difficulty === BotDifficulty.MEDIUM ? (Math.random()*20-10) : 0);
        if (s > maxS) { maxS = s; best = t; }
    }
    return best;
};

export const shouldBotMeld = (hand: Tile[], discard: Tile, type: 'pong' | 'chow' | 'kong', difficulty: BotDifficulty): boolean => {
    if (difficulty === BotDifficulty.EASY) return Math.random() < 0.2;
    if (difficulty === BotDifficulty.MEDIUM) return Math.random() < 0.5;
    return true; 
};

export const getLocalMahjongStrategy = (hand: Tile[], discards: Tile[], melds: Tile[], roundWind: string, playerWind: string): AIAnalysisResult => {
  const sorted = sortHand(hand);
  let best = sorted[0], maxS = -Infinity;
  for (const t of sorted) {
    const s = getScore(t, sorted);
    if (s > maxS) { maxS = s; best = t; }
  }
  return {
    recommendedDiscard: best.symbol,
    shanten: 2,
    winningProbability: 40,
    potentialFan: 1,
    reasoning: "策略分析完成：优先清理孤张字牌以提高进张效率。",
    strategyType: "balanced",
    effectiveTiles: [],
    dangerAssessment: sorted.map(t => ({ tile: t.symbol, score: 10 }))
  };
};

// 获取所有种类的单张牌（用于听牌检测）
const getAllUniqueTiles = (): Tile[] => {
    const uniqueTiles: Tile[] = [];
    const seenSymbols = new Set<string>();
    const fullDeck = generateDeck(); // Re-generate a full deck
    for (const tile of fullDeck) {
        if (!seenSymbols.has(tile.symbol)) {
            uniqueTiles.push(tile);
            seenSymbols.add(tile.symbol);
        }
    }
    return uniqueTiles;
}

export const calculateWinningTiles = (
    currentHand: Tile[], 
    melds: Meld[], 
    visibleCounts: Record<string, number>,
    roundWind: 'E' | 'S' | 'W' | 'N',
    playerSeatWind: 'E' | 'S' | 'W' | 'N'
): WinningTileHint[] => {
    // 只有 13 张牌（4面子+1单张）时才可能听牌
    // (计算时手牌是已经排除吃碰杠剩下的牌，通常为 1, 4, 7, 10, 13)
    if ((currentHand.length + melds.length * 3) !== 13) return [];

    const winningHints: WinningTileHint[] = [];
    const uniqueTiles = getAllUniqueTiles();

    for (const testTile of uniqueTiles) {
        // 假设摸到这张牌
        if (checkCanHu(currentHand, melds, testTile)) {
            // 如果能胡，计算番数
            // 为了计算番数，我们需要一个完整的手牌结构（包含刚才模拟摸到的牌）
            const simHand = [...currentHand, testTile];
            const huRes = calculateHandFans(
                simHand, melds, testTile, true, false, 
                roundWind, playerSeatWind, [], [], 0, false
            );

            // 获取剩余张数 (visibleCounts 存储的是剩余可见的，即 TileCounter 中显示的数字)
            // TileCounter logic: counts[sym] = 4 - (discards + melds + myHand)
            // 所以 visibleCounts[testTile.symbol] 就是我们需要的 "剩余未知张数"
            const countLeft = visibleCounts[testTile.symbol] ?? 0;

            winningHints.push({
                tile: testTile,
                fan: huRes.totalFan,
                countLeft: countLeft
            });
        }
    }

    // Sort by fan count descending
    return winningHints.sort((a, b) => b.fan - a.fan);
};
