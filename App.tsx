
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateDeck, INITIAL_HAND_SIZE, STARTING_GOLD, BASE_FAN_VALUE, ROUND_WINDS, STARTING_DIAMONDS, DIAMOND_REWARD_PER_GAME } from './constants';
import { Player, GameState, Tile, AIAnalysisResult, ActionOptions, Meld, HuResult, BotDifficulty, GameSettings, PlayerHistory, ActiveSkillState, SkillVisualEffect, Skill, UserProfile, WinningTileHint } from './types';
import { shuffleDeck, sortHand, checkCanPong, checkCanKong, checkCanChow, checkCanHu, calculateTileCounts, getBotDiscard, shouldBotMeld, getLocalMahjongStrategy, calculateHandFans, calculateWinningTiles } from './utils';
import MahjongTile from './components/MahjongTile';
import PlayerArea from './components/PlayerArea';
import AnalysisPanel from './components/AnalysisPanel';
import ActionMenu from './components/ActionMenu';
import TileCounter from './components/TileCounter';
import DiscardPiles from './components/DiscardPiles';
import DebugOverlay from './components/DebugOverlay';
import DebugPanel from './components/DebugPanel';
import EndGameModal from './components/EndGameModal'; 
import HomePage from './components/HomePage';
import GameSettingsModal from './components/GameSettingsModal';
import FanDisplayOverlay from './components/FanDisplayOverlay';
import SkillMenu from './components/SkillMenu';
import SkillEffectLayer from './components/SkillEffectLayer';
import PeekSwapModal from './components/PeekSwapModal';
import { audioService } from './services/audio'; // Import Audio Service

import { RefreshCw, Bug, Trophy, Zap, Settings as SettingsIcon, Diamond, History as HistoryIcon, LogOut, Home, AlertTriangle, BrainCircuit, Target } from 'lucide-react';

const DEFAULT_BACKGROUND_IMAGE_URL = 'https://haowallpaper.com/link/common/file/previewFileImg/17787204393749888'; 

type SelfActionOption = 
    | { type: 'ankan'; tiles: Tile[] }
    | { type: 'kakan'; tile: Tile; meldIndex: number };

interface InteractionEffect {
  type: '碰' | '杠' | '吃' | '胡' | '自摸';
  playerName: string;
  position: 'bottom' | 'right' | 'top' | 'left';
}

const DEBUG_TARGETS = [
    { label: 'Table: Main Area', selector: '[data-debug-id="main-area"]' },
    { label: 'Table: Center Wind', selector: '[data-debug-id="center-wind-area"]' },
    { label: 'UI: Skill Menu', selector: '[data-debug-id="skill-menu"]' },
    { label: 'Discard: Bottom', selector: '[data-debug-id="discard-pile-bottom"]' },
    { label: 'Discard: Top', selector: '[data-debug-id="discard-pile-top"]' },
    { label: 'Bottom: Hand Container', selector: '[data-debug-id="player-hand-container"]' },
];

