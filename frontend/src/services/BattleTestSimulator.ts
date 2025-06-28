import { GameState, PlayerState, BattleAction, RoundResult, GameOverResult } from './WebSocketService';
import { webSocketService } from './WebSocketService';
import { useBattleStore } from '../store/battleStore';

/**
 * 对战测试模拟器
 * 负责创建测试环境和模拟对手行为
 */
export class BattleTestSimulator {
	private testRoundTimer: number | null = null;
	private isTestModeActive = false;

	/**
	 * 创建测试用的游戏状态
	 */
	createTestGameState(user: any, roomId: string): GameState {
		return {
			roomId: roomId || 'test_room',
			player1: {
				playerId: user?.id || 'test_player_1',
				username: user?.username || '测试玩家1',
				health: 6, // 根据游戏规则，初始6血
				energy: 0, // 初始0能量
				rank: user?.rank || 'Bronze',
				cards: [
					// 5星传说卡牌 - Dragon Nai (反弹)
					{
						cardId: 'nailong',
						name: 'Dragon Nai',
						type: 'reflect',
						rarity: 'legendary',
						effectChance: 0.33 // 33% 概率反弹撒攻击
					},
					// 4星稀有卡牌 - 坤 (穿透)
					{
						cardId: 'kun',
						name: '坤',
						type: 'penetrate',
						rarity: 'rare',
						effectChance: 0.15 // 15% 概率穿透防御
					},
					// 3星普通卡牌 - wlm (发育)
					{
						cardId: 'wlm',
						name: 'wlm',
						type: 'develop',
						rarity: 'common',
						effectChance: 0.05 // 5% 概率获得2点能量
					}
				],
				isReady: true,
				isConnected: true
			},
			player2: {
				playerId: 'test_opponent',
				username: '饼神AI',
				health: 6, // 根据游戏规则，初始6血
				energy: 0, // 初始0能量
				rank: 'Bronze',
				cards: [
					// 5星传说卡牌 - 盖亚 (穿透)
					{
						cardId: 'gaiya',
						name: '盖亚',
						type: 'penetrate',
						rarity: 'legendary',
						effectChance: 0.33 // 33% 概率穿透防御
					},
					// 4星稀有卡牌 - Paimon (反弹)
					{
						cardId: 'paimeng',
						name: 'Paimon',
						type: 'reflect',
						rarity: 'rare',
						effectChance: 0.15 // 15% 概率反弹撒攻击
					},
					// 5星传说卡牌 - 饼饼 (发育) - 专门为测试使用饼的AI
					{
						cardId: 'bingbing',
						name: '饼饼',
						type: 'develop',
						rarity: 'legendary',
						effectChance: 0.33 // 33% 概率获得2点能量
					}
				],
				isReady: true,
				isConnected: true
			},
			currentRound: 1,
			roundPhase: 'action',
			remainingTime: 30
		};
	}

	/**
	 * 启动测试模式
	 */
	startTestMode(): void {
		this.isTestModeActive = true;
		this.setupTestModeListeners();
		console.log('🧪 [BattleTestSimulator] 测试模式已启动');
	}

	/**
	 * 停止测试模式
	 */
	stopTestMode(): void {
		this.isTestModeActive = false;
		if (this.testRoundTimer) {
			clearTimeout(this.testRoundTimer);
			this.testRoundTimer = null;
		}
		console.log('🧪 [BattleTestSimulator] 测试模式已停止');
	}

	/**
	 * 设置测试模式的事件监听器
	 */
	private setupTestModeListeners(): void {
		console.log('🧪 [BattleTestSimulator] 设置测试模式监听器');

		// 备份原始的sendAction方法
		const originalSendAction = webSocketService.sendAction;

		// 重写sendAction方法来拦截玩家行动
		webSocketService.sendAction = (action) => {
			if (!this.isTestModeActive) {
				// 如果不是测试模式，使用原始方法
				originalSendAction.call(webSocketService, action);
				return;
			}

			console.log('🧪 [TestMode] 玩家提交行动:', action);

			// 更新当前玩家的行动状态
			const { gameState, currentPlayer, setGameState } = useBattleStore.getState();

			if (gameState && currentPlayer) {
				// 创建完整的BattleAction对象
				const fullAction: BattleAction = {
					...action,
					timestamp: Date.now()
				};

				const updatedGameState = {
					...gameState,
					player1: gameState.player1.playerId === currentPlayer.playerId ? {
						...gameState.player1,
						currentAction: fullAction
					} : gameState.player1,
					player2: gameState.player2.playerId === currentPlayer.playerId ? {
						...gameState.player2,
						currentAction: fullAction
					} : gameState.player2
				};

				setGameState(updatedGameState);
			}

			// 模拟对手在2秒后使用饼
			this.testRoundTimer = window.setTimeout(() => {
				this.simulateOpponentAction('cake');
			}, 2000);
		};
	}

