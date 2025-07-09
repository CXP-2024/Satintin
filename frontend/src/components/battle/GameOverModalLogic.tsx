/**
 * GameOverModalLogic.tsx
 * 
 * GameOverModal 组件的业务逻辑处理钩子
 * 
 * 功能模块：
 * 1. 游戏结束奖励/惩罚处理
 * 2. 用户身份验证和权限管理
 * 3. UI 状态计算和样式生成
 * 4. 本地化文本处理
 * 
 * 重要特性：
 * - 自动防重复奖励/扣除机制
 * - 安全的异步资产操作
 * - 响应式UI状态管理
 * 
 * 作者: SaTT Code Team
 * 创建时间: 2025-07-09
 */

import { useEffect } from 'react';
import { getUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import { RewardAssetMessage } from 'Plugins/AssetService/APIs/RewardAssetMessage';
import { DeductAssetMessage } from 'Plugins/AssetService/APIs/DeductAssetMessage';
import { GameOverResult } from '../../services/WebSocketService';

// 常量定义
export const REWARD_AMOUNT = 50; // 奖惩金额设为50原石

/**
 * GameOverModal 逻辑处理钩子
 * 负责处理游戏结束后的奖励/惩罚逻辑
 */
export const useGameOverModalLogic = (
	open: boolean,
	gameOverResult: GameOverResult | null,
	skipRewardProcessing: boolean = false
) => {
	const userInfo = getUserInfo();
	const userName = userInfo.userName;
	const userToken = userInfo.userID;

	useEffect(() => {
		// 只有在不跳过奖励处理时才执行
		if (open && gameOverResult && userToken && !skipRewardProcessing) {
			const isWinner = (gameOverResult.winner === userName);

			if (isWinner) {
				// 胜利者获得奖励
				new RewardAssetMessage(userToken, REWARD_AMOUNT).send(
					(response) => {
						console.log('✅ [GameOverModal] 胜利奖励发放成功:', response);
					},
					(error) => {
						console.error('❌ [GameOverModal] 胜利奖励发放失败:', error);
					}
				);
			} else {
				// 失败者扣除原石
				new DeductAssetMessage(userToken, REWARD_AMOUNT).send(
					(response) => {
						console.log('✅ [GameOverModal] 失败扣除原石成功:', response);
					},
					(error) => {
						console.error('❌ [GameOverModal] 失败扣除原石失败:', error);
					}
				);
			}
		} else if (skipRewardProcessing) {
			console.log('🚫 [GameOverModal] 跳过奖励处理，避免重复扣减');
		}
	}, [open, gameOverResult, userName, userToken, skipRewardProcessing]);

	/**
	 * 获取结束原因的中文描述
	 */
	const getReasonText = (reason: string) => {
		switch (reason) {
			case 'health_zero': return '血量归零';
			case 'timeout': return '超时';
			case 'surrender': return '投降';
			default: return reason;
		}
	};

	/**
	 * 判断当前用户是否为胜利者
	 */
	const isWinner = gameOverResult ? (gameOverResult.winner === userName) : false;

	/**
	 * 获取胜利/失败的标题文本
	 */
	const getWinnerTitle = () => {
		return isWinner ? '🎉 你获胜了！' : '💔 你失败了！';
	};

	/**
	 * 获取胜利/失败的描述文本
	 */
	const getWinnerDescription = () => {
		return isWinner ?
			'恭喜你在这场激烈的对战中获得胜利！' :
			'虽然失败了，但这是成长的机会，继续努力！';
	};

	/**
	 * 获取对话框的背景渐变样式
	 */
	const getDialogBackgroundStyle = () => {
		return isWinner ?
			'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)' :
			'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)';
	};

	return {
		userName,
		userToken,
		isWinner,
		getReasonText,
		getWinnerTitle,
		getWinnerDescription,
		getDialogBackgroundStyle,
		REWARD_AMOUNT
	};
};
