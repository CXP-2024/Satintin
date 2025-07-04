import React from 'react';
import { Dialog, DialogContent, DialogTitle, Button, Typography, Box, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import { GameOverResult } from '../services/WebSocketService';
import {getUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";

interface GameOverModalProps {
	open: boolean;
	gameOverResult: GameOverResult | null;
	onClose: () => void;
	onRestart?: () => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		borderRadius: 16,
		background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
	onRestart
}) => {
	if (!gameOverResult) return null;

	const userName = getUserInfo().userName
	console.log('Current Player UserName: ', userName)
	console.log('Winner: ', gameOverResult.winner)
	const isWinner = (gameOverResult.winner === userName);
	const winnerTitle = isWinner ? '🎉 你获胜了！' : '💔 你失败了！';
	const winnerDescription = isWinner ?
		'恭喜你在这场激烈的对战中获得胜利！' :
		'虽然失败了，但这是成长的机会，继续努力吧！ 哈！';

	const getReasonText = (reason: string) => {
		switch (reason) {
			case 'health_zero': return '血量归零';
			case 'timeout': return '超时';
			case 'surrender': return '投降';
			default: return reason;
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
						'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
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

				{gameOverResult.rewards && (
					<RewardBox>
						<Typography variant="h6" sx={{ mb: 1, color: '#FFD700' }}>
							🎁 奖励获得
						</Typography>
						<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
							{gameOverResult.rewards.stones && (
								<Box sx={{ textAlign: 'center' }}>
									<Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
										{gameOverResult.rewards.stones}
									</Typography>
									<Typography variant="body2">
										💎 石头
									</Typography>
								</Box>
							)}
							{gameOverResult.rewards.rankChange && (
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
				)}

				<Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
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
