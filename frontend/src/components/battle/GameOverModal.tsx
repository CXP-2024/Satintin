import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, Button, Typography, Box, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GameOverResult } from '../../services/WebSocketService';
import { getUserInfo, setUserInfoField } from "Plugins/CommonUtils/Store/UserInfoStore";
import { RewardAssetMessage } from 'Plugins/AssetService/APIs/RewardAssetMessage';
import { DeductAssetMessage } from 'Plugins/AssetService/APIs/DeductAssetMessage';
import { QueryAssetStatusMessage } from "Plugins/AssetService/APIs/QueryAssetStatusMessage";

interface GameOverModalProps {
	open: boolean;
	gameOverResult: GameOverResult | null;
	onClose: () => void;
	onRestart?: () => void;
	onViewLastRound?: () => void; // 新增：查看上一轮结果的回调
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		borderRadius: 16,
		background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)',
		color: 'white',
		minWidth: '400px',
		boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
	},
}));

const WinnerCard = styled(Card)(({ theme }) => ({
	background: 'rgba(255,255,255,0.1)',
	backdropFilter: 'blur(10px)',
	border: '1px solid rgba(255,255,255,0.2)',
	borderRadius: 12,
	marginBottom: theme.spacing(2),
}));

const RewardBox = styled(Box)(({ theme }) => ({
	background: 'rgba(255,215,0,0.2)',
	border: '1px solid rgba(255,215,0,0.5)',
	borderRadius: 8,
	padding: theme.spacing(2),
	textAlign: 'center',
	marginTop: theme.spacing(2),
}));

const ActionButton = styled(Button)(({ theme }) => ({
	borderRadius: 25,
	padding: '12px 30px',
	fontSize: '16px',
	fontWeight: 'bold',
	textTransform: 'none',
	marginX: theme.spacing(1),
	'&.primary': {
		background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
		color: 'white',
		'&:hover': {
			background: 'linear-gradient(45deg, #FF5252, #FF7043)',
			transform: 'translateY(-2px)',
			boxShadow: '0 8px 16px rgba(255,107,107,0.3)',
		},
	},
	'&.secondary': {
		background: 'rgba(255,255,255,0.2)',
		color: 'white',
		border: '1px solid rgba(255,255,255,0.3)',
		'&:hover': {
			background: 'rgba(255,255,255,0.3)',
			transform: 'translateY(-2px)',
		},
	},
}));