	/**
	 * 模拟对手行动
	 */
	private simulateOpponentAction(opponentAction: 'cake' | 'defense' | 'spray'): void {
		if (!this.isTestModeActive) {
			return;
		}

		// 使用最新的store状态
		const battleStore = useBattleStore.getState();
		const currentGameState = battleStore.gameState;
		const currentPlayerState = battleStore.currentPlayer;
		const opponentState = battleStore.opponent;

		if (!currentGameState || !currentPlayerState || !opponentState) {
			console.error('❌ [TestMode] 无法模拟对手行动：缺少游戏状态', {
				gameState: !!currentGameState,
				currentPlayer: !!currentPlayerState,
				opponent: !!opponentState
			});
			return;
		}

		console.log('🧪 [TestMode] 模拟对手使用:', opponentAction);

		// 创建回合结果
		const playerAction = currentPlayerState.currentAction?.type || 'cake';
		const roundResult = this.calculateRoundResult(
			playerAction,
			opponentAction,
			currentPlayerState,
			opponentState,
			currentGameState
		);

		// 确定玩家在游戏状态中的身份
		const isCurrentPlayerPlayer1 = currentGameState.player1.playerId === currentPlayerState.playerId;

		// 计算新的生命值和能量
		const currentPlayerResults = isCurrentPlayerPlayer1 ? roundResult.results.player1 : roundResult.results.player2;
		const opponentResults = isCurrentPlayerPlayer1 ? roundResult.results.player2 : roundResult.results.player1;

		const currentPlayerNewHealth = Math.max(0, currentPlayerState.health + currentPlayerResults.healthChange);
		const currentPlayerNewEnergy = Math.max(0, currentPlayerState.energy + currentPlayerResults.energyChange);
		const opponentNewHealth = Math.max(0, opponentState.health + opponentResults.healthChange);
		const opponentNewEnergy = Math.max(0, opponentState.energy + opponentResults.energyChange);

		// 更新游戏状态
		const updatedGameState = {
			...currentGameState,
			player1: {
				...currentGameState.player1,
				health: isCurrentPlayerPlayer1 ? currentPlayerNewHealth : opponentNewHealth,
				energy: isCurrentPlayerPlayer1 ? currentPlayerNewEnergy : opponentNewEnergy,
				currentAction: isCurrentPlayerPlayer1 ? roundResult.player1Action : roundResult.player2Action
			},
			player2: {
				...currentGameState.player2,
				health: isCurrentPlayerPlayer1 ? opponentNewHealth : currentPlayerNewHealth,
				energy: isCurrentPlayerPlayer1 ? opponentNewEnergy : currentPlayerNewEnergy,
				currentAction: isCurrentPlayerPlayer1 ? roundResult.player2Action : roundResult.player1Action
			},
			currentRound: currentGameState.currentRound + 1,
			roundPhase: 'result' as const
		};

		// 检查游戏是否结束
		const isGameOver = currentPlayerNewHealth <= 0 || opponentNewHealth <= 0;

		if (isGameOver) {
			// 游戏结束处理
			console.log('🎯 [TestMode] 游戏结束！', {
				playerHealth: currentPlayerNewHealth,
				opponentHealth: opponentNewHealth
			});

			// 设置游戏结束状态
			const gameOverState = {
				...updatedGameState,
				roundPhase: 'finished' as const,
				winner: currentPlayerNewHealth <= 0 ?
					(isCurrentPlayerPlayer1 ? updatedGameState.player2.playerId : updatedGameState.player1.playerId) :
					(isCurrentPlayerPlayer1 ? updatedGameState.player1.playerId : updatedGameState.player2.playerId)
			};

			// 先显示回合结果
			battleStore.addRoundResult(roundResult);
			battleStore.showRoundResultModal(roundResult);

			// 更新游戏状态为结束状态
			battleStore.setGameState(gameOverState);

			// 创建游戏结束结果
			const gameOverResult: GameOverResult = {
				winner: gameOverState.winner!,
				reason: 'health_zero',
				rewards: {
					stones: currentPlayerNewHealth > 0 ? 50 : 0, // 获胜者奖励50石头
					rankChange: currentPlayerNewHealth > 0 ? 1 : -1 // 获胜者+1，失败者-1
				}
			};

			// 3秒后显示游戏结束结果
			setTimeout(() => {
				this.handleGameOver(gameOverResult);
			}, 3000);

			// 停止测试模式
			this.stopTestMode();
			return;
		}

		// 先显示回合结果
		battleStore.addRoundResult(roundResult);
		battleStore.showRoundResultModal(roundResult);

		// 更新游戏状态
		battleStore.setGameState(updatedGameState);

		// 3秒后开始下一回合
		setTimeout(() => {
			this.startNextRound(updatedGameState);
		}, 3000);
	}

