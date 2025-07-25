import React, { useEffect, useState } from 'react';
import { useBattleStore } from '../../store/battleStore';
import { useReportStore } from '../../store/reportStore';
import { useBattleRoomHandlers } from './BattleRoomHandlers';
import PageTransition from '../../components/PageTransition';
import GameBoard from '../../components/battle/GameBoard';
import ActionSelector from '../../components/battle/ActionSelector';
import RoundResultModal from '../../components/battle/RoundResultModal';
import { GameOverModal } from '../../components/battle/GameOverModal';
import ReportModal from '../../components/battle/ReportModal';
import ChatBox from '../../components/battle/chatbox/ChatBox';
import './BattleRoom.css';
import clickSound from '../../assets/sound/yinxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { getUserToken, useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import { SetUserMatchStatusMessage } from "Plugins/UserService/APIs/Battle/SetUserMatchStatusMessage";

const BattleRoom: React.FC = () => {
	const user = useUserInfo();
	const {
		roomId, gameState, isConnected, connectionError, currentPlayer, opponent,
		showActionSelector, actionSelectorTemporarilyHidden,
		showRoundResult, currentRoundResult, lastRoundResult, isActionSubmitted, lastRoundSelectedAction,
		showGameOver, gameOverTemporarilyHidden, currentGameOverResult,
		setRoomId, setConnectionStatus,
		hideRoundResultModal, hideRoundResultTemporarily, showLastRoundResult,
		hideGameOverModal, hideGameOverTemporarily, showGameOverAgain, setLastRoundResult,
		showActionSelectorAgain, resetBattle
	} = useBattleStore();
	const {
		showReportModal,
		openReportModal,
		closeReportModal,
		submitReport
	} = useReportStore();
	const [isConnecting, setIsConnecting] = useState(true);
	const [roomStatus, setRoomStatus] = useState<'connecting' | 'waiting' | 'ready' | 'playing'>('connecting');
	const [hasCopied, setHasCopied] = useState(false);
	const [stonesUpdated, setStonesUpdated] = useState(false);
	const [rewardProcessed, setRewardProcessed] = useState(false);
	const [showChatBox, setShowChatBox] = useState(false);
	const {
		initializeConnection,
		cleanupConnection,
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
	} = useBattleRoomHandlers(
		user,
		setRoomId,
		setConnectionStatus,
		setIsConnecting,
		setRoomStatus,
		hideGameOverModal,
		hideRoundResultModal,
		showActionSelectorAgain,
		showLastRoundResult,
		hideGameOverTemporarily,
		showGameOverAgain,
		resetBattle,
		stonesUpdated,
		setLastRoundResult,
		setStonesUpdated,
		rewardProcessed,
		setRewardProcessed,
		openReportModal,
		submitReport
	);
	const handleChatClick = () => {
		setShowChatBox(true);
	};
	const handleChatClose = () => {
		setShowChatBox(false);
	};
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);
	useEffect(() => {
		console.log('🔌 [BattleRoom] useEffect 初始化WebSocket连接');
		initializeConnection();
		console.log('🔌 [BattleRoom] useEffect 初始化WebSocket连接完成');
		return () => {
			console.log('🔌 [BattleRoom] useEffect return 清理WebSocket连接');
			cleanupConnection();
		};
	}, [user, setRoomId, setConnectionStatus]);
	if (isConnecting) {
		return (
			<PageTransition className="battle-room-page">
				<div className="battle-room connecting">
					<div className="connecting-overlay">
						<div className="connecting-spinner"></div>
						<h2>正在连接对战服务器...</h2>
						<p>请稍候</p>
					</div>
				</div>
			</PageTransition>
		);
	}
	if (!isConnected && connectionError) {
		return (
			<PageTransition className="battle-room-page">
				<div className="battle-room error">
					<div className="error-overlay">
						<div className="error-icon">❌</div>
						<h2>连接失败</h2>
						<p>{connectionError}</p>
						<div className="error-actions">
							<button className="retry-btn" onClick={() => window.location.reload()}>
								重试连接
							</button>
							<button className="back-btn" onClick={handleLeaveRoom}>
								返回大厅
							</button>
						</div>
					</div>
				</div>
			</PageTransition>
		);
	}
	return (
		<PageTransition className="battle-room-page">
			<div className="battle-room">
				<header className="room-header">
					<div className="room-info">
						<h1>对战房间</h1>
						<span className="room-id">房间ID: {roomId?.slice(-8)}</span>
					</div>
					<div className="room-status">
						<span className={`status-indicator ${roomStatus}`}>
							{roomStatus === 'waiting' && '等待对手'}
							{roomStatus === 'ready' && '准备开始'}
							{roomStatus === 'playing' && '对战中'}
						</span>
					</div>
					<button className="leave-btn" onClick={handleLeaveRoom}>
						离开房间
					</button>
				</header>
				<main className="room-main">
					{roomStatus === 'waiting' && (
						<div className="waiting-area">
							<div className="waiting-message">
								<div className="waiting-icon">⏳</div>
								<h2>等待对手加入...</h2>
								<p>房间ID: {roomId}</p>
								<div className="share-room">
									<button
										className="share-btn"
										onClick={() => handleCopyRoomId(roomId, setHasCopied)}
									>
										{hasCopied ? '已复制 ✓' : '复制房间ID'}
									</button>
								</div>
							</div>
						</div>
					)}
					{roomStatus === 'ready' && gameState && (
						<div className="ready-area">
							<div className="ready-message">
								<h2>对手已就位！</h2>
								<div className="ready-players-info">
									<div className="ready-player-card">
										<h3>{currentPlayer?.username || '你'}</h3>
										<p>{currentPlayer?.isReady ? '✅ 已准备' : '⏳ 未准备'}</p>
									</div>
									<div className="ready-vs-divider">VS</div>
									<div className="ready-player-card">
										<h3>{opponent?.username || '对手'}</h3>
										<p>{opponent?.isReady ? '✅ 已准备' : '⏳ 未准备'}</p>
									</div>
								</div>
								{!currentPlayer?.isReady && (
									<button
										className="ready-btn"
										onClick={handleReady}
									>
										🎮 准备战斗
									</button>
								)}
								{currentPlayer?.isReady && !opponent?.isReady && (
									<p className="ready-waiting-text">等待对手准备...</p>
								)}
								{currentPlayer?.isReady && opponent?.isReady && (
									<p className="ready-starting-text">🎉 开始战斗！</p>
								)}
							</div>
						</div>
					)}
					{roomStatus === 'playing' && gameState && (
						<>
							<GameBoard
								gameState={gameState}
								currentPlayer={currentPlayer}
								opponent={opponent}
								isActionSubmitted={isActionSubmitted}
								lastRoundSelectedAction={lastRoundSelectedAction}
							/>
							{gameState.roundPhase === 'action' && actionSelectorTemporarilyHidden && (
								<div className="game-controls">
									<button
										className="show-action-selector-btn"
										onClick={handleShowActionSelector}
									>
										🎮 行动选择器
									</button>
									{lastRoundResult && gameState.currentRound !== 1 && (
										console.log('🔍 [BattleRoom] 显示上回合结果按钮'),
										<button
											className="show-last-result-btn"
											onClick={handleShowLastRoundResult}
										>
											📊 上回合结果
										</button>
									)}
									{opponent && opponent.playerId && (
										<button
											className="chat-with-opponent-btn"
											onClick={handleChatClick}
										>
											💬 与对手聊天
										</button>
									)}
									<button
										className="report-opponent-btn"
										onClick={handleInGameReport}
									>
										⚠️ 举报对手
									</button>
								</div>
							)}
							{showActionSelector && (
								<ActionSelector />
							)}
						</>
					)}
				</main>
				{showRoundResult && currentRoundResult && gameState && gameState?.roundPhase !== "waiting" && lastRoundResult && (
					<RoundResultModal
						result={currentRoundResult}
						onClose={gameOverTemporarilyHidden ? handleReturnToGameOver : hideRoundResultModal}
						onDirectExit={gameOverTemporarilyHidden ? handleDirectExitFromRoundResult : undefined}
						onHideTemporarily={gameOverTemporarilyHidden ? undefined : hideRoundResultTemporarily}
						isGameOver={gameOverTemporarilyHidden}
					/>
				)}
				{showGameOver && currentGameOverResult && (
					<GameOverModal
						open={showGameOver}
						gameOverResult={currentGameOverResult}
						onClose={handleGameOverExit}
						skipRewardProcessing={rewardProcessed}
						onViewLastRound={lastRoundResult ? handleViewLastRoundFromGameOver : undefined}
					/>
				)}
				{showReportModal && opponent && (
					<ReportModal
						opponentName={opponent.username}
						isOpen={showReportModal}
						onClose={closeReportModal}
						onSubmit={handleReportSubmit}
					/>
				)}
				{showChatBox && opponent && opponent.playerId && (
					<ChatBox
						friendId={opponent.playerId}
						friendName={opponent.username}
						onClose={handleChatClose}
						isVisible={showChatBox}
					/>
				)}
			</div>
		</PageTransition>
	);
};

export default BattleRoom;
