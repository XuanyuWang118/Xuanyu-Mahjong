import { Tile, Suit, Meld, FanType, HuResult, BotDifficulty, AIAnalysisResult } from './types';
import { getTilePriority, FAN_TYPES, ROUND_WINDS, SUITS, WINDS, DRAGONS } from './constants';

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

  // 1. Try triplet
  const tripletCount = currentTiles.filter(t => t.symbol === firstTile.symbol).length;
  if (tripletCount >= 3) {
    const remaining = currentTiles.filter((t, i) => {
       const firstThreeIndices = currentTiles.map((tile, idx) => tile.symbol === firstTile.symbol ? idx : -1).filter(idx => idx !== -1).slice(0, 3);
       return !firstThreeIndices.includes(i);
    });
    if (canFormSetsRecursive(remaining, setsToFind - 1)) return true;
  }

  // 2. Try sequence
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
  winningPlayerId: number
): HuResult => {
  let fanList: FanType[] = [];
  const addFan = (fanName: string) => {
    const fan = FAN_TYPES.find(f => f.name === fanName);
    if (fan) fanList.push(fan);
  };

  const playerFullHandMap = getTileSymbolMap(fullHand);
  const isOpen = actualMelds.some(m => m.type !== 'angang');

  if (isTsumo) addFan('自摸');
  if (!isOpen) addFan('门前清');

  const dragonSymbols = ['中', '发', '白'];
  dragonSymbols.forEach(sym => { if ((playerFullHandMap.get(sym)?.count || 0) >= 3) addFan('箭刻'); });
  
  const windMap: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' };
  if ((playerFullHandMap.get(windMap[roundWind])?.count || 0) >= 3) addFan('圈风刻');
  if ((playerFullHandMap.get(windMap[playerSeatWind])?.count || 0) >= 3) addFan('门风刻');

  actualMelds.forEach(m => {
    if (m.type === 'kong' && !m.isConcealed) addFan('明杠');
    if (m.type === 'angang') addFan('暗杠');
  });

  if (checkIfSevenPairs(fullHand)) {
    addFan('七对');
  } else if (checkIfThirteenOrphans(fullHand)) {
    addFan('国士无双');
  } else {
    const numConcealedSets = 4 - actualMelds.length;
    const concealedHandTiles = fullHand.filter(tile => !actualMelds.some(meld => meld.tiles.some(mTile => mTile.id === tile.id)));
    const decompositions = findSetsAndPair(concealedHandTiles, numConcealedSets);

    if (decompositions.length > 0) {
      const { sets: concealedSets, pair } = decompositions[0];
      const allSets = [...actualMelds.map(m => m.tiles), ...concealedSets];

      const isAllChows = allSets.every(s => s[0].symbol !== s[1].symbol);
      if (isAllChows && !['wind', 'dragon'].includes(pair[0].suit)) addFan('平和');
      
      if (allSets.every(s => s[0].symbol === s[1].symbol)) addFan('碰碰胡');

      const suits = new Set(fullHand.map(t => t.suit));
      const numberSuitsCount = ['man', 'pin', 'sou'].filter(s => suits.has(s as Suit)).length;
      const hasHonors = suits.has('wind') || suits.has('dragon');
      if (numberSuitsCount === 1 && hasHonors) addFan('混一色');
      if (numberSuitsCount === 1 && !hasHonors) addFan('清一色');

      const concealedTripletsCount = allSets.filter(s => s[0].symbol === s[1].symbol && !actualMelds.some(m => m.type !== 'angang' && m.tiles[0].symbol === s[0].symbol)).length;
      if (concealedTripletsCount === 3) addFan('三暗刻');
      if (concealedTripletsCount === 4) addFan('四暗刻');

      for (let v = 1; v <= 7; v++) {
        const hasM = allSets.some(s => s[0].suit === 'man' && s[0].value === v && s[1].value === v+1);
        const hasP = allSets.some(s => s[0].suit === 'pin' && s[0].value === v && s[1].value === v+1);
        const hasS = allSets.some(s => s[0].suit === 'sou' && s[0].value === v && s[1].value === v+1);
        if (hasM && hasP && hasS) { addFan('三色三同顺'); break; }
      }
      
      const isAllTerminalOrHonor = (s: Tile[]) => s.every(t => (typeof t.value === 'number' && (t.value === 1 || t.value === 9)) || t.suit === 'wind' || t.suit === 'dragon');
      if (allSets.every(isAllTerminalOrHonor) && isAllTerminalOrHonor(pair)) addFan('全带幺');
    }
  }

  // Fallback: If it's a valid Hu but no pattern found, give 1 fan (Chicken Hand)
  if (fanList.length === 0) {
    fanList.push({ name: '鸡胡', fan: 1, isAccumulable: false });
  }

  const totalFan = fanList.reduce((sum, f) => sum + f.fan, 0);
  return { isHu: true, fanList, totalFan, meetsMinFan: true, huType: isTsumo ? 'tsumo' : 'ron', winningTile, winnerId: winningPlayerId };
};

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
  const { shanten } = getSimplifiedShantenAndEffectiveTiles(hand);
  const sorted = sortHand(hand);
  let best = sorted[0], maxS = -Infinity;
  for (const t of sorted) {
    const s = getScore(t, sorted);
    if (s > maxS) { maxS = s; best = t; }
  }
  return {
    recommendedDiscard: best.symbol,
    shanten: Math.max(0, shanten),
    winningProbability: shanten <= 0 ? 80 : 50 - shanten * 10,
    potentialFan: 1,
    reasoning: "策略已刷新。优先清理孤张字牌和幺九牌以提高进张效率。",
    strategyType: shanten <= 1 ? "offensive" : "balanced",
    effectiveTiles: [],
    dangerAssessment: sorted.map(t => ({ tile: t.symbol, score: 10 }))
  };
};

const getSimplifiedShantenAndEffectiveTiles = (hand: Tile[]): { shanten: number; effectiveTiles: string[] } => {
  const counts = getTileSymbolMap(hand);
  let groups = 0, pairs = 0;
  const work = new Map(counts);
  for (const [sym, e] of work.entries()) { if (e.count >= 3) { groups++; work.set(sym, { ...e, count: e.count - 3 }); } }
  for (const suit of ['man', 'pin', 'sou'] as Suit[]) {
    const suffix = getSuitSymbolSuffix(suit);
    for (let v = 1; v <= 7; v++) {
      const s1 = `${v}${suffix}`, s2 = `${v+1}${suffix}`, s3 = `${v+2}${suffix}`;
      if ((work.get(s1)?.count||0)>0 && (work.get(s2)?.count||0)>0 && (work.get(s3)?.count||0)>0) {
        groups++;
        [s1,s2,s3].forEach(s => work.set(s, { tiles:[], count: work.get(s)!.count-1 }));
      }
    }
  }
  for (const e of work.values()) { if (e.count >= 2) pairs++; }
  let shanten = 8 - groups * 2 - (pairs > 0 ? 1 : 0);
  return { shanten: Math.max(0, Math.floor(shanten/2)), effectiveTiles: [] };
};