	/**
	 * 计算回合结果
	 */
	private calculateRoundResult(
		playerAction: string,
		opponentAction: string,
		player: PlayerState,
		opponent: PlayerState,
		currentGameState: GameState
	): RoundResult {
		// 确定玩家在游戏状态中的身份
		const isCurrentPlayerPlayer1 = currentGameState.player1.playerId === player.playerId;

		let player1HealthChange = 0;
		let player1EnergyChange = 0;
		let player2HealthChange = 0;
		let player2EnergyChange = 0;

		// 根据玩家身份分配行动结果
		const actualPlayer1Action = isCurrentPlayerPlayer1 ? playerAction : opponentAction;
		const actualPlayer2Action = isCurrentPlayerPlayer1 ? opponentAction : playerAction;

		// 基础规则计算
		// 🍰 饼：若对方使用撒，则自己扣一滴血；使用后+1能量
		// 💧 撒：对抗饼时，对方扣血；使用后-1能量  
		// 🛡️ 防：防御，无特殊效果
		if (actualPlayer1Action === 'cake' && actualPlayer2Action === 'spray') {
			player1HealthChange = -1; // player1使用饼，对方使用撒，player1扣血
		} else if (actualPlayer1Action === 'spray' && actualPlayer2Action === 'cake') {
			player2HealthChange = -1; // player2使用饼，player1使用撒，player2扣血
		}

		// 能量变化
		if (actualPlayer1Action === 'cake') player1EnergyChange += 1;
		if (actualPlayer1Action === 'spray') player1EnergyChange -= 1;
		if (actualPlayer2Action === 'cake') player2EnergyChange += 1;
		if (actualPlayer2Action === 'spray') player2EnergyChange -= 1;

		// 创建行动对象
		const player1Action: BattleAction = {
			type: actualPlayer1Action as 'cake' | 'defense' | 'spray',
			playerId: currentGameState.player1.playerId,
			timestamp: Date.now()
		};

		const player2Action: BattleAction = {
			type: actualPlayer2Action as 'cake' | 'defense' | 'spray',
			playerId: currentGameState.player2.playerId,
			timestamp: Date.now()
		};

		return {
			round: currentGameState.currentRound,
			player1Action,
			player2Action,
			results: {
				player1: {
					healthChange: player1HealthChange,
					energyChange: player1EnergyChange
				},
				player2: {
					healthChange: player2HealthChange,
					energyChange: player2EnergyChange
				}
			},
			cardEffects: [] // 暂时不处理卡牌效果
		};
	}

	/**
	 * 开始下一回合
	 */
	private startNextRound(currentGameState: GameState): void {
		if (!this.isTestModeActive) {
			return;
		}

		const nextRoundState = {
			...currentGameState,
			roundPhase: 'action' as const,
			remainingTime: 30,
			player1: {
				...currentGameState.player1,
				currentAction: undefined
			},
			player2: {
				...currentGameState.player2,
				currentAction: undefined
			}
		};

		const { setGameState } = useBattleStore.getState();
		setGameState(nextRoundState);
		console.log('🧪 [TestMode] 开始下一回合:', nextRoundState.currentRound);
	}

	/**
	 * 检查是否处于测试模式
	 */
	isInTestMode(): boolean {
		return this.isTestModeActive;
	}

	/**
	 * 处理游戏结束
	 */
	private handleGameOver(gameOverResult: GameOverResult): void {
		console.log('🏆 [TestMode] 游戏结束:', gameOverResult);

		// 使用弹窗显示游戏结束结果，而不是alert
		const { showGameOverModal } = useBattleStore.getState();
		showGameOverModal(gameOverResult);

		// 清理测试状态
		this.stopTestMode();
	}
}

// 单例实例
export const battleTestSimulator = new BattleTestSimulator();
