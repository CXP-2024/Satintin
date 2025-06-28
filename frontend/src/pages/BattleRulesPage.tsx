import React, { useEffect } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './BattleRulesPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

const BattleRulesPage: React.FC = () => {
	const { navigateWithTransition } = usePageTransition();

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleGoBack = () => {
		console.log('🔙 [BattleRulesPage] 返回游戏大厅');
		playClickSound();
		navigateWithTransition('/game', '返回游戏大厅...');
	};

	return (
		<PageTransition className="battle-rules-page">
			<div className="rules-container">
				{/* 页面头部 */}
				<header className="rules-header">
					<button className="back-btn" onClick={handleGoBack}>
						<span className="back-icon">←</span>
						返回大厅
					</button>
					<h1 className="rules-title">对战规则说明</h1>
				</header>

				{/* 规则内容 */}
				<main className="rules-content">
					{/* 核心玩法介绍 */}
					<section className="rules-section">
						<h2 className="section-title">🎮 核心玩法：饼防撒游戏</h2>
						<div className="rules-card">
							<p className="rule-desc">
								这是一款策略性的回合制卡牌对战游戏。初始状态下，每位玩家拥有6点血量和0点能量。
								每回合双方玩家同时选择行动，互相不知晓对方的选择。
							</p>
							<div className="game-stats">
								<div className="stat-item">
									<span className="stat-icon">❤️</span>
									<span className="stat-text">初始血量：6点</span>
								</div>
								<div className="stat-item">
									<span className="stat-icon">⚡</span>
									<span className="stat-text">初始能量：0点</span>
								</div>
							</div>
						</div>
					</section>

					{/* 基础行动 */}
					<section className="rules-section">
						<h2 className="section-title">⚔️ 基础行动</h2>
						<div className="actions-grid">
							<div className="action-card bing">
								<div className="action-header">
									<span className="action-icon">🥧</span>
									<h3 className="action-name">饼</h3>
								</div>
								<div className="action-effect">
									<p>效果：+1能量</p>
									<p className="action-condition">
										⚠️ 若对方当回合出撒，回合结束时血量-1
									</p>
								</div>
							</div>

							<div className="action-card fang">
								<div className="action-header">
									<span className="action-icon">🛡️</span>
									<h3 className="action-name">防</h3>
								</div>
								<div className="action-effect">
									<p>效果：免疫撒的伤害</p>
									<p className="action-condition">
										🔒 完全防御，不受撒的影响
									</p>
								</div>
							</div>

							<div className="action-card sa">
								<div className="action-header">
									<span className="action-icon">⚡</span>
									<h3 className="action-name">撒</h3>
								</div>
								<div className="action-effect">
									<p>消耗：1点能量</p>
									<p className="action-condition">
										💥 若对方当回合出饼，对方血量-1
									</p>
								</div>
							</div>
						</div>
					</section>

					{/* 胜利条件 */}
					<section className="rules-section">
						<h2 className="section-title">🏆 胜利条件</h2>
						<div className="rules-card victory">
							<p className="victory-text">
								当某一回合后，一方玩家血量归0，则另一方获胜！
							</p>
						</div>
					</section>

					{/* 卡牌系统 */}
					<section className="rules-section">
						<h2 className="section-title">🃏 卡牌加成系统</h2>
						<div className="rules-card">
							<p className="card-intro">每位玩家可以携带三张卡牌，为基础行动提供强力加成：</p>
						</div>

						<div className="cards-grid">
							<div className="card-type penetrate">
								<div className="card-header">
									<span className="card-icon">🗡️</span>
									<h3 className="card-name">穿透卡牌</h3>
								</div>
								<div className="card-effect">
									<p>强化你的撒攻击</p>
									<div className="effect-levels">
										<div className="level common">
											<span className="level-name">普通 (三星)</span>
											<span className="level-effect">5%概率穿透防御</span>
										</div>
										<div className="level rare">
											<span className="level-name">稀有 (四星)</span>
											<span className="level-effect">15%概率穿透防御</span>
										</div>
										<div className="level legendary">
											<span className="level-name">传说 (五星)</span>
											<span className="level-effect">33%概率穿透防御</span>
										</div>
									</div>
								</div>
							</div>

							<div className="card-type develop">
								<div className="card-header">
									<span className="card-icon">🌱</span>
									<h3 className="card-name">发育卡牌</h3>
								</div>
								<div className="card-effect">
									<p>强化你的饼发育</p>
									<div className="effect-levels">
										<div className="level common">
											<span className="level-name">普通 (三星)</span>
											<span className="level-effect">5%概率获得2点能量</span>
										</div>
										<div className="level rare">
											<span className="level-name">稀有 (四星)</span>
											<span className="level-effect">15%概率获得2点能量</span>
										</div>
										<div className="level legendary">
											<span className="level-name">传说 (五星)</span>
											<span className="level-effect">33%概率获得2点能量</span>
										</div>
									</div>
								</div>
							</div>

							<div className="card-type reflect">
								<div className="card-header">
									<span className="card-icon">🔄</span>
									<h3 className="card-name">反弹卡牌</h3>
								</div>
								<div className="card-effect">
									<p>强化你的防御</p>
									<div className="effect-levels">
										<div className="level common">
											<span className="level-name">普通 (三星)</span>
											<span className="level-effect">5%概率反弹撒攻击</span>
										</div>
										<div className="level rare">
											<span className="level-name">稀有 (四星)</span>
											<span className="level-effect">15%概率反弹撒攻击</span>
										</div>
										<div className="level legendary">
											<span className="level-name">传说 (五星)</span>
											<span className="level-effect">33%概率反弹撒攻击</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* 重要提示 */}
					<section className="rules-section">
						<h2 className="section-title">⚠️ 重要提示</h2>
						<div className="rules-card important">
							<ul className="important-list">
								<li>穿透效果优先于反弹效果判定</li>
								<li>卡牌稀有度越高，触发概率越大</li>
								<li>不同稀有度的卡牌在卡池中的出现概率不同</li>
								<li>合理搭配卡牌是获胜的关键</li>
							</ul>
						</div>
					</section>
				</main>
			</div>
		</PageTransition>
	);
};

export default BattleRulesPage;
