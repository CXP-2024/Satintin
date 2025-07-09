import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import './BattlePage.css';
import clickSound from '../../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {useUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";

const BattlePage: React.FC = () => {
	const user = useUserInfo();
	const { navigateQuick, navigateWithTransition } = usePageTransition();
	const [isMatching, setIsMatching] = useState(false);
	const [matchingMode, setMatchingMode] = useState<'quick' | 'ranked' | null>(null);
	const [roomIdInput, setRoomIdInput] = useState('');

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleBackToHome = () => {
		playClickSound();
		navigateQuick('/game');
	};

	// 开始匹配
	const handleStartMatch = (mode: 'quick' | 'ranked') => {
		playClickSound();
		setIsMatching(true);
		setMatchingMode(mode);

		// 模拟匹配过程
		//const matchingMessage = mode === 'quick' ? '正在寻找对手...' : '正在进行排位匹配...';

		// 模拟匹配成功后跳转到对战房间
		setTimeout(() => {
			setIsMatching(false);
			setMatchingMode(null);
			navigateWithTransition('/battle-room', '进入对战房间...');
		}, 3000); // 3秒后匹配成功
	};

 // 创建房间
	const handleCreateRoom = () => {
		playClickSound();
		navigateWithTransition('/battle-room', '创建房间中...');
	};

	// 加入房间
	const handleJoinRoom = () => {
		if (!roomIdInput.trim()) {
			alert('请输入房间ID');
			return;
		}

		playClickSound();
		navigateWithTransition(`/battle-room?roomId=${roomIdInput.trim()}`, '加入房间中...');
	};

	return (
		<PageTransition className="card-page">
			<div className="battle-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBackToHome}>
						← 返回主页
					</button>
					<h1>对战大厅</h1>
					<div className="user-rank">
						<span className="rank-label">当前段位</span>
						<span className="rank-value">{user?.rank}</span>
					</div>
				</header>

				<main className="battle-main">
					<div className="battle-modes-container">
						<div className="mode-card primary-mode">
							<div className="mode-icon">⚔️</div>
							<h3>快速对战</h3>
							<p>与随机玩家进行对战，测试你的策略技巧</p>
							<div className="mode-rewards">
								<span>胜利奖励: +20 原石</span>
							</div>
							<button
								className={`mode-btn primary ${isMatching && matchingMode === 'quick' ? 'matching' : ''}`}
								onClick={() => handleStartMatch('quick')}
								disabled={isMatching}
							>
								{isMatching && matchingMode === 'quick' ? '匹配中...' : '开始匹配'}
							</button>
						</div>

						<div className="mode-card ranked-mode">
							<div className="mode-icon">🏆</div>
							<h3>排位赛</h3>
							<p>排位对战，提升你的段位获得更多奖励</p>
							<div className="mode-rewards">
								<span>胜利奖励: +50 原石 + 段位积分</span>
							</div>
							<button
								className={`mode-btn ranked ${isMatching && matchingMode === 'ranked' ? 'matching' : ''}`}
								onClick={() => handleStartMatch('ranked')}
								disabled={isMatching}
							>
								{isMatching && matchingMode === 'ranked' ? '匹配中...' : '排位匹配'}
							</button>
						</div>

						<div className="mode-card friend-mode">
							<div className="mode-icon">👥</div>
							<h3>好友对战</h3>
							<p>与好友进行友谊赛，切磋技艺</p>
							<div className="mode-rewards">
								<span>无奖励，纯粹的友谊切磋</span>
							</div>
							<div className="friend-battle-actions">
								<button
									className="mode-btn friend"
									onClick={handleCreateRoom}
									disabled={isMatching}
								>
									创建房间
								</button>
								<div className="join-room-container">
									<input
										type="text"
										placeholder="输入房间ID"
										value={roomIdInput}
										onChange={(e) => setRoomIdInput(e.target.value)}
										className="room-id-input"
									/>
									<button
										className="mode-btn join"
										onClick={handleJoinRoom}
										disabled={isMatching}
									>
										加入房间
									</button>
								</div>
							</div>
						</div>
					</div>

					<div className="battle-stats">
						<h3>战斗统计</h3>
						<div className="stats-grid">
							<div className="stat-item">
								<div className="stat-number">23</div>
								<div className="stat-label">总胜场</div>
							</div>
							<div className="stat-item">
								<div className="stat-number">15</div>
								<div className="stat-label">总败场</div>
							</div>
							<div className="stat-item">
								<div className="stat-number">60.5%</div>
								<div className="stat-label">胜率</div>
							</div>
							<div className="stat-item">
								<div className="stat-number">7</div>
								<div className="stat-label">连胜</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</PageTransition>
	);
};

export default BattlePage;
