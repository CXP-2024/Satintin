import React from 'react';
import { Dialog, DialogContent, DialogTitle, Button, Typography, Box, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GameOverResult } from '../../services/WebSocketService';
import { useGameOverModalLogic, REWARD_AMOUNT } from './GameOverModalLogic';

interface GameOverModalProps {
	open: boolean;
	gameOverResult: GameOverResult | null;
	onClose: () => void;
	onRestart?: () => void;
	onViewLastRound?: () => void; // 新增：查看上一轮结果的回调
	skipRewardProcessing?: boolean; // 新增：是否跳过奖励处理（用于避免重复扣减）
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
	onViewLastRound,
	skipRewardProcessing = false
}) => {
	// 使用逻辑钩子
	const {
		userName,
		userToken,
		isWinner,
		getReasonText,
		getWinnerTitle,
		getWinnerDescription,
		getDialogBackgroundStyle
	} = useGameOverModalLogic(open, gameOverResult, skipRewardProcessing);

	// 处理退出对战按钮点击
	const handleExitBattle = () => {
		console.log('🚪 [GameOverModal] 用户点击退出对战');
		// 直接调用onClose，父组件会处理原石更新
		onClose();
	};

	if (!gameOverResult) return null;

	console.log('Current Player UserName: ', userName);
	console.log('Winner: ', gameOverResult.winner);

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
			onClose={handleExitBattle} // 统一使用handleExitBattle处理所有关闭情况
			maxWidth="sm"
			fullWidth
			PaperProps={{
				style: {
					backgroundImage: getDialogBackgroundStyle()
				}
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', pb: 1 }}>
				{isWinner ? '🏆 胜利！' : '😔 败北'}
			</DialogTitle>

			<DialogContent sx={{ pt: 0 }}>
				<Box sx={{ textAlign: 'center', mb: 3 }}>
					<Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
						{getWinnerTitle()}
					</Typography>
					<Typography variant="body1" sx={{ opacity: 0.9 }}>
						{getWinnerDescription()}
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
						onClick={handleExitBattle}
						variant="outlined"
					>
						✋ 退出对战
					</ActionButton>
				</Box>
			</DialogContent>
		</StyledDialog>
	);
};
