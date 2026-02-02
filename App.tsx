import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateDeck, INITIAL_HAND_SIZE, STARTING_GOLD, BASE_FAN_VALUE, ROUND_WINDS } from './constants';
import { Player, GameState, Tile, AIAnalysisResult, ActionOptions, Meld, HuResult, BotDifficulty, GameSettings, PlayerHistory } from './types';
import { shuffleDeck, sortHand, checkCanPong, checkCanKong, checkCanChow, checkCanHu, calculateTileCounts, getBotDiscard, shouldBotMeld, getLocalMahjongStrategy, calculateHandFans } from './utils';
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

import { RefreshCw, Bug, Trophy, Zap, Settings as SettingsIcon, Diamond } from 'lucide-react';

type SelfActionOption = 
    | { type: 'ankan'; tiles: Tile[] }
    | { type: 'kakan'; tile: Tile; meldIndex: number };

interface InteractionEffect {
  type: '碰' | '杠' | '吃' | '胡' | '自摸';
  playerName: string;
}

const DEBUG_TARGETS = [
    { label: 'Table: Main Area', selector: '[data-debug-id="main-area"]' },
    { label: 'Table: Center Wind', selector: '[data-debug-id="center-wind-area"]' },
    { label: 'Discard: Bottom', selector: '[data-debug-id="discard-pile-bottom"]' },
    { label: 'Discard: Top', selector: '[data-debug-id="discard-pile-top"]' },
    { label: 'Discard: Left', selector: '[data-debug-id="discard-pile-left"]' },
    { label: 'Discard: Right', selector: '[data-debug-id="discard-pile-right"]' },
    { label: 'Bottom: Hand Container', selector: '[data-debug-id="player-hand-container"]' },
    { label: 'Bottom: Meld Area', selector: '[data-debug-id="meld-area-bottom"]' },
    { label: 'Top: Info Badge', selector: '[data-debug-id="player-info-top"]' },
    { label: 'Left: Info Badge', selector: '[data-debug-id="player-info-left"]' },
    { label: 'Right: Info Badge', selector: '[data-debug-id="player-info-right"]' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'game' | 'settings'>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<ActionOptions | null>(null);
  const [selfActionOptions, setSelfActionOptions] = useState<SelfActionOption[]>([]);
  const [tileCounts, setTileCounts] = useState<Record<string, number>>({});
  const [interactionEffect, setInteractionEffect] = useState<InteractionEffect | null>(null);
  
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugTarget, setDebugTarget] = useState(DEBUG_TARGETS[0].selector);

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

  const [panelPosition, setPanelPosition] = useState({ x: window.innerWidth - 320 - 16, y: 80 });
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: panelPosition.x, initialY: panelPosition.y });
  const logEndRef = useRef<HTMLDivElement>(null);

  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const savedSettings = localStorage.getItem('mahjongGameSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      baseFanValue: BASE_FAN_VALUE,
      playerInitialGold: STARTING_GOLD,
      botDifficulty: BotDifficulty.HARD,
    };
  });

  const [playerGold, setPlayerGold] = useState<number>(() => {
    const savedGold = localStorage.getItem('mahjongPlayerGold');
    return savedGold ? JSON.parse(savedGold) : STARTING_GOLD;
  });

  const [playerHistory, setPlayerHistory] = useState<PlayerHistory>(() => {
    const savedHistory = localStorage.getItem('mahjongPlayerHistory');
    return savedHistory ? JSON.parse(savedHistory) : {
      totalWins: 0,
      totalGoldEarned: 0,
      maxFanWin: 0,
      maxFanHand: null,
      suggestions: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('mahjongGameSettings', JSON.stringify(gameSettings));
  }, [gameSettings]);

  useEffect(() => {
    localStorage.setItem('mahjongPlayerGold', JSON.stringify(playerGold));
  }, [playerGold]);

  useEffect(() => {
    localStorage.setItem('mahjongPlayerHistory', JSON.stringify(playerHistory));
  }, [playerHistory]);

  const handlePanelDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragInfo.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: panelPosition.x, initialY: panelPosition.y };
    window.addEventListener('mousemove', handlePanelDragging);
    window.addEventListener('mouseup', handlePanelDragEnd);
  };

  const handlePanelDragging = (e: MouseEvent) => {
    if (!dragInfo.current.isDragging) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    const newX = Math.max(0, Math.min(dragInfo.current.initialX + dx, window.innerWidth - 320));
    const newY = Math.max(0, Math.min(dragInfo.current.initialY + dy, window.innerHeight - 200));
    setPanelPosition({ x: newX, y: newY });
  };

  const handlePanelDragEnd = () => {
    dragInfo.current = { isDragging: false, startX: 0, startY: 0, initialX: panelPosition.x, initialY: panelPosition.y };
    window.removeEventListener('mousemove', handlePanelDragging);
    window.removeEventListener('mouseup', handlePanelDragEnd);
  };

  const triggerInteractionEffect = (type: InteractionEffect['type'], playerName: string) => {
    setInteractionEffect({ type, playerName });
    setTimeout(() => setInteractionEffect(null), 1200);
  };

  const startNewRound = useCallback((currentDealerId: number, currentRoundNumber: number, currentHonbaNumber: number) => {
    const deck = shuffleDeck(generateDeck());
    const players: Player[] = [
      { id: 0, name: '玩家', position: 'bottom', hand: [], discards: [], melds: [], score: 0, gold: playerGold, seatWind: 'E' },
      { id: 1, name: '机器人右', position: 'right', hand: [], discards: [], melds: [], score: 0, gold: Math.floor(Math.random() * 10000) + 20000, seatWind: 'S' },
      { id: 2, name: '机器人上', position: 'top', hand: [], discards: [], melds: [], score: 0, gold: Math.floor(Math.random() * 10000) + 20000, seatWind: 'W' },
      { id: 3, name: '机器人左', position: 'left', hand: [], discards: [], melds: [], score: 0, gold: Math.floor(Math.random() * 10000) + 20000, seatWind: 'N' },
    ];
    
    const dealerSeatIndex = players.findIndex(p => p.id === currentDealerId);
    if (dealerSeatIndex !== -1) {
        players[dealerSeatIndex].seatWind = 'E';
        players[(dealerSeatIndex + 1) % 4].seatWind = 'S';
        players[(dealerSeatIndex + 2) % 4].seatWind = 'W';
        players[(dealerSeatIndex + 3) % 4].seatWind = 'N';
    }

    for (let i = 0; i < INITIAL_HAND_SIZE; i++) players.forEach(p => p.hand.push(deck.pop()!));
    players.forEach(p => p.hand = sortHand(p.hand));
    players[currentDealerId].hand.push(deck.pop()!);

    const newState: GameState = { 
      players, 
      currentPlayerIndex: currentDealerId,
      wall: deck, 
      roundWind: ROUND_WINDS[currentRoundNumber % 4],
      remainingTiles: deck.length, 
      isGameOver: false, 
      winnerId: null, 
      winType: null, 
      lastDiscard: null, 
      lastDiscarderIndex: -1, 
      waitingForUserAction: false,
      dealerId: currentDealerId,
      roundNumber: currentRoundNumber,
      honbaNumber: currentHonbaNumber,
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
    setCurrentView('game');

    // 如果机器人是庄家，触发首回合出牌
    if (currentDealerId !== 0) {
      setTimeout(() => {
        performBotDiscard(currentDealerId);
      }, 1500);
    }
  }, [playerGold]);

  const initGame = useCallback(() => {
    startNewRound(0, 0, 0); 
  }, [startNewRound]);

  useEffect(() => { 
    if (currentView === 'game' && !gameState) {
        initGame(); 
    }
  }, [currentView, gameState, initGame]);
  
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameLog]);

  useEffect(() => {
    if (!gameState) return;
    const allDiscards = gameState.players.flatMap(p => p.discards);
    const allMelds = gameState.players.flatMap(p => p.melds.flatMap(m => m.tiles));
    setTileCounts(calculateTileCounts(allDiscards, allMelds, gameState.players[0].hand));
  }, [gameState]);

  const checkForSelfActions = useCallback((player: Player) => {
    const options: SelfActionOption[] = [];
    const handCounts: Record<string, Tile[]> = {};
    player.hand.forEach(t => {
        if (!handCounts[t.symbol]) handCounts[t.symbol] = [];
        handCounts[t.symbol].push(t);
    });

    for (const symbol in handCounts) {
        if (handCounts[symbol].length === 4) {
            options.push({ type: 'ankan', tiles: handCounts[symbol] });
        }
    }

    if (player.hand.length % 3 === 2) {
      const drawnTile = player.hand[player.hand.length - 1];
      player.melds.forEach((meld, meldIndex) => {
          if (meld.type === 'pong' && meld.tiles[0].symbol === drawnTile.symbol) {
              options.push({ type: 'kakan', tile: drawnTile, meldIndex });
          }
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
    const allDiscards = gameState.players.flatMap(p => p.discards);
    const allMelds = gameState.players.flatMap(p => p.melds.flatMap(m => m.tiles));
    
    const analysis = getLocalMahjongStrategy(
      gameState.players[0].hand, 
      allDiscards, 
      allMelds, 
      gameState.roundWind, 
      gameState.players[0].seatWind 
    );
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const settleRound = useCallback((huResult: HuResult, winningPlayerId: number | null, winType: 'ron' | 'tsumo' | null, discarderId: number | null, finalPlayers: Player[]) => {
    if (!gameState) return;

    let goldChanges: { id: number; change: number }[] = finalPlayers.map(p => ({ id: p.id, change: 0 }));
    let totalWinGold = 0;
    
    if (huResult.isHu) {
      totalWinGold = Math.max(1, huResult.totalFan) * gameSettings.baseFanValue;

      if (winType === 'tsumo' && winningPlayerId !== null) {
        // 自摸结算：三家各付全额奖金
        goldChanges[winningPlayerId].change += totalWinGold * 3;
        for (const player of finalPlayers) {
          if (player.id !== winningPlayerId) {
            goldChanges[player.id].change -= totalWinGold; 
          }
        }
      } else if (winType === 'ron' && winningPlayerId !== null && discarderId !== null) {
        goldChanges[winningPlayerId].change += totalWinGold;
        goldChanges[discarderId].change -= totalWinGold;
      }

      if (winningPlayerId === 0) {
        setPlayerHistory(prev => ({
          ...prev,
          totalWins: prev.totalWins + 1,
          totalGoldEarned: prev.totalGoldEarned + goldChanges[0].change,
          maxFanWin: Math.max(prev.maxFanWin, huResult.totalFan),
          maxFanHand: (huResult.totalFan > prev.maxFanWin) ? finalPlayers[0].hand.concat(finalPlayers[0].melds.flatMap(m => m.tiles)) : prev.maxFanHand,
        }));
      }
    }

    const updatedPlayers = finalPlayers.map(p => {
        const change = goldChanges.find(gc => gc.id === p.id)?.change || 0;
        let newGold = p.gold + change;
        if (p.id !== 0 && newGold < 0) newGold = 0; 
        return { ...p, gold: newGold };
    });

    const player0NewGold = updatedPlayers.find(p => p.id === 0)?.gold || playerGold;
    setPlayerGold(player0NewGold);

    setFinalGameSummary({
      winnerName: winningPlayerId !== null ? finalPlayers[winningPlayerId].name : '无',
      winType,
      allPlayersHands: updatedPlayers.map(p => ({ ...p, hand: sortHand([...p.hand]) })), 
      winningTile: huResult.winningTile,
      winnerId: winningPlayerId,
      huResult: huResult,
      playerGoldChanges: goldChanges,
    });
    
    let nextDealerId = gameState.dealerId;
    let nextRoundNumber = gameState.roundNumber;
    let nextHonbaNumber = gameState.honbaNumber;

    if (winningPlayerId === gameState.dealerId || (!huResult.isHu)) {
      nextHonbaNumber++;
    } else {
      nextDealerId = (gameState.dealerId + 1) % 4;
      nextRoundNumber++;
      nextHonbaNumber = 0;
    }

    if (nextRoundNumber >= 4) { 
        nextRoundNumber = 0; 
        setGameLog(l => [...l, "新一圈牌局开始!"]);
    }
    
    setGameState(prev => prev ? { 
        ...prev, 
        isGameOver: true, 
        winnerId: winningPlayerId, 
        winType, 
        waitingForUserAction: false,
        players: updatedPlayers,
        dealerId: nextDealerId,
        roundNumber: nextRoundNumber,
        honbaNumber: nextHonbaNumber,
    } : null);

    setTimeout(() => {
        setShowEndGameModal(true);
        setShowFanDisplayOverlay(false);
    }, huResult.isHu ? 3000 : 0);
  }, [gameState, playerGold, gameSettings.baseFanValue]);

  const handleGameEnd = (winnerId: number | null, winType: 'ron' | 'tsumo' | null, finalWinningTile: Tile | null, discarderId: number | null = null) => {
    if (winnerId !== null) {
      triggerInteractionEffect(winType === 'tsumo' ? '自摸' : '胡', gameState?.players[winnerId].name || '');
    }
    
    setGameState(prev => {
        if (!prev) return null;

        const playersForAnalysis = prev.players.map(p => ({ ...p }));
        if (winType === 'ron' && finalWinningTile && winnerId !== null) {
            const winner = playersForAnalysis.find(p => p.id === winnerId);
            if (winner) {
                winner.hand.push(finalWinningTile); 
            }
        }
        
        const winningPlayer = winnerId !== null ? playersForAnalysis[winnerId] : null;
        
        let huResult: HuResult = {
            isHu: false, fanList: [], totalFan: 0, meetsMinFan: false,
            huType: winType, winningTile: finalWinningTile, winnerId
        };

        if (winningPlayer && winnerId !== null && finalWinningTile) {
          const allTilesInWinningHand = winningPlayer.hand.concat(winningPlayer.melds.flatMap(m => m.tiles));
          const allDiscards = prev.players.flatMap(p => p.discards);
          const allPlayersMelds = prev.players.flatMap(p => p.melds);

          huResult = calculateHandFans(
            allTilesInWinningHand, 
            winningPlayer.melds,
            finalWinningTile,
            winType === 'tsumo',
            winType === 'ron',
            prev.roundWind,
            winningPlayer.seatWind,
            allDiscards,
            allPlayersMelds,
            winnerId
          );
        }

        setRoundHuResult(huResult);

        if (huResult.isHu) {
            setGameLog(l => [...l, `${winningPlayer?.name} 胡牌! (${huResult.totalFan}番)`]);
            setShowFanDisplayOverlay(true); 
            settleRound(huResult, winnerId, winType, discarderId, playersForAnalysis);
            return { ...prev, isGameOver: true, winnerId, winType, waitingForUserAction: false };
        } else {
            setGameLog(l => [...l, "本局流局!"]);
            settleRound(huResult, null, null, null, playersForAnalysis);
            return { ...prev, isGameOver: true, winnerId: null, winType: null, waitingForUserAction: false };
        }
    });
  };

  const handleDraw = (playerIndex: number) => {
    setGameState(prev => {
      if (!prev || prev.isGameOver) return prev;
      const deck = [...prev.wall];
      if (deck.length === 0) {
        setGameLog(l => [...l, "牌山摸完，本局流局!"]);
        handleGameEnd(null, null, null);
        return { ...prev, isGameOver: true }; 
      }
      const tile = deck.pop()!;
      const players = [...prev.players];
      players[playerIndex].hand.push(tile);
      
      const player = players[playerIndex];
      if (checkCanHu(player.hand.slice(0, -1), player.melds, tile)) {
          handleGameEnd(playerIndex, 'tsumo', tile);
          return { ...prev, wall: deck, remainingTiles: deck.length, players }; 
      }

      return { ...prev, wall: deck, remainingTiles: deck.length, players };
    });
  };

  const handleDiscard = (index: number) => {
    if (!gameState) return;
    const newPlayers = [...gameState.players];
    const tile = newPlayers[0].hand.splice(index, 1)[0];
    newPlayers[0].hand = sortHand(newPlayers[0].hand);
    newPlayers[0].discards.push(tile);
    setGameState(prev => prev ? ({ ...prev, players: newPlayers, lastDiscard: tile, lastDiscarderIndex: 0, waitingForUserAction: false }) : null);
    setGameLog(l => [...l, `您打出 ${tile.symbol}`]);
    setSelectedTileIndex(null);
    setAiAnalysis(null);
    setTimeout(() => checkForAllInteractions(tile, 0), 1000);
  };

  const performBotDiscard = (botIndex: number) => {
    setGameState(current => {
      if (!current || current.isGameOver) return current;
      const players = [...current.players];
      const bot = players[botIndex];
      if (bot.hand.length % 3 !== 2) return current; // 确保牌数正确

      const discard = getBotDiscard(bot.hand, current.roundWind, bot.seatWind, gameSettings.botDifficulty);
      const idx = bot.hand.findIndex(t => t.id === discard.id);
      const [tile] = bot.hand.splice(idx > -1 ? idx : 0, 1);
      bot.discards.push(tile);
      bot.hand = sortHand(bot.hand);
      
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
                    setActionOptions({ canPong: false, canKong: false, canChow: false, canHu: true, chowOptions: [] });
                    return { ...prev, waitingForUserAction: true };
                } else {
                    handleGameEnd(i, 'ron', discard, discarderIndex);
                    return { ...prev }; 
                }
            }
        }

        if (discarderIndex !== 0 && !userJustSkipped) {
            const canPong = checkCanPong(prev.players[0].hand, discard);
            const canKong = checkCanKong(prev.players[0].hand, discard);
            const isLeft = ((discarderIndex + 1) % 4 === 0);
            const chowOptions = isLeft ? checkCanChow(prev.players[0].hand, discard) : [];
            if (canPong || canKong || chowOptions.length > 0) {
                setActionOptions({ canPong, canKong: canKong, canChow: chowOptions.length > 0, canHu: false, chowOptions });
                return { ...prev, waitingForUserAction: true };
            }
        }

        for (let i = 1; i < 4; i++) {
            if (i === discarderIndex) continue;
            if (checkCanPong(prev.players[i].hand, discard) && shouldBotMeld(prev.players[i].hand, discard, 'pong', gameSettings.botDifficulty)) {
                triggerInteractionEffect('碰', prev.players[i].name);
                setGameLog(l => [...l, `${prev.players[i].name} 碰!`]);
                performBotMeld(i, 'pong', discard, discarderIndex);
                return prev; 
            }
            if (checkCanKong(prev.players[i].hand, discard) && shouldBotMeld(prev.players[i].hand, discard, 'kong', gameSettings.botDifficulty)) { 
                triggerInteractionEffect('杠', prev.players[i].name);
                setGameLog(l => [...l, `${prev.players[i].name} 杠!`]);
                performBotMeld(i, 'kong', discard, discarderIndex);
                return prev;
            }
            const botChowOptions = checkCanChow(prev.players[i].hand, discard);
            if ((i === (discarderIndex + 1) % 4) && botChowOptions.length > 0 && shouldBotMeld(prev.players[i].hand, discard, 'chow', gameSettings.botDifficulty)) {
              triggerInteractionEffect('吃', prev.players[i].name);
              setGameLog(l => [...l, `${prev.players[i].name} 吃!`]);
              performBotMeld(i, 'chow', discard, discarderIndex, botChowOptions[0]);
              return prev;
            }
        }

        const nextPlayerIdx = (discarderIndex + 1) % 4;
        setTimeout(() => {
           handleDraw(nextPlayerIdx);
           if (nextPlayerIdx !== 0) {
               setTimeout(() => performBotDiscard(nextPlayerIdx), 800);
           } else {
               setGameState(s => s ? ({...s, currentPlayerIndex: 0}) : null);
           }
        }, 800);

        return { ...prev, currentPlayerIndex: (discarderIndex + 1) % 4 };
    });
  };

  const performBotMeld = (botIdx: number, type: 'pong' | 'chow' | 'kong', discard: Tile, fromIdx: number, chowTiles?: Tile[]) => {
    setGameState(prev => {
        if (!prev) return null;
        const players = [...prev.players];
        const bot = players[botIdx];
        
        let tilesToMeld: Tile[] = [];
        let tilesInHandToRemove: Tile[] = [];
        let isConcealedMeld = false;

        if (type === 'pong') {
            tilesInHandToRemove = bot.hand.filter(t => t.symbol === discard.symbol).slice(0, 2);
            tilesToMeld = [...tilesInHandToRemove, discard];
        } else if (type === 'kong') {
            tilesInHandToRemove = bot.hand.filter(t => t.symbol === discard.symbol).slice(0, 3);
            tilesToMeld = [...tilesInHandToRemove, discard];
            isConcealedMeld = false;
        } else if (type === 'chow' && chowTiles) {
            tilesInHandToRemove = chowTiles;
            tilesToMeld = [...chowTiles, discard];
        } else {
          return prev; 
        }

        bot.hand = bot.hand.filter(t => !tilesInHandToRemove.some(r => r.id === t.id)); 
        bot.melds.push({ type, tiles: sortHand(tilesToMeld), fromPlayer: fromIdx, isConcealed: isConcealedMeld });
        players[fromIdx].discards.pop();
        
        let wall = [...prev.wall];
        let remainingTiles = prev.remainingTiles;
        if (type === 'kong' && wall.length > 0) {
            bot.hand.push(wall.pop()!); 
            remainingTiles = wall.length;
        }

        setTimeout(() => performBotDiscard(botIdx), 1200); 
        return { ...prev, players, wall, remainingTiles, currentPlayerIndex: botIdx, lastDiscard: null, waitingForUserAction: false };
    });
  };

  const performUserMeld = (type: Meld['type'], tilesInHandForMeld: Tile[], discard?: Tile) => { 
    if (!gameState) return;
    triggerInteractionEffect(type === 'angang' ? '杠' : type === 'pong' ? '碰' : type === 'kong' ? '杠' : '吃', '玩家');
    
    setGameState(prev => {
        if (!prev) return null;
        const players = [...prev.players];
        const player = players[0]; // 修正：玩家索引固定为 0
        const idsToRemove = tilesInHandForMeld.map(t => t.id); 
        player.hand = player.hand.filter(t => !idsToRemove.includes(t.id));

        const finalTiles = discard ? [...tilesInHandForMeld, discard] : tilesInHandForMeld;
        const fromPlayer = discard ? prev.lastDiscarderIndex : 0; // 修正：玩家索引固定为 0
        if (discard) players[fromPlayer].discards.pop();
        
        player.melds.push({ type, tiles: sortHand(finalTiles), fromPlayer, isConcealed: type === 'angang' });
        setGameLog(l => [...l, `您 ${type === 'angang' ? '暗杠' : type === 'pong' ? '碰' : type === 'kong' ? '杠' : '吃'}!`]);

        let wall = [...prev.wall];
        let remainingTiles = prev.remainingTiles;
        if ((type === 'kong' || type === 'angang') && wall.length > 0) {
            player.hand.push(wall.pop()!);
            remainingTiles = wall.length;
        }

        return {
            ...prev,
            players,
            wall,
            remainingTiles,
            currentPlayerIndex: 0,
            waitingForUserAction: false,
            lastDiscard: null,
        };
    });
    
    setActionOptions(null);
    setSelfActionOptions([]);
    setAiAnalysis(null);
  };
  
  const performUserKakan = (tile: Tile, meldIndex: number) => {
    if (!gameState) return;
    triggerInteractionEffect('杠', '玩家');
    setGameState(prev => {
        if (!prev) return null;
        const players = [...prev.players];
        const player = players[0];
        player.hand = player.hand.filter(t => t.id !== tile.id);
        const meld = player.melds[meldIndex];
        meld.tiles.push(tile);
        meld.type = 'kong';
        meld.isConcealed = false;
        meld.tiles = sortHand(meld.tiles);
        setGameLog(l => [...l, `您 加杠!`]);
        let wall = [...prev.wall];
        let remainingTiles = prev.remainingTiles;
        if (wall.length > 0) {
          player.hand.push(wall.pop()!); 
          remainingTiles = wall.length;
        }
        return { ...prev, players, wall, remainingTiles, currentPlayerIndex: 0, waitingForUserAction: false };
    });
    setSelfActionOptions([]);
  };

  const handleRestartGame = useCallback(() => {
    if (gameState) {
        startNewRound(gameState.dealerId, gameState.roundNumber, gameState.honbaNumber);
    } else {
        initGame();
    }
  }, [gameState, startNewRound, initGame]);

  if (currentView === 'home') {
    return (
      <HomePage 
        onStartGame={initGame} 
        onOpenSettings={() => setCurrentView('settings')}
        playerHistory={playerHistory}
        playerGold={playerGold}
      />
    );
  }

  if (currentView === 'settings') {
    return (
      <GameSettingsModal
        settings={gameSettings}
        onSave={(newSettings) => {
          setGameSettings(newSettings);
          setCurrentView('home');
        }}
        onCancel={() => setCurrentView('home')}
        playerGold={playerGold}
        setPlayerGold={setPlayerGold}
      />
    );
  }

  if (!gameState) return <div className="h-screen bg-green-900 flex items-center justify-center text-white">引擎启动中...</div>;

  return (
    <div className="h-screen bg-[#1e3a1b] font-sans flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
      
      {/* 互动特效 Overlay */}
      {interactionEffect && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center pointer-events-none overflow-hidden">
           <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <div className="text-[12rem] font-calligraphy text-yellow-500 drop-shadow-[0_0_40px_rgba(234,179,8,0.8)] leading-none select-none">
                {interactionEffect.type}
              </div>
              <div className="text-2xl font-black text-white bg-black/50 px-6 py-2 rounded-full mt-4 backdrop-blur-sm border border-white/20">
                {interactionEffect.playerName}
              </div>
           </div>
        </div>
      )}

      {showFanDisplayOverlay && roundHuResult && (
        <FanDisplayOverlay 
          huResult={roundHuResult} 
          winnerName={gameState.players.find(p => p.id === roundHuResult?.winnerId)?.name || '未知'}
        />
      )}

      {showEndGameModal && finalGameSummary && (
        <EndGameModal summary={finalGameSummary} onRestartGame={handleRestartGame} />
      )}

      {actionOptions && gameState.lastDiscard && (
        <ActionMenu 
          discard={gameState.lastDiscard} 
          options={actionOptions} 
          onHu={() => handleGameEnd(0, 'ron', gameState.lastDiscard!, gameState.lastDiscarderIndex)} 
          onPong={() => performUserMeld('pong', gameState.players[0].hand.filter(t => t.symbol === gameState.lastDiscard!.symbol).slice(0, 2), gameState.lastDiscard!)} 
          onKong={() => performUserMeld('kong', gameState.players[0].hand.filter(t => t.symbol === gameState.lastDiscard!.symbol).slice(0, 3), gameState.lastDiscard!)} 
          onChow={ts => performUserMeld('chow', ts, gameState.lastDiscard!)} 
          onSkip={() => { setActionOptions(null); setGameState(prev => prev ? {...prev, waitingForUserAction: false} : null); checkForAllInteractions(gameState.lastDiscard!, gameState.lastDiscarderIndex, true); }} 
        />
      )}

      <header className="flex justify-between items-center p-3 bg-black/40 backdrop-blur-sm z-40 border-b border-white/5 h-16">
         <div className="flex items-center gap-4">
            <h1 className="text-yellow-500 font-bold text-lg tracking-widest text-shadow-glow">無双麻将</h1>
            <div className="text-xs text-gray-300 flex gap-4">
              <span>剩余牌数: <b className="text-white">{gameState.remainingTiles}</b></span>
              <span>
                风圈: <b className="text-white">{gameState.roundWind} {gameState.roundNumber + 1}局</b>
              </span>
              <span>
                庄家: <b className="text-white">{gameState.players[gameState.dealerId].name} {gameState.honbaNumber > 0 && `(+${gameState.honbaNumber})`}</b>
              </span>
              <span className="text-yellow-300 ml-4 flex items-center gap-1">
                <Diamond size={14} className="text-yellow-400" />我的金币: <b className="text-white">{playerGold}</b>
              </span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView('home')} className="p-2 bg-gray-700/50 rounded hover:bg-gray-600 transition text-white text-xs px-3">首页</button>
            <button onClick={() => setCurrentView('settings')} className="p-2 bg-gray-700/50 rounded hover:bg-gray-600 transition"><SettingsIcon size={14} className="text-white"/></button>
            <button onClick={() => setIsDebugMode(prev => !prev)} className={`p-2 rounded transition ${isDebugMode ? 'bg-purple-600' : 'bg-gray-700/50 hover:bg-gray-600'}`}><Bug size={14} className="text-white"/></button>
            <button onClick={initGame} className="p-2 bg-gray-700/50 rounded hover:bg-gray-600 transition"><RefreshCw size={14} className="text-white"/></button>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
          <div className="w-64 p-4 hidden lg:flex flex-col z-10 overflow-y-auto">
            <TileCounter counts={tileCounts} />
            <div className="mt-4 flex-1 bg-black/20 rounded-xl p-2 overflow-hidden flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">对局历史</span>
              <div className="flex-1 overflow-y-auto text-xs text-gray-300 space-y-1">
                {gameLog.map((l, i) => <div key={i} className="border-b border-white/5 pb-1">{l}</div>)}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          <main data-debug-id="main-area" className="flex-1 relative flex flex-col">
             <div className="flex-1 relative">
                <div data-debug-id="player-area-top" className="absolute top-4 w-full flex justify-center"><PlayerArea player={gameState.players[2]} isActive={gameState.currentPlayerIndex === 2} /></div>
                <div data-debug-id="player-area-left" className="absolute top-[250px] left-4 h-auto flex items-center -translate-y-1/2"><PlayerArea player={gameState.players[3]} isActive={gameState.currentPlayerIndex === 3} /></div>
                <div data-debug-id="player-area-right" className="absolute top-[250px] right-4 h-auto flex items-center -translate-y-1/2"><PlayerArea player={gameState.players[1]} isActive={gameState.currentPlayerIndex === 1} /></div>
                
                <DiscardPiles players={gameState.players} />

                <div data-debug-id="center-wind-area" className="absolute top-[250px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#142813] rounded-3xl border-4 border-[#2d5a27] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center z-20">
                    <div className="text-5xl text-yellow-600 font-bold drop-shadow-lg">{gameState.roundWind}</div>
                    <div className="text-[10px] text-green-400 uppercase tracking-widest mt-1 opacity-70">场风</div>
                    
                    <div className={`absolute -inset-1 rounded-3xl border-4 transition-all duration-300 
                      ${gameState.currentPlayerIndex === 0 ? 'border-b-yellow-400 border-t-transparent border-x-transparent shadow-[0_10px_10px_-5px_rgba(250,204,21,0.4)]' : 
                        gameState.currentPlayerIndex === 1 ? 'border-r-yellow-400 border-l-transparent border-y-transparent shadow-[10px_0_10px_-5px_rgba(250,204,21,0.4)]' : 
                        gameState.currentPlayerIndex === 2 ? 'border-t-yellow-400 border-b-transparent border-x-transparent shadow-[0_-10px_10px_-5px_rgba(250,204,21,0.4)]' : 
                        'border-l-yellow-400 border-r-transparent border-y-transparent shadow-[-10px_0_10px_-5px_rgba(250,204,21,0.4)]'}
                    `}></div>
                </div>
             </div>

             <div data-debug-id="player-hand-container" className="h-64 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end pb-8 px-4 z-30">
                <div className="max-w-5xl mx-auto w-full flex flex-col items-center gap-4">
                    <div data-debug-id="meld-area-bottom" className="flex gap-4 self-start ml-12 opacity-90">
                      {gameState.players[0].melds.map((meld, i) => (
                        <div key={i} className="flex gap-0.5 bg-black/40 p-1.5 rounded-lg border border-white/10 shadow-lg">
                          {meld.tiles.map((t, tileIdx) => 
                            <MahjongTile key={t.id} tile={t} size="sm" hidden={meld.type === 'angang' && (tileIdx === 0 || tileIdx === 3)} />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-end gap-1 w-full justify-center">
                      {gameState.players[0].hand.map((tile, i) => (
                        <div key={tile.id} className={`relative group ${gameState.currentPlayerIndex === 0 && i === gameState.players[0].hand.length - 1 && gameState.players[0].hand.length % 3 === 2 ? 'ml-6' : ''}`}>
                          <MahjongTile 
                            tile={tile} 
                            size="lg" 
                            selected={selectedTileIndex === i} 
                            highlight={tile.symbol === aiAnalysis?.recommendedDiscard} 
                            onClick={() => (gameState.currentPlayerIndex === 0 && !gameState.waitingForUserAction) ? setSelectedTileIndex(i) : null} 
                            className="cursor-pointer hover:-translate-y-4 transition-transform shadow-2xl" 
                          />
                        </div>
                      ))}
                    </div>

                    <div className="h-10 flex items-center gap-4">
                        {selfActionOptions.length > 0 && (
                            selfActionOptions.map((opt, i) => {
                                if (opt.type === 'ankan') {
                                    return <button key={i} onClick={() => performUserMeld('angang', opt.tiles)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2"><Zap size={14}/> 暗杠</button>
                                }
                                if (opt.type === 'kakan') {
                                    return <button key={i} onClick={() => performUserKakan(opt.tile, opt.meldIndex)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-bold text-xs uppercase flex items-center gap-2"><Zap size={14}/> 加杠</button>
                                }
                                return null;
                            })
                        )}
                        {gameState.currentPlayerIndex === 0 && selectedTileIndex !== null && !gameState.waitingForUserAction && selfActionOptions.length === 0 && (
                          <button onClick={() => handleDiscard(selectedTileIndex)} className="px-12 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
                            打出
                          </button>
                        )}
                        {gameState.currentPlayerIndex !== 0 && (
                          <div className="text-gray-400/50 text-xs font-bold tracking-widest uppercase animate-pulse">
                            对手思考中...
                          </div>
                        )}
                    </div>
                </div>
             </div>
          </main>

          <div className="hidden lg:block absolute z-20" style={{left: `${panelPosition.x}px`, top: `${panelPosition.y}px`}}>
             <AnalysisPanel analysis={aiAnalysis} loading={isAnalyzing} onAnalyze={triggerAIAnalysis} onDragStart={handlePanelDragStart} />
          </div>

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