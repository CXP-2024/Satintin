import { config } from '../globals/Config';

export interface BattleAction {
	type: 'cake' | 'defense' | 'spray'; // 饼、防、撒
	playerId: string;
	timestamp: number;
}

export interface GameState {
	roomId: string;
	player1: PlayerState;
	player2: PlayerState;
	currentRound: number;
	roundPhase: 'waiting' | 'action' | 'result' | 'finished';
	remainingTime: number;
	winner?: string;
}

export interface PlayerState {
	playerId: string;
	username: string;
	health: number;
	energy: number;
	rank: string;
	cards: CardState[];
	currentAction?: BattleAction;
	isReady: boolean;
	isConnected: boolean;
}

export interface CardState {
	cardId: string;
	name: string;
	type: 'penetrate' | 'develop' | 'reflect';
	rarity: 'common' | 'rare' | 'legendary';
	effectChance: number;
}

export type WebSocketMessage =
	| { type: 'game_state'; data: GameState }
	| { type: 'player_action'; data: BattleAction }
	| { type: 'round_result'; data: RoundResult }
	| { type: 'game_over'; data: GameOverResult }
	| { type: 'player_joined'; data: { playerId: string; username: string } }
	| { type: 'player_left'; data: { playerId: string } }
	| { type: 'error'; data: { message: string } };

export interface RoundResult {
	round: number;
	player1Action: BattleAction;
	player2Action: BattleAction;
	results: {
		player1: { healthChange: number; energyChange: number };
		player2: { healthChange: number; energyChange: number };
	};
	cardEffects: CardEffect[];
}

export interface CardEffect {
	playerId: string;
	cardName: string;
	effectType: 'penetrate' | 'develop' | 'reflect';
	triggered: boolean;
}

export interface GameOverResult {
	winner: string;
	reason: 'health_zero' | 'disconnect' | 'surrender';
	rewards?: {
		stones: number;
		rankChange?: number;
	};
}

export class WebSocketService {
	private ws: WebSocket | null = null;
	private roomId: string | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectInterval = 3000;

	// 事件监听器
	private listeners: { [event: string]: ((data: any) => void)[] } = {};

	constructor() {
		this.listeners = {};
	}

	/**
	 * 连接到对战房间
	 */
	connect(roomId: string, userToken: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.roomId = roomId;
			const wsUrl = `ws://${new URL(config.battleServiceUrl).host}/battle/${roomId}?token=${userToken}`;

			console.log('🔌 [WebSocket] 连接到对战房间:', wsUrl);

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('✅ [WebSocket] 连接成功');
				this.reconnectAttempts = 0;
				resolve();
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					console.log('📨 [WebSocket] 收到消息:', message);
					this.handleMessage(message);
				} catch (error) {
					console.error('❌ [WebSocket] 消息解析失败:', error);
				}
			};

			this.ws.onclose = (event) => {
				console.log('🔌 [WebSocket] 连接关闭:', event.code, event.reason);
				this.handleDisconnect();
			};

			this.ws.onerror = (error) => {
				console.error('❌ [WebSocket] 连接错误:', error);
				reject(error);
			};
		});
	}

	/**
	 * 发送玩家行动
	 */
	sendAction(action: Omit<BattleAction, 'timestamp'>): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.error('❌ [WebSocket] 连接未建立，无法发送行动');
			return;
		}

		const fullAction: BattleAction = {
			...action,
			timestamp: Date.now()
		};

		console.log('📤 [WebSocket] 发送行动:', fullAction);
		this.ws.send(JSON.stringify({
			type: 'player_action',
			data: fullAction
		}));
	}

	/**
	 * 发送准备状态
	 */
	sendReady(): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.error('❌ [WebSocket] 连接未建立，无法发送准备状态');
			return;
		}

		console.log('📤 [WebSocket] 发送准备状态');
		this.ws.send(JSON.stringify({
			type: 'player_ready'
		}));
	}

	/**
	 * 断开连接
	 */
	disconnect(): void {
		if (this.ws) {
			console.log('🔌 [WebSocket] 主动断开连接');
			this.ws.close(1000, 'User disconnect');
			this.ws = null;
		}
		this.roomId = null;
		this.listeners = {};
	}

	/**
	 * 添加事件监听器
	 */
	on(event: string, callback: (data: any) => void): void {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}

	/**
	 * 移除事件监听器
	 */
	off(event: string, callback: (data: any) => void): void {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
		}
	}

	/**
	 * 获取连接状态
	 */
	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	/**
	 * 处理收到的消息
	 */
	private handleMessage(message: WebSocketMessage): void {
		const { type, data } = message;

		// 触发对应的事件监听器
		if (this.listeners[type]) {
			this.listeners[type].forEach(callback => callback(data));
		}

		// 触发通用消息监听器
		if (this.listeners['message']) {
			this.listeners['message'].forEach(callback => callback(message));
		}
	}

	/**
	 * 处理断开连接
	 */
	private handleDisconnect(): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId) {
			this.reconnectAttempts++;
			console.log(`🔄 [WebSocket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

			setTimeout(() => {
				if (this.roomId) {
					// 这里需要重新获取token，实际实现中需要从auth store获取
					// this.connect(this.roomId, token);
				}
			}, this.reconnectInterval);
		} else {
			console.error('❌ [WebSocket] 重连失败，达到最大重试次数');
			// 触发连接失败事件
			if (this.listeners['connection_failed']) {
				this.listeners['connection_failed'].forEach(callback => callback({}));
			}
		}
	}
}

// 单例实例
export const webSocketService = new WebSocketService();