export const GameOverModal: React.FC<GameOverModalProps> = ({
	open,
	gameOverResult,
	onClose,
	onRestart,
	onViewLastRound
}) => {
	const userInfo = getUserInfo();
	const userName = userInfo.userName;
	const userToken = userInfo.userID;
	const REWARD_AMOUNT = 50; // 奖惩金额设为50原石

	// 更新原石数量的函数
	const updateStoneAmount = () => {
		if (!userToken) return;
		
		new QueryAssetStatusMessage(userToken).send(
			(res: string) => {
				try {
					const amt = typeof res === 'string' ? parseInt(JSON.parse(res)) : res;
					setUserInfoField('stoneAmount', amt);
					console.log('✅ [GameOverModal] 更新原石数量成功:', amt);
				} catch (e) {
					console.error('❌ [GameOverModal] 解析原石数量失败:', e);
				}
			},
			(err: any) => console.error('❌ [GameOverModal] 查询原石数量失败:', err)
		);
	};

	useEffect(() => {
		if (open && gameOverResult && userToken) {
			const isWinner = (gameOverResult.winner === userName);

			if (isWinner) {
				// 胜利者获得奖励
				new RewardAssetMessage(userToken, REWARD_AMOUNT).send(
					(response) => {
						console.log('✅ [GameOverModal] 胜利奖励发放成功:', response);
						updateStoneAmount(); // 查询最新原石数量
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
						updateStoneAmount(); // 查询最新原石数量
					},
					(error) => {
						console.error('❌ [GameOverModal] 失败扣除原石失败:', error);
					}
				);
			}
		}
	}, [open, gameOverResult, userName, userToken]);

	if (!gameOverResult) return null;

	console.log('Current Player UserName: ', userName);
	console.log('Winner: ', gameOverResult.winner);
	const isWinner = (gameOverResult.winner === userName);
	const winnerTitle = isWinner ? '🎉 你获胜了！' : '💔 你失败了！';
	const winnerDescription = isWinner ?
		'恭喜你在这场激烈的对战中获得胜利！' :
		'虽然失败了，但这是成长的机会，继续努力！';

	const getReasonText = (reason: string) => {
		switch (reason) {
			case 'health_zero': return '血量归零';
			case 'timeout': return '超时';
			case 'surrender': return '投降';
			default: return reason;
		}
	};

	// 渲染奖惩信息
	const renderRewards = () => {
		if (isWinner) {
			// 胜利奖励显示
			return (
				<RewardBox>
					<Typography variant="h6" sx={{ mb: 1, color: '#FFD700' }}>
						🎁 胜利奖励
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
								+{REWARD_AMOUNT}
							</Typography>
							<Typography variant="body2">
								💎 原石
							</Typography>
						</Box>
						{gameOverResult.rewards?.rankChange && (
							<Box sx={{ textAlign: 'center' }}>
								<Typography
									variant="h4"
									sx={{
										color: gameOverResult.rewards.rankChange > 0 ? '#4CAF50' : '#F44336',
										fontWeight: 'bold'
									}}
								>
									{gameOverResult.rewards.rankChange > 0 ? '+' : ''}{gameOverResult.rewards.rankChange}
								</Typography>
								<Typography variant="body2">
									📈 排名变化
								</Typography>
							</Box>
						)}
					</Box>
				</RewardBox>
			);
		} else {
			// 失败惩罚显示
			return (
				<RewardBox sx={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)' }}>
					<Typography variant="h6" sx={{ mb: 1, color: '#F44336' }}>
						⚠️ 失败惩罚
					</Typography>
					<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant="h4" sx={{ color: '#F44336', fontWeight: 'bold' }}>
								-{REWARD_AMOUNT}
							</Typography>
							<Typography variant="body2">
								💎 原石
							</Typography>
						</Box>
						{gameOverResult.rewards?.rankChange && (
							<Box sx={{ textAlign: 'center' }}>
								<Typography
									variant="h4"
									sx={{
										color: '#F44336',
										fontWeight: 'bold'
									}}
								>
									{gameOverResult.rewards.rankChange}
								</Typography>
								<Typography variant="body2">
									📉 排名变化
								</Typography>
							</Box>
						)}
					</Box>
				</RewardBox>
			);
		}
	};

	return (
		<StyledDialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				style: {
					backgroundImage: isWinner ?
						'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)' :
						'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)'
				}
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', pb: 1 }}>
				{isWinner ? '🏆 胜利！' : '😔 败北'}
			</DialogTitle>

			<DialogContent sx={{ pt: 0 }}>
				<Box sx={{ textAlign: 'center', mb: 3 }}>
					<Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
						{winnerTitle}
					</Typography>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{winnerDescription}
					</Typography>
				</Box>

				<WinnerCard>
					<CardContent>
						<Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
							📊 对战结果
						</Typography>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Box sx={{ textAlign: 'center' }}>
								<Typography variant="body2" sx={{ opacity: 0.8 }}>
									获胜者
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 'bold' }}>
									{gameOverResult.winner}
								</Typography>
							</Box>
							<Box sx={{ textAlign: 'center' }}>
								<Typography variant="body2" sx={{ opacity: 0.8 }}>
									结束原因
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 'bold' }}>
									{getReasonText(gameOverResult.reason)}
								</Typography>
							</Box>
						</Box>
					</CardContent>
				</WinnerCard>

				{renderRewards()}

				<Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
					{onViewLastRound && (
						<ActionButton
							className="secondary"
							onClick={onViewLastRound}
							variant="outlined"
						>
							📊 查看上一轮结果
						</ActionButton>
					)}
					{onRestart && (
						<ActionButton
							className="primary"
							onClick={onRestart}
							variant="contained"
						>
							🔄 再来一局
						</ActionButton>
					)}
					<ActionButton
						className="secondary"
						onClick={onClose}
						variant="outlined"
					>
						✋ 退出对战
					</ActionButton>
				</Box>
			</DialogContent>
		</StyledDialog>
	);
};
