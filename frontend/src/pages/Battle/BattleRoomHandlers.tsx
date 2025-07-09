/**
 * BattleRoomHandlers.tsx
 * 
 * BattleRoom 组件的业务逻辑处理钩子
 * 
 * 功能模块：
 * 1. WebSocket 连接管理
 * 2. 房间状态管理
 * 3. 游戏流程控制
 * 4. 原石奖励/扣除处理
 * 5. 用户交互处理（举报、复制等）
 * 
 * 作者: SaTT Code Team
 * 创建时间: 2025-07-09
 */

import { useNavigate } from 'react-router-dom';
import { webSocketService } from '../../services/WebSocketService';
import { webSocketHandles } from '../../services/WebsocketHandles';
import { SoundUtils } from 'utils/soundUtils';
import { setUserInfoField } from "Plugins/CommonUtils/Store/UserInfoStore";
import { QueryAssetStatusMessage } from "Plugins/AssetService/APIs/QueryAssetStatusMessage";
import { GetBattleRoomIdSync } from '../../components/battle/GetBattleRoomId';

/**
 * BattleRoom 业务逻辑处理钩子
 * 包含所有与房间管理、游戏流程相关的处理函数
 */
export const useBattleRoomHandlers = (
	user: any,
	setRoomId: (id: string) => void,
	setConnectionStatus: (connected: boolean, error?: string) => void,
	setIsConnecting: (connecting: boolean) => void,
	setRoomStatus: (status: 'connecting' | 'waiting' | 'ready' | 'playing') => void,
	hideGameOverModal: () => void,
	hideRoundResultModal: () => void,
	showActionSelectorAgain: () => void,
	showLastRoundResult: () => void,
	hideGameOverTemporarily: () => void,
	showGameOverAgain: () => void,
	resetBattle: () => void,
	stonesUpdated: boolean,
	setLastRoundResult: (result: any) => void,
	setStonesUpdated: (updated: boolean) => void,
	rewardProcessed: boolean,
	setRewardProcessed: (processed: boolean) => void,
	openReportModal: () => void,
	submitReport: (reason: string, description: string) => void
) => {
	const navigate = useNavigate();

	/**
	 * 初始化WebSocket连接
	 */
	const initializeConnection = async () => {
		try {
			// 设置为连接中状态
			setIsConnecting(true);
			
			// 使用同步方式获取房间ID
			GetBattleRoomIdSync(user, async (battleRoomId) => {
				setRoomId(battleRoomId);
				console.log('🎮 [BattleRoom] 初始化房间:', battleRoomId);

				// 连接WebSocket
				await webSocketService.connect(battleRoomId, user.userID, user.userName);
				setConnectionStatus(true);
				setIsConnecting(false);
				setRoomStatus('waiting');
				setLastRoundResult(null); // 清除上次回合结果

				// 设置事件监听器
				console.log('🔌 [BattleRoom] 设置事件监听器');
				webSocketHandles.setupWebSocketListeners(setRoomStatus);
				console.log('🎮 [BattleRoom] 事件监听器已设置');
			});
		} catch (error) {
			console.error('❌ [BattleRoom] 连接失败:', error);
			setConnectionStatus(false, '连接失败，请重试');
			setIsConnecting(false);
		}
	};

	/**
	 * 清理WebSocket连接
	 */
	const cleanupConnection = () => {
		console.log('🔌 [BattleRoom] 清理WebSocket连接');
		webSocketHandles.cleanupWebSocketListeners(setRoomStatus);
	};

	/**
	 * 更新原石数量
	 */
	const updateStoneAmount = () => {
		const userToken = user.userID;
		if (!userToken) return;

		console.log('💎 [BattleRoom] 开始更新原石数量');
		new QueryAssetStatusMessage(userToken).send(
			(res: string) => {
				try {
					const amt = typeof res === 'string' ? parseInt(JSON.parse(res)) : res;
					// 延迟更新，在页面跳转开始后进行，减少对当前页面的影响
					setTimeout(() => {
						setUserInfoField('stoneAmount', amt);
						console.log('✅ [BattleRoom] 更新原石数量成功:', amt);
					}, 800); // 延迟800ms，确保页面跳转已经开始
				} catch (e) {
					console.error('❌ [BattleRoom] 解析原石数量失败:', e);
				}
			},
			(err: any) => console.error('❌ [BattleRoom] 查询原石数量失败:', err)
		);
	};

	/**
	 * 离开房间
	 */
	const handleLeaveRoom = () => {
		console.log('🔙 [BattleRoom] 离开房间');
		SoundUtils.playClickSound(0.5);
		webSocketService.disconnect();
		resetBattle();
		setStonesUpdated(false); // 重置原石更新标记
		setRewardProcessed(false); // 重置奖励处理标记
		navigate('/battle');
	};

	/**
	 * 处理游戏结束后的退出对战
	 */
	const handleGameOverExit = () => {
		console.log('🏁 [BattleRoom] 游戏结束后退出对战');
		// 只有在未更新过原石的情况下才更新
		if (!stonesUpdated) {
			updateStoneAmount();
			setStonesUpdated(true); // 标记已更新
		}
		// 标记奖励已处理
		setRewardProcessed(true);
		// 隐藏Modal
		hideGameOverModal();
		// 延迟一下再离开房间，让Modal有时间完成清理和原石更新
		setTimeout(() => {
			handleLeaveRoom();
		}, 200);
	};

	/**
	 * 处理从回合结果直接退出战斗（跳过GameOverModal）
	 */
	const handleDirectExitFromRoundResult = () => {
		console.log('🏁 [BattleRoom] 从回合结果直接退出战斗');
		// 只有在未更新过原石的情况下才更新
		if (!stonesUpdated) {
			updateStoneAmount();
			setStonesUpdated(true); // 标记已更新
		}
		// 标记奖励已处理
		setRewardProcessed(true);
		// 隐藏回合结果Modal
		hideRoundResultModal();
		// 延迟一下再离开房间
		setTimeout(() => {
			handleLeaveRoom();
		}, 200);
	};

	/**
	 * 准备游戏
	 */
	const handleReady = () => {
		SoundUtils.playClickSound(0.5);
		webSocketService.sendReady();
	};

	/**
	 * 重新显示行动选择器
	 */
	const handleShowActionSelector = () => {
		SoundUtils.playClickSound(0.5);
		showActionSelectorAgain();
	};

	/**
	 * 查看上一回合结果
	 */
	const handleShowLastRoundResult = () => {
		SoundUtils.playClickSound(0.5);
		showLastRoundResult();
	};

	/**
	 * 查看上一回合结果（从游戏结束面板）
	 */
	const handleViewLastRoundFromGameOver = () => {
		SoundUtils.playClickSound(0.5);
		// 标记奖励已处理，防止返回时重复处理
		setRewardProcessed(true);
		hideGameOverTemporarily(); // 暂时隐藏游戏结束面板
		showLastRoundResult(); // 显示上一回合结果
	};

	/**
	 * 从结果页面返回游戏结束面板
	 */
	const handleReturnToGameOver = () => {
		SoundUtils.playClickSound(0.5);
		hideRoundResultModal(); // 隐藏结果面板
		// 不重置rewardProcessed标记，保持为true，避免重复处理奖励
		showGameOverAgain(); // 重新显示游戏结束面板
	};

	/**
	 * 复制房间ID到剪贴板
	 */
	const handleCopyRoomId = (roomId: string | null, setHasCopied: (copied: boolean) => void) => {
		if (!roomId) return;

		navigator.clipboard.writeText(roomId)
			.then(() => {
				SoundUtils.playClickSound(0.5);
				setHasCopied(true);
				// 3秒后重置状态
				setTimeout(() => setHasCopied(false), 3000);
			})
			.catch(err => {
				console.error('❌ [BattleRoom] 复制房间ID失败:', err);
				alert('复制房间ID失败，请手动复制。');
			});
	};

	/**
	 * 处理游戏中举报功能
	 */
	const handleInGameReport = () => {
		SoundUtils.playClickSound(0.5);
		openReportModal();
	};

	/**
	 * 处理举报提交
	 */
	const handleReportSubmit = (reason: string, description: string) => {
		submitReport(reason, description);
	};

	return {
		initializeConnection,
		cleanupConnection,
		updateStoneAmount,
		handleLeaveRoom,
		handleGameOverExit,
		handleDirectExitFromRoundResult,
		handleReady,
		handleShowActionSelector,
		handleShowLastRoundResult,
		handleViewLastRoundFromGameOver,
		handleReturnToGameOver,
		handleCopyRoomId,
		handleInGameReport,
		handleReportSubmit
	};
};