const windMap: Record<string, string> = { 'E': '東', 'S': '南', 'W': '西', 'N': '北' };

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'game'>('home');
  const [showSettings, setShowSettings] = useState(false); // 改为状态控制显示，而不是视图切换
  const [showExitConfirm, setShowExitConfirm] = useState(false); // 退出确认弹窗

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<ActionOptions | null>(null);
  const [selfActionOptions, setSelfActionOptions] = useState<SelfActionOption[]>([]);
  const [tileCounts, setTileCounts] = useState<Record<string, number>>({});
  const [interactionEffect, setInteractionEffect] = useState<InteractionEffect | null>(null);
  const [winningHints, setWinningHints] = useState<WinningTileHint[]>([]); // 听牌提示状态
  
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugTarget, setDebugTarget] = useState(DEBUG_TARGETS[0].selector);

  // --- 账户系统状态 ---
  const [users, setUsers] = useState<Record<string, UserProfile>>(() => {
      try {
          const savedUsers = localStorage.getItem('mahjong_users_db');
          return savedUsers ? JSON.parse(savedUsers) : {};
      } catch { return {}; }
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // --- 游戏核心数据 (State) ---
  // 这些数据作为运行时状态，当 currentUser 存在时，变更会同步回 users 并持久化
  
  const [diamonds, setDiamonds] = useState<number>(STARTING_DIAMONDS);
  const [playerGold, setPlayerGold] = useState<number>(STARTING_GOLD);
  const [playerHistory, setPlayerHistory] = useState<PlayerHistory>({
        totalWins: 0, totalGoldEarned: 0, maxFanWin: 0, maxFanHand: null, suggestions: []
  });
  const [gameSettings, setGameSettings] = useState<GameSettings>({
        baseFanValue: BASE_FAN_VALUE,
        playerInitialGold: STARTING_GOLD,
        botDifficulty: BotDifficulty.HARD,
        playerInitialDiamonds: STARTING_DIAMONDS,
        diamondRewardPerGame: DIAMOND_REWARD_PER_GAME,
        backgroundImageUrl: '',
        botNames: { right: '小熊维尼', top: '哈基米', left: '拉布布' },
        volume: 50 // 默认音量
  });

  // --- Sync Volume ---
  useEffect(() => {
    audioService.setVolume(gameSettings.volume);
  }, [gameSettings.volume]);

  // --- 初始化：加载默认或用户数据 ---
  useEffect(() => {
    // 每次加载 App 时，先读取“默认/游客”数据
    // 如果没有登录，使用 localStorage 中的 'mahjong...' key 作为游客数据
    if (!currentUser) {
        try {
            const savedSettings = localStorage.getItem('mahjongGameSettings');
            if (savedSettings) setGameSettings(JSON.parse(savedSettings));
            
            const savedGold = localStorage.getItem('mahjongPlayerGold');
            if (savedGold) setPlayerGold(JSON.parse(savedGold));

            const savedDiamonds = localStorage.getItem('mahjongDiamonds');
            if (savedDiamonds) setDiamonds(JSON.parse(savedDiamonds));

            const savedHistory = localStorage.getItem('mahjongPlayerHistory');
            if (savedHistory) setPlayerHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Error loading guest data", e); }
    }
  }, []); // Run once on mount

  // --- 持久化逻辑：游客存简单Key，用户存Users DB ---

  // 保存 Users DB
  useEffect(() => {
      localStorage.setItem('mahjong_users_db', JSON.stringify(users));
  }, [users]);

  // 同步运行时数据到当前用户 Profile (如果已登录) 或 游客 Storage
  const syncDataToStorage = useCallback(() => {
      if (currentUser) {
          // 更新 users 对象中的当前用户数据
          setUsers(prev => ({
              ...prev,
              [currentUser.username]: {
                  ...currentUser, // 保留密码等
                  gold: playerGold,
                  diamonds: diamonds,
                  history: playerHistory,
                  settings: gameSettings,
                  nickname: currentUser.nickname // 确保昵称同步
              }
          }));
          // 同时更新 currentUser 状态引用，避免 stale
          setCurrentUser(prev => prev ? ({
              ...prev,
              gold: playerGold,
              diamonds: diamonds,
              history: playerHistory,
              settings: gameSettings
          }) : null);
      } else {
          // 游客模式：保存到独立 key
          localStorage.setItem('mahjongGameSettings', JSON.stringify(gameSettings));
          localStorage.setItem('mahjongPlayerGold', JSON.stringify(playerGold));
          localStorage.setItem('mahjongDiamonds', JSON.stringify(diamonds));
          localStorage.setItem('mahjongPlayerHistory', JSON.stringify(playerHistory));
      }
  }, [playerGold, diamonds, playerHistory, gameSettings, currentUser?.username]); 

  // 当关键数据变化时触发同步
  useEffect(() => { syncDataToStorage(); }, [playerGold, diamonds, playerHistory, gameSettings]);

  // 实时同步机器人名称到局内 (新增)
  useEffect(() => {
    if (gameState) {
      setGameState(prev => {
        if (!prev) return null;
        const newPlayers = [...prev.players];
        let changed = false;
        if (newPlayers[1].name !== gameSettings.botNames.right) { newPlayers[1] = { ...newPlayers[1], name: gameSettings.botNames.right }; changed = true; }
        if (newPlayers[2].name !== gameSettings.botNames.top) { newPlayers[2] = { ...newPlayers[2], name: gameSettings.botNames.top }; changed = true; }
        if (newPlayers[3].name !== gameSettings.botNames.left) { newPlayers[3] = { ...newPlayers[3], name: gameSettings.botNames.left }; changed = true; }
        return changed ? { ...prev, players: newPlayers } : prev;
      });
    }
  }, [gameSettings.botNames]);

  // --- 账户操作 ---

  const handleRegister = (u: string, p: string) => {
      if (users[u]) { alert('用户名已存在'); return false; }
      const newUser: UserProfile = {
          username: u, password: p, nickname: u,
          gold: STARTING_GOLD, diamonds: STARTING_DIAMONDS,
          history: { totalWins: 0, totalGoldEarned: 0, maxFanWin: 0, maxFanHand: null, suggestions: [] },
          settings: {
              baseFanValue: BASE_FAN_VALUE, playerInitialGold: STARTING_GOLD, botDifficulty: BotDifficulty.HARD,
              playerInitialDiamonds: STARTING_DIAMONDS, diamondRewardPerGame: DIAMOND_REWARD_PER_GAME,
              botNames: { right: '小熊维尼', top: '哈基米', left: '拉布布' },
              volume: 50
          }
      };
      const newUsers = { ...users, [u]: newUser };
      setUsers(newUsers);
      handleLogin(u, p, newUsers); 
      return true;
  };

  const handleLogin = (u: string, p: string, currentUsersDb = users) => {
      const user = currentUsersDb[u];
      if (user && user.password === p) {
          setCurrentUser(user);
          // 载入用户数据覆盖当前状态
          setPlayerGold(user.gold);
          setDiamonds(user.diamonds);
          setPlayerHistory(user.history);
          setGameSettings(user.settings);
          return true;
      }
      alert('用户名或密码错误');
      return false;
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setPlayerGold(STARTING_GOLD);
      setDiamonds(STARTING_DIAMONDS);
      setPlayerHistory({ totalWins: 0, totalGoldEarned: 0, maxFanWin: 0, maxFanHand: null, suggestions: [] });
      setGameSettings({
        baseFanValue: BASE_FAN_VALUE, playerInitialGold: STARTING_GOLD, botDifficulty: BotDifficulty.HARD,
        playerInitialDiamonds: STARTING_DIAMONDS, diamondRewardPerGame: DIAMOND_REWARD_PER_GAME,
        botNames: { right: '小熊维尼', top: '哈基米', left: '拉布布' },
        volume: 50
      });
      try {
        const savedSettings = localStorage.getItem('mahjongGameSettings');
        if (savedSettings) setGameSettings(JSON.parse(savedSettings));
      } catch {}
      setCurrentView('home');
  };
  
  // 更新当前用户的昵称或密码
  const handleUpdateProfile = (nickname: string, password?: string) => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, nickname, ...(password ? { password } : {}) };
      setCurrentUser(updatedUser);
      setUsers(prev => ({ ...prev, [currentUser.username]: updatedUser }));
      
      // 如果正在游戏中，实时更新局内玩家名称
      if (gameState) {
          setGameState(prev => {
              if (!prev) return null;
              const newPlayers = [...prev.players];
              newPlayers[0] = { ...newPlayers[0], name: nickname };
              return { ...prev, players: newPlayers };
          });
      }
  };

  // --- 技能状态 ---
  const [activeSkillState, setActiveSkillState] = useState<ActiveSkillState | null>(null);
  const [skillEffects, setSkillEffects] = useState<SkillVisualEffect[]>([]);
  const [damagedPlayers, setDamagedPlayers] = useState<Record<number, 'crater' | 'arrows'>>({}); 
  const [peekModalState, setPeekModalState] = useState<{type: 'check_hand'|'exchange_tile', targetId: number} | null>(null);

  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [finalGameSummary, setFinalGameSummary] = useState<{
    winnerName: string;
    winType: 'ron' | 'tsumo' | null;
    allPlayersHands: Player[]; 
    winningTile: Tile | null; 
    winnerId: number | null;
    huResult: HuResult | null;
    playerGoldChanges: { id: number; change: number }[];
  } | null>(null);

  const [showFanDisplayOverlay, setShowFanDisplayOverlay] = useState(false);
  const [roundHuResult, setRoundHuResult] = useState<HuResult | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const triggerInteractionEffect = (type: InteractionEffect['type'], playerName: string, position: InteractionEffect['position']) => {
    if (type === '胡') return;
    setInteractionEffect({ type, playerName, position });
    setTimeout(() => setInteractionEffect(null), 1200);
  };

  // --- 技能系统逻辑 ---
  const handleSkillSelect = (skill: Skill) => {
    audioService.playClick();
    if (!gameState) return;
    if (skill.isTargeted) {
        setActiveSkillState({ skillId: skill.id, step: 'selecting_target' });
        setGameLog(prev => [...prev, `[系统] 请选择一名玩家释放 ${skill.name}`]);
    } else {
        executeSkill(skill.id);
    }
  };

  const handlePlayerTargetClick = (targetPlayerId: number) => {
    audioService.playClick();
    if (!activeSkillState || activeSkillState.step !== 'selecting_target') return;
    if (targetPlayerId === 0) {
        setGameLog(prev => [...prev, `[系统] 不能对自己使用此技能`]);
        return;
    }
    executeSkill(activeSkillState.skillId, targetPlayerId);
    setActiveSkillState(null);
  };

  const executeSkill = (skillId: Skill['id'], targetId?: number) => {
    const skill = [
        { id: 'check_hand', cost: 2 }, 
        { id: 'exchange_tile', cost: 3 },
        { id: 'fireball', cost: 1 },
        { id: 'arrow_volley', cost: 2 }
    ].find(s => s.id === skillId);
    
    if (!skill || diamonds < skill.cost) return;

    setDiamonds(prev => prev - skill.cost);
    setGameLog(prev => [...prev, `[技能] ${gameState?.players[0].name || '玩家'}使用了 ${skillId === 'arrow_volley' ? '万箭齐发' : skillId === 'fireball' ? '吃我一炮' : skillId === 'check_hand' ? '我要验牌' : '偷梁换柱'}`]);

    const newEffectId = Date.now().toString();
    setSkillEffects(prev => [...prev, { id: newEffectId, type: skillId as any, sourceId: 0, targetId: targetId, timestamp: Date.now() }]);

    setTimeout(() => {
        if (skillId === 'fireball' && targetId !== undefined) {
             // Effect handled by SkillEffectLayer
        } else if (skillId === 'arrow_volley') {
            const newDamaged = { ...damagedPlayers };
            [1, 2, 3].forEach(pid => newDamaged[pid] = 'arrows');
            setDamagedPlayers(newDamaged);
            setTimeout(() => setDamagedPlayers(prev => { const n = {...prev}; [1,2,3].forEach(p=>delete n[p]); return n; }), 3000);
        }
    }, 1200);

    if (skillId === 'check_hand' || skillId === 'exchange_tile') {
        if (targetId !== undefined) setPeekModalState({ type: skillId as any, targetId });
    }
  };

  const handleSkillSwap = (myTileId: string, targetTileId: string) => {
      // audioService.playDraw(); // Removed draw sound
      if (!gameState || !peekModalState) return;
      const targetId = peekModalState.targetId;
      setGameState(prev => {
          if (!prev) return null;
          const players = prev.players.map(p => ({ ...p }));
          const me = players[0];
          const target = players[targetId];
          const myTileIdx = me.hand.findIndex(t => t.id === myTileId);
          const targetTileIdx = target.hand.findIndex(t => t.id === targetTileId);
          if (myTileIdx === -1 || targetTileIdx === -1) return prev;
          const tempTile = me.hand[myTileIdx];
          me.hand[myTileIdx] = target.hand[targetTileIdx];
          target.hand[targetTileIdx] = tempTile;
          me.hand = sortHand(me.hand);
          target.hand = sortHand(target.hand);
          setGameLog(logs => [...logs, `[技能] 偷梁换柱成功！`]);
          return { ...prev, players };
      });
  };

  // --- 游戏逻辑 ---

  const startNewRound = useCallback((currentDealerId: number, currentRoundNumber: number, currentHonbaNumber: number) => {
    audioService.playClick();
    const deck = shuffleDeck(generateDeck());
    const players: Player[] = [
      { id: 0, name: currentUser ? currentUser.nickname : '玩家', position: 'bottom', hand: [], discards: [], melds: [], score: 0, gold: playerGold, seatWind: 'E' },
      { id: 1, name: gameSettings.botNames.right, position: 'right', hand: [], discards: [], melds: [], score: 0, gold: Math.floor(Math.random() * (1000000 - 5000 + 1)) + 5000, seatWind: 'N' },
      { id: 2, name: gameSettings.botNames.top, position: 'top', hand: [], discards: [], melds: [], score: 0, gold: Math.floor(Math.random() * (1000000 - 5000 + 1)) + 5000, seatWind: 'W' },
      { id: 3, name: gameSettings.botNames.left, position: 'left', hand: [], discards: [], melds: [], score: 0, gold: Math.floor(Math.random() * (1000000 - 5000 + 1)) + 5000, seatWind: 'S' },
    ];
    
    const dealerSeatIndex = players.findIndex(p => p.id === currentDealerId);
    if (dealerSeatIndex !== -1) {
        players[dealerSeatIndex].seatWind = 'E';
        players[(dealerSeatIndex + 1) % 4].seatWind = 'N';
        players[(dealerSeatIndex + 2) % 4].seatWind = 'W';
        players[(dealerSeatIndex + 3) % 4].seatWind = 'S';
    }

    for (let i = 0; i < INITIAL_HAND_SIZE; i++) players.forEach(p => p.hand.push(deck.pop()!));
    players.forEach(p => p.hand = sortHand(p.hand));
    players[currentDealerId].hand.push(deck.pop()!);

    const currentWindIndex = Math.floor(currentRoundNumber / 4) % 4;

    const newState: GameState = { 
      players, currentPlayerIndex: currentDealerId, wall: deck, roundWind: ROUND_WINDS[currentWindIndex], 
      remainingTiles: deck.length, isGameOver: false, winnerId: null, winType: null, lastDiscard: null, 
      lastDiscarderIndex: -1, waitingForUserAction: false, dealerId: currentDealerId, 
      roundNumber: currentRoundNumber, honbaNumber: currentHonbaNumber,
    };
    
    setGameState(newState);
    setGameLog(['牌局开始! 祝您好运!']);
    setAiAnalysis(null);
    setActionOptions(null);
    setSelfActionOptions([]);
    setShowEndGameModal(false); 
    setFinalGameSummary(null); 
    setShowFanDisplayOverlay(false);
    setRoundHuResult(null);
    setDamagedPlayers({});
    setActiveSkillState(null);
    setWinningHints([]); // 重置听牌提示
    setCurrentView('game');

    if (currentDealerId !== 0) setTimeout(() => performBotDiscard(currentDealerId), 1500);
  }, [playerGold, currentUser, gameSettings.botNames]);

  const initGame = useCallback(() => startNewRound(0, 0, 0), [startNewRound]);

  const handleNextHand = useCallback(() => {
    if (!gameState || !finalGameSummary) return;
    const isDealerWin = finalGameSummary.winnerId === gameState.dealerId;
    let nextDealerId = gameState.dealerId;
    let nextRoundNumber = gameState.roundNumber;
    let nextHonba = gameState.honbaNumber;
    if (isDealerWin) {
        nextHonba += 1;
    } else {
        nextDealerId = (gameState.dealerId + 1) % 4;
        nextRoundNumber += 1;
        nextHonba = 0;
    }
    startNewRound(nextDealerId, nextRoundNumber, nextHonba);
  }, [gameState, finalGameSummary, startNewRound]);

  useEffect(() => { 
    if (currentView === 'game' && !gameState) initGame(); 
  }, [currentView, gameState, initGame]);
  
  // 滚动逻辑优化：只滚动日志容器
  useEffect(() => { 
      if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [gameLog]);

  useEffect(() => {
    if (!gameState) return;
    const allDiscards = gameState.players.flatMap(p => p.discards);
    const allMelds = gameState.players.flatMap(p => p.melds.flatMap(m => m.tiles));
    setTileCounts(calculateTileCounts(allDiscards, allMelds, gameState.players[0].hand));
  }, [gameState]);

  // 听牌提示 Effect: 监听手牌、TileCounts 和当前轮次变化
  useEffect(() => {
      if (!gameState || gameState.isGameOver) {
          setWinningHints([]);
          return;
      }
      
      const myHand = gameState.players[0].hand;
      const myMelds = gameState.players[0].melds;

      // 仅当手牌张数为 4, 7, 10, 13 (即模 3 余 1) 时检测听牌
      // 这意味着玩家打出牌后，或吃碰后打出牌，处于等待进张的状态
      if ((myHand.length + myMelds.length * 3) % 3 === 1) {
          const hints = calculateWinningTiles(
              myHand, 
              myMelds, 
              tileCounts, 
              gameState.roundWind, 
              gameState.players[0].seatWind
          );
          setWinningHints(hints);
      } else {
          setWinningHints([]);
      }
  }, [gameState?.players[0].hand, gameState?.players[0].melds, tileCounts, gameState?.isGameOver]);


  const checkForSelfActions = useCallback((player: Player) => {
    const options: SelfActionOption[] = [];
    const handCounts: Record<string, Tile[]> = {};
    player.hand.forEach(t => {
        if (!handCounts[t.symbol]) handCounts[t.symbol] = [];
        handCounts[t.symbol].push(t);
    });
    for (const symbol in handCounts) {
        if (handCounts[symbol].length === 4) options.push({ type: 'ankan', tiles: handCounts[symbol] });
    }
    if (player.hand.length % 3 === 2) {
      const drawnTile = player.hand[player.hand.length - 1];
      player.melds.forEach((meld, meldIndex) => {
          if (meld.type === 'pong' && meld.tiles[0].symbol === drawnTile.symbol) options.push({ type: 'kakan', tile: drawnTile, meldIndex });
      });
    }
    setSelfActionOptions(options);
  }, []);

  useEffect(() => {
    if (gameState?.currentPlayerIndex === 0 && !gameState.waitingForUserAction && gameState.players[0].hand.length % 3 === 2 && !gameState.isGameOver) {
      triggerAIAnalysis();
      checkForSelfActions(gameState.players[0]);
    } else if (selfActionOptions.length > 0) {
      setSelfActionOptions([]);
    }
  }, [gameState, checkForSelfActions, selfActionOptions.length]);

  const triggerAIAnalysis = async () => {
    if (!gameState) return;
    setIsAnalyzing(true);
    const analysis = getLocalMahjongStrategy(gameState.players[0].hand, [], [], gameState.roundWind, gameState.players[0].seatWind);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const settleRound = useCallback((huResult: HuResult, winningPlayerId: number | null, winType: 'ron' | 'tsumo' | null, discarderId: number | null, finalPlayers: Player[]) => {
    if (!gameState) return;
    let goldChanges: { id: number; change: number }[] = finalPlayers.map(p => ({ id: p.id, change: 0 }));
    let totalWinGold = 0;
    
    setDiamonds(prev => prev + gameSettings.diamondRewardPerGame);

    if (huResult.isHu && winningPlayerId !== null) {
      totalWinGold = Math.max(1, huResult.totalFan) * gameSettings.baseFanValue;
      let multiplierApplied = 1;

      if (winType === 'tsumo') {
        finalPlayers.forEach(p => {
          if (p.id !== winningPlayerId) {
            const m = (winningPlayerId === gameState.dealerId || p.id === gameState.dealerId) ? 2 : 1;
            if (m > multiplierApplied) multiplierApplied = m;
            const amount = totalWinGold * m;
            goldChanges[winningPlayerId].change += amount;
            goldChanges[p.id].change -= amount;
          }
        });
      } else if (winType === 'ron' && discarderId !== null) {
        multiplierApplied = (winningPlayerId === gameState.dealerId || discarderId === gameState.dealerId) ? 2 : 1;
        const amount = totalWinGold * multiplierApplied;
        goldChanges[winningPlayerId].change += amount;
        goldChanges[discarderId].change -= amount;
      }
      huResult.dealerMultiplier = multiplierApplied;
    }

    const updatedPlayers = finalPlayers.map(p => {
        const change = goldChanges.find(gc => gc.id === p.id)?.change || 0;
        return { ...p, gold: Math.max(0, p.gold + change) };
    });

    const player0Change = goldChanges.find(g => g.id === 0)?.change || 0;
    const isPlayer0Winner = winningPlayerId === 0;

    // --- 结算音效触发逻辑 ---
    if (winningPlayerId === null) {
        // 流局
        audioService.playDrawGame();
    } else if (player0Change > 0) {
        // 玩家赢钱
        audioService.playVictory();
    } else if (player0Change < 0) {
        // 玩家输钱
        audioService.playDefeat();
    } else {
        // 玩家无输赢 (不输不赢)
        audioService.playNeutral();
    }

    setPlayerHistory(prev => {
        const newHistory = { ...prev };
        newHistory.totalGoldEarned += player0Change;
        if (isPlayer0Winner) {
            newHistory.totalWins += 1;
            if (huResult.totalFan > newHistory.maxFanWin) {
                newHistory.maxFanWin = huResult.totalFan;
                const winner = finalPlayers[0];
                const fullHand = [ ...winner.melds.flatMap(m => m.tiles), ...winner.hand ];
                newHistory.maxFanHand = sortHand(fullHand);
            }
        }
        return newHistory;
    });

    setPlayerGold(updatedPlayers[0].gold);
    setFinalGameSummary({
      winnerName: winningPlayerId !== null ? finalPlayers[winningPlayerId].name : '无',
      winType,
      allPlayersHands: updatedPlayers,
      winningTile: huResult.winningTile,
      winnerId: winningPlayerId,
      huResult,
      playerGoldChanges: goldChanges,
    });
    
    setGameState(prev => prev ? ({ ...prev, isGameOver: true, players: updatedPlayers }) : null);
    setTimeout(() => { setShowEndGameModal(true); setShowFanDisplayOverlay(false); }, huResult.isHu ? 3000 : 0);
  }, [gameState, gameSettings.baseFanValue, gameSettings.diamondRewardPerGame]);

  const handleGameEnd = (winnerId: number | null, winType: 'ron' | 'tsumo' | null, finalWinningTile: Tile | null, discarderId: number | null = null, isGangShangKaiHua: boolean = false) => {
    // 移除之前的 generic playWin 调用，改在 settleRound 中根据具体结果播放详细音效

    setGameState(prev => {
        if (!prev) return null;
        
        const winnerName = winnerId !== null ? prev.players[winnerId].name : '无';
        setGameLog(logs => [...logs, winnerId !== null 
            ? `${winnerName} ${winType === 'tsumo' ? '自摸' : '胡牌'}! ${isGangShangKaiHua ? '(杠上开花)' : ''}` 
            : '本局流局']);

        const players = prev.players.map(p => ({ ...p }));
        if (winType === 'ron' && finalWinningTile && winnerId !== null) players[winnerId].hand.push(finalWinningTile);
        const winningPlayer = winnerId !== null ? players[winnerId] : null;
        let huResult: HuResult = { isHu: false, fanList: [], totalFan: 0, meetsMinFan: false, huType: winType, winningTile: finalWinningTile, winnerId };

        if (winningPlayer && winnerId !== null && finalWinningTile) {
          huResult = calculateHandFans(winningPlayer.hand, winningPlayer.melds, finalWinningTile, winType === 'tsumo', winType === 'ron', prev.roundWind, winningPlayer.seatWind, [], [], winnerId, isGangShangKaiHua);
        }

        setRoundHuResult(huResult);
        if (huResult.isHu) setShowFanDisplayOverlay(true);
        settleRound(huResult, winnerId, winType, discarderId, players);
        return { ...prev, isGameOver: true, waitingForUserAction: false };
    });
  };

  const handleDraw = (playerIndex: number) => {
    // audioService.playDraw(); // Removed draw sound
    setGameState(prev => {
      if (!prev || prev.isGameOver) return prev;
      const deck = [...prev.wall];
      if (deck.length === 0) { handleGameEnd(null, null, null); return { ...prev, isGameOver: true }; }
      const tile = deck.pop()!;
      const players = [...prev.players];
      players[playerIndex].hand.push(tile);
      if (checkCanHu(players[playerIndex].hand.slice(0, -1), players[playerIndex].melds, tile)) handleGameEnd(playerIndex, 'tsumo', tile);
      return { ...prev, wall: deck, remainingTiles: deck.length, players };
    });
  };

  const handleDiscard = (index: number) => {
    if (!gameState) return;
    audioService.playDiscard();
    const newPlayers = [...gameState.players];
    const tile = newPlayers[0].hand.splice(index, 1)[0];
    newPlayers[0].hand = sortHand(newPlayers[0].hand);
    newPlayers[0].discards.push(tile);
    setGameLog(prev => [...prev, `${newPlayers[0].name} 打出 ${tile.symbol}`]);
    setGameState(prev => prev ? ({ ...prev, players: newPlayers, lastDiscard: tile, lastDiscarderIndex: 0, waitingForUserAction: false }) : null);
    setSelectedTileIndex(null);
    setTimeout(() => checkForAllInteractions(tile, 0), 1000);
  };

  const performBotDiscard = (botIndex: number) => {
    setGameState(current => {
      if (!current || current.isGameOver) return current;
      audioService.playDiscard();
      const players = [...current.players];
      const bot = players[botIndex];
      const discard = getBotDiscard(bot.hand, current.roundWind, bot.seatWind, gameSettings.botDifficulty);
      const idx = bot.hand.findIndex(t => t.id === discard.id);
      const [tile] = bot.hand.splice(idx > -1 ? idx : 0, 1);
      bot.discards.push(tile);
      bot.hand = sortHand(bot.hand);
      setGameLog(prev => [...prev, `${bot.name} 打出 ${tile.symbol}`]);
      setTimeout(() => checkForAllInteractions(tile, botIndex), 1000);
      return { ...current, players, lastDiscard: tile, lastDiscarderIndex: botIndex };
    });
  };

  const checkForAllInteractions = (discard: Tile, discarderIndex: number, userJustSkipped = false) => {
    setGameState(prev => {
        if (!prev) return null;
        for (let i = 0; i < 4; i++) {
            if (i === discarderIndex) continue;
            if (checkCanHu(prev.players[i].hand, prev.players[i].melds, discard)) {
                if (i === 0) {
                    if (userJustSkipped) continue; 
                    setActionOptions({ canPong: false, canKong: false, canChow: false, canHu: true, chowOptions: [] });
                    return { ...prev, waitingForUserAction: true };
                } else {
                    handleGameEnd(i, 'ron', discard, discarderIndex);
                    return prev; 
                }
            }
        }
        if (discarderIndex !== 0 && !userJustSkipped) {
            const canPong = checkCanPong(prev.players[0].hand, discard);
            const canKong = checkCanKong(prev.players[0].hand, discard);
            const isLeft = (discarderIndex + 1) % 4 === 0;
            const chowOptions = isLeft ? checkCanChow(prev.players[0].hand, discard) : [];
            if (canPong || canKong || chowOptions.length > 0) {
                setActionOptions({ canPong, canKong, canChow: chowOptions.length > 0, canHu: false, chowOptions });
                return { ...prev, waitingForUserAction: true };
            }
        }
        for (let i = 1; i < 4; i++) {
          if (i === discarderIndex) continue;
          if (checkCanPong(prev.players[i].hand, discard) && shouldBotMeld(prev.players[i].hand, discard, 'pong', gameSettings.botDifficulty)) {
              triggerInteractionEffect('碰', prev.players[i].name, prev.players[i].position);
              performBotMeld(i, 'pong', discard, discarderIndex);
              return prev; 
          }
        }
        const nextIdx = (discarderIndex + 1) % 4;
        setTimeout(() => {
           handleDraw(nextIdx);
           if (nextIdx !== 0) setTimeout(() => performBotDiscard(nextIdx), 1000);
        }, 800);
        return { ...prev, currentPlayerIndex: nextIdx };
    });
  };

  const performBotMeld = (botIdx: number, type: 'pong' | 'chow' | 'kong', discard: Tile, fromIdx: number, chowTiles?: Tile[]) => {
    audioService.playMeld();
    setGameState(prev => {
        if (!prev) return null;
        const players = prev.players.map(p => ({ ...p }));
        const bot = players[botIdx];
        setGameLog(prevLogs => [...prevLogs, `${bot.name} ${type === 'pong' ? '碰' : type === 'kong' ? '杠' : '吃'} ${discard.symbol}`]);
        let tr = bot.hand.filter(t => t.symbol === discard.symbol).slice(0, 2);
        bot.hand = bot.hand.filter(t => !tr.some(r => r.id === t.id)); 
        bot.melds.push({ type, tiles: sortHand([...tr, discard]), fromPlayer: fromIdx, isConcealed: false });
        players[fromIdx].discards.pop();
        let wall = [...prev.wall];
        let remainingTiles = prev.remainingTiles;
        if (type === 'kong' && wall.length > 0) {
           const replacementTile = wall.pop()!;
           bot.hand.push(replacementTile);
           remainingTiles = wall.length;
           if (checkCanHu(bot.hand.slice(0, -1), bot.melds, replacementTile)) {
              handleGameEnd(botIdx, 'tsumo', replacementTile, null, true);
              return prev;
           }
        }
        setTimeout(() => performBotDiscard(botIdx), 1200); 
        return { ...prev, players, wall, remainingTiles, currentPlayerIndex: botIdx, lastDiscard: null };
    });
  };

  const performUserMeld = (type: Meld['type'], tilesInHandForMeld: Tile[], discard?: Tile) => { 
    if (!gameState) return;
    audioService.playMeld();
    const playerName = gameState.players[0].name;
    triggerInteractionEffect(type === 'angang' ? '杠' : type === 'pong' ? '碰' : type === 'kong' ? '杠' : '吃', playerName, 'bottom');
    setGameState(prev => {
        if (!prev) return null;
        setGameLog(prevLogs => [...prevLogs, `${prev.players[0].name} ${type === 'angang' ? '暗杠' : type === 'pong' ? '碰' : type === 'kong' ? '杠' : '吃'}`]);
        const players = prev.players.map(p => ({ ...p }));
        const idsToRemove = tilesInHandForMeld.map(t => t.id); 
        players[0].hand = players[0].hand.filter(t => !idsToRemove.includes(t.id));
        if (discard) players[prev.lastDiscarderIndex].discards.pop();
        players[0].melds.push({ type, tiles: sortHand(discard ? [...tilesInHandForMeld, discard] : tilesInHandForMeld), fromPlayer: discard ? prev.lastDiscarderIndex : 0, isConcealed: type === 'angang' });
        let wall = [...prev.wall];
        let remainingTiles = prev.remainingTiles;
        if ((type === 'kong' || type === 'angang') && wall.length > 0) {
            const replacementTile = wall.pop()!;
            players[0].hand.push(replacementTile);
            remainingTiles = wall.length;
            if (checkCanHu(players[0].hand.slice(0, -1), players[0].melds, replacementTile)) {
               handleGameEnd(0, 'tsumo', replacementTile, null, true);
               return prev;
            }
        }
        return { ...prev, players, wall, remainingTiles, waitingForUserAction: false, lastDiscard: null, currentPlayerIndex: 0 };
    });
    setActionOptions(null);
  };

  const performUserKakan = (tile: Tile, meldIndex: number) => {
    if (!gameState) return;
    audioService.playMeld();
    const playerName = gameState.players[0].name;
    triggerInteractionEffect('杠', playerName, 'bottom');
    setGameState(prev => {
        if (!prev) return null;
        setGameLog(prevLogs => [...prevLogs, `${prev.players[0].name} 加杠 ${tile.symbol}`]);
        const players = [...prev.players];
        const player = players[0];
        player.hand = player.hand.filter(t => t.id !== tile.id);
        const meld = player.melds[meldIndex];
        meld.tiles.push(tile);
        meld.type = 'kong';
        meld.isConcealed = false;
        meld.tiles = sortHand(meld.tiles);
        let wall = [...prev.wall];
        let remainingTiles = prev.remainingTiles;
        if (wall.length > 0) {
            const replacementTile = wall.pop()!;
            player.hand.push(replacementTile);
            remainingTiles = wall.length;
            if (checkCanHu(player.hand.slice(0, -1), player.melds, replacementTile)) {
               handleGameEnd(0, 'tsumo', replacementTile, null, true);
               return prev;
            }
        }
        return { ...prev, players, wall, remainingTiles, currentPlayerIndex: 0 };
    });
    setSelfActionOptions([]);
  };

  if (currentView === 'home') return (
    <>
       {showSettings && (
        <GameSettingsModal 
            settings={gameSettings} 
            onSave={(s) => { setGameSettings(s); setShowSettings(false); }} 
            onCancel={() => setShowSettings(false)} 
            playerGold={playerGold} 
            setPlayerGold={setPlayerGold} 
            playerDiamonds={diamonds} 
            setPlayerDiamonds={setDiamonds}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
        />
      )}
     <HomePage 
        onStartGame={initGame} 
        onOpenSettings={() => { audioService.playClick(); setShowSettings(true); }} 
        playerHistory={playerHistory} 
        playerGold={playerGold}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
     />
    </>
  );
  
  if (!gameState) return <div className="h-screen bg-orange-900 flex items-center justify-center text-white">引擎启动中...</div>;

  const interactionEffectStyles: Record<string, string> = {
    bottom: 'bottom-40 left-1/2 -translate-x-1/2',
    top: 'top-40 left-1/2 -translate-x-1/2',
    left: 'top-1/2 left-[320px] -translate-y-1/2', 
    right: 'top-1/2 right-64 -translate-y-1/2'
  };

  return (
    <div className="h-screen bg-[#fcf3cf] font-sans flex flex-col overflow-hidden relative">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700" 
        style={{ 
            backgroundImage: `url('${gameSettings.backgroundImageUrl || DEFAULT_BACKGROUND_IMAGE_URL}')`,
            backgroundColor: '#fcf3cf' 
        }}
      >
        <div className="absolute inset-0 bg-orange-100/10 backdrop-contrast-75 pointer-events-none"></div>
      </div>
      
      {/* 覆盖层组件：设置模态框 */}
      {showSettings && (
        <GameSettingsModal 
            settings={gameSettings} 
            onSave={(s) => { setGameSettings(s); setShowSettings(false); }} 
            onCancel={() => setShowSettings(false)} 
            playerGold={playerGold} 
            setPlayerGold={setPlayerGold} 
            playerDiamonds={diamonds} 
            setPlayerDiamonds={setDiamonds}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
          <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
              <div className="bg-gray-900 border border-red-500/50 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                  <AlertTriangle className="mx-auto text-red-500 w-12 h-12 mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold text-white mb-2">确认退出对局？</h3>
                  <p className="text-gray-400 mb-6 text-sm">当前的对局进度将会丢失，且会被视为中途退出。</p>
                  <div className="flex gap-4">
                      <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors">
                          继续战斗
                      </button>
                      <button onClick={() => { setShowExitConfirm(false); setCurrentView('home'); }} className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white font-bold transition-colors">
                          确认离开
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 验牌/换牌 模态框 */}
      {peekModalState && gameState && (
        <PeekSwapModal 
            type={peekModalState.type}
            targetPlayer={gameState.players[peekModalState.targetId]}
            myHand={gameState.players[0].hand}
            onClose={() => setPeekModalState(null)}
            onSwap={handleSkillSwap}
        />
      )}
      
      {interactionEffect && (
        <div className={`fixed z-[3000] pointer-events-none ${interactionEffectStyles[interactionEffect.position]}`}>
           <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <div className="text-[6rem] font-calligraphy text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] leading-none select-none">
                {interactionEffect.type}
              </div>
              <div className="text-lg font-black text-white bg-black/50 px-4 py-1 rounded-full mt-2 backdrop-blur-sm border border-white/20">
                {interactionEffect.playerName}
              </div>
           </div>
        </div>
      )}

      {showFanDisplayOverlay && roundHuResult && <FanDisplayOverlay huResult={roundHuResult} winnerName={gameState.players[roundHuResult.winnerId!].name} />}
      {showEndGameModal && finalGameSummary && <EndGameModal summary={finalGameSummary} onRestartGame={handleNextHand} />}
      
      {actionOptions && gameState.lastDiscard && (
        <ActionMenu 
          discard={gameState.lastDiscard} 
          options={actionOptions} 
          onHu={() => handleGameEnd(0, 'ron', gameState.lastDiscard!, gameState.lastDiscarderIndex)} 
          onPong={() => performUserMeld('pong', gameState.players[0].hand.filter(t => t.symbol === gameState.lastDiscard!.symbol).slice(0, 2), gameState.lastDiscard!)} 
          onKong={() => performUserMeld('kong', gameState.players[0].hand.filter(t => t.symbol === gameState.lastDiscard!.symbol).slice(0, 3), gameState.lastDiscard!)} 
          onChow={ts => performUserMeld('chow', ts, gameState.lastDiscard!)} 
          onSkip={() => { setActionOptions(null); setGameState(prev => prev ? ({...prev, waitingForUserAction: false}) : null); checkForAllInteractions(gameState.lastDiscard!, gameState.lastDiscarderIndex, true); }} 
        />
      )}

      {/* 技能菜单 */}
      {gameState.currentPlayerIndex === 0 && !gameState.waitingForUserAction && (
          <SkillMenu 
            diamonds={diamonds} 
            onSelectSkill={handleSkillSelect} 
            disabled={activeSkillState !== null}
          />
      )}

      {/* 技能目标选择提示 */}
      {activeSkillState && activeSkillState.step === 'selecting_target' && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full font-bold animate-pulse shadow-lg z-50">
              请点击选择目标玩家
              <button onClick={() => setActiveSkillState(null)} className="ml-4 text-xs underline opacity-80">取消</button>
          </div>
      )}

      <header className="flex justify-between items-center p-3 bg-orange-950/40 backdrop-blur-md z-40 border-b border-orange-500/20 h-16 shadow-lg">
         <div className="flex items-center gap-4">
            <h1 className="text-yellow-400 font-bold text-lg tracking-widest text-shadow-glow">星星麻将</h1>
            <div className="text-xs text-orange-100 flex gap-4 items-center">
              <span>剩余牌数: <b className="text-white">{gameState.remainingTiles}</b></span>
              <span>风圈: <b className="text-white">{gameState.roundWind} {(gameState.roundNumber % 4) + 1}局</b></span>
              <span>庄家: <b className="text-white">{gameState.players[gameState.dealerId].name}</b></span>
              <span className="text-yellow-300 ml-4 flex items-center gap-1"><Diamond size={14} className="text-yellow-400" />金币: <b className="text-white">{playerGold}</b></span>
              <span className="text-cyan-300 ml-2 flex items-center gap-1"><Zap size={14} className="text-cyan-400" />钻石: <b className="text-white">{diamonds}</b></span>
              <span className="text-purple-300 ml-2 flex items-center gap-1">
                  <BrainCircuit size={14} className="text-purple-400" />
                  难度: <b className="text-white">{gameSettings.botDifficulty === 'easy' ? '流星' : gameSettings.botDifficulty === 'medium' ? '行星' : '恒星'}</b>
              </span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 bg-orange-800/50 rounded hover:bg-orange-700 transition text-white text-xs px-3 border border-orange-500/30 flex items-center gap-1">
               <Home size={14}/> 首页
            </button>
            <button onClick={() => { audioService.playClick(); setShowSettings(true); }} className="p-2 bg-orange-800/50 rounded hover:bg-orange-700 transition text-white text-xs px-3 border border-orange-500/30 flex items-center gap-1">
               <SettingsIcon size={14}/> 设置
            </button>
            <button onClick={() => setIsDebugMode(!isDebugMode)} className={`p-2 rounded transition border border-orange-500/30 ${isDebugMode ? 'bg-purple-600' : 'bg-orange-800/50 hover:bg-orange-700'}`}><Bug size={14} className="text-white"/></button>
            <button onClick={initGame} className="p-2 bg-orange-800/50 rounded hover:bg-orange-700 transition border border-orange-500/30"><RefreshCw size={14} className="text-white"/></button>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
          {/* 左侧边栏：采用虚化橘黄色风格 (Blurred Orange) */}
          <div className="w-80 p-4 hidden lg:flex flex-col z-20 overflow-y-auto gap-4 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-transparent bg-orange-600/30 backdrop-blur-xl border-r border-orange-500/20 shadow-2xl">
              <TileCounter counts={tileCounts} className="bg-black/20 border-white/10" />
              
              <AnalysisPanel 
                analysis={aiAnalysis} 
                loading={isAnalyzing} 
                onAnalyze={triggerAIAnalysis} 
                winningHints={winningHints}
                className="w-full shadow-lg border-white/10 bg-black/20"
              />

              <div className="flex-1 min-h-[200px] bg-black/20 rounded-xl p-3 border border-white/10 flex flex-col shadow-lg backdrop-blur-sm">
                <h3 className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-2 border-b border-white/10 pb-1 flex items-center gap-2">
                    <HistoryIcon size={14} /> 对局日志
                </h3>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar" ref={logContainerRef}>
                    {gameLog.map((log, i) => (
                        <div key={i} className="text-xs text-orange-50/80 border-b border-white/5 pb-1 last:border-0 leading-relaxed">
                            {log}
                        </div>
                    ))}
                </div>
              </div>
          </div>

          <main data-debug-id="main-area" className="flex-1 relative flex flex-col">
             {/* 技能特效层 - 移动到此处以相对于 main 区域定位 */}
             <SkillEffectLayer 
                effects={skillEffects} 
                onEffectComplete={(id) => setSkillEffects(prev => prev.filter(e => e.id !== id))} 
             />
             
             <div className="flex-1 relative">
                <div data-debug-id="player-area-top" className="absolute top-4 w-full flex justify-center">
                    <PlayerArea 
                        player={gameState.players[2]} 
                        isActive={gameState.currentPlayerIndex === 2} 
                        isTargetable={activeSkillState?.step === 'selecting_target'}
                        onTargetClick={() => handlePlayerTargetClick(2)}
                        damageState={damagedPlayers[2] || null}
                    />
                </div>
                <div data-debug-id="player-area-left" className="absolute top-[250px] left-4 h-auto flex items-center -translate-y-1/2">
                    <PlayerArea 
                        player={gameState.players[3]} 
                        isActive={gameState.currentPlayerIndex === 3} 
                        isTargetable={activeSkillState?.step === 'selecting_target'}
                        onTargetClick={() => handlePlayerTargetClick(3)}
                        damageState={damagedPlayers[3] || null}
                    />
                </div>
                <div data-debug-id="player-area-right" className="absolute top-[250px] right-4 h-auto flex items-center -translate-y-1/2">
                    <PlayerArea 
                        player={gameState.players[1]} 
                        isActive={gameState.currentPlayerIndex === 1} 
                        isTargetable={activeSkillState?.step === 'selecting_target'}
                        onTargetClick={() => handlePlayerTargetClick(1)}
                        damageState={damagedPlayers[1] || null}
                    />
                </div>
                <DiscardPiles players={gameState.players} />
                
                {/* 调整中央风位指示器：顺时针 西-北-东-南 */}
                <div data-debug-id="center-wind-area" className="absolute top-[250px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-950/80 rounded-3xl border-8 border-yellow-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    {/* 中间显示圈风 */}
                    <div className="text-5xl text-yellow-500 font-bold drop-shadow-lg font-serif">{gameState.roundWind}</div>
                    
                    {/* 当前玩家指示边框 - 加宽到 border-8, 调整 inset 为 -2 */}
                    <div className={`absolute -inset-2 rounded-3xl border-8 transition-all duration-300 
                      ${gameState.currentPlayerIndex === 0 ? 'border-b-yellow-400' : 
                        gameState.currentPlayerIndex === 1 ? 'border-r-yellow-400' : 
                        gameState.currentPlayerIndex === 2 ? 'border-t-yellow-400' : 
                        'border-l-yellow-400'}
                    `}></div>
                    
                    {/* 座位风指示器 - 字体向外 (字头朝向中心) */}
                    
                    {/* 下方 (Player 0): 正常显示 (字头向上，即朝向中心) */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-black text-orange-200/60 text-2xl select-none">
                        {windMap[gameState.players[0].seatWind]}
                    </div>
                    
                    {/* 右方 (Player 1): 旋转-90度 (字头向左，即朝向中心) */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 font-black text-orange-200/60 text-2xl select-none -rotate-90 origin-center">
                        {windMap[gameState.players[1].seatWind]}
                    </div>
                    
                    {/* 上方 (Player 2): 旋转180度 (字头向下，即朝向中心) */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 font-black text-orange-200/60 text-2xl select-none rotate-180">
                        {windMap[gameState.players[2].seatWind]}
                    </div>
                    
                    {/* 左方 (Player 3): 旋转90度 (字头向右，即朝向中心) */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 font-black text-orange-200/60 text-2xl select-none rotate-90 origin-center">
                        {windMap[gameState.players[3].seatWind]}
                    </div>
                </div>
             </div>
             <div data-debug-id="player-hand-container" className="h-64 bg-gradient-to-t from-orange-950/90 to-transparent flex flex-col justify-end pb-8 px-4 z-30">
                <div className="max-w-5xl mx-auto w-full flex flex-col items-center gap-4">
                    <div data-debug-id="meld-area-bottom" className="flex gap-4 self-start ml-12 opacity-90">{gameState.players[0].melds.map((m, i) => <div key={i} className="flex gap-0.5 bg-black/40 p-1.5 rounded-lg border border-white/10">{m.tiles.map((t, ti) => <MahjongTile key={t.id} tile={t} size="sm" hidden={m.type === 'angang' && (ti === 0 || ti === 3)} />)}</div>)}</div>
                    <div className="flex items-end gap-1 w-full justify-center">
                      {gameState.players[0].hand.map((tile, i) => (
                        <MahjongTile 
                          key={tile.id} 
                          tile={tile} 
                          size="lg" 
                          selected={selectedTileIndex === i} 
                          highlight={tile.symbol === aiAnalysis?.recommendedDiscard} 
                          onClick={() => gameState.currentPlayerIndex === 0 && !gameState.waitingForUserAction ? setSelectedTileIndex(i) : null} 
                          className={`cursor-pointer hover:-translate-y-4 transition-transform shadow-2xl ${
                            (i === gameState.players[0].hand.length - 1 && gameState.players[0].hand.length % 3 === 2) ? 'ml-6' : ''
                          }`} 
                        />
                      ))}
                    </div>
                    <div className="h-10 flex items-center gap-4">
                        {selfActionOptions.map((opt, i) => <button key={i} onClick={() => opt.type === 'ankan' ? performUserMeld('angang', opt.tiles) : performUserKakan(opt.tile, opt.meldIndex)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2"><Zap size={14}/> {opt.type === 'ankan' ? '暗杠' : '加杠'}</button>)}
                        {gameState.currentPlayerIndex === 0 && selectedTileIndex !== null && !gameState.waitingForUserAction && selfActionOptions.length === 0 && <button onClick={() => handleDiscard(selectedTileIndex)} className="px-12 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl transition-all">打出</button>}
                        {gameState.currentPlayerIndex !== 0 && <div className="text-orange-200 text-xs font-bold tracking-widest uppercase animate-pulse drop-shadow-md">对手思考中...</div>}
                    </div>
                </div>
             </div>
          </main>
          {isDebugMode && (
            <>
              <DebugOverlay selector={debugTarget} label={DEBUG_TARGETS.find(t => t.selector === debugTarget)?.label || ''} />
              <DebugPanel targets={DEBUG_TARGETS} currentTarget={debugTarget} onTargetChange={setDebugTarget} />
            </>
          )}
      </div>
    </div>
  );
};

export default App;
