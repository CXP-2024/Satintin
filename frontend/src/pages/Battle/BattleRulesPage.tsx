import React, { useEffect } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import './BattleRulesPage.css';
import clickSound from '../../assets/sound/yinxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
const BattleRulesPage: React.FC = () => {
	const { navigateWithTransition } = usePageTransition();
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);
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
				<header className="rules-header">
					<button className="back-btn" onClick={handleGoBack}>
						<span className="back-icon">←</span>
						返回大厅
					</button>
					<h1 className="rules-title">对战规则说明</h1>
				</header>
				<main className="rules-content">
					<section className="rules-section">
						<h2 className="section-title">🎮 游戏基础设定</h2>
						<div className="rules-card">
							<p className="rule-desc">
								双人对战模式的回合制策略游戏。每回合双方同时选择行动，通过能量管理和策略选择击败对手。
							</p>
							<div className="game-stats">
								<div className="stat-item">
									<span className="stat-icon">❤️</span>
									<span className="stat-text">起始血量：6点</span>
								</div>
								<div className="stat-item">
									<span className="stat-icon">⚡</span>
									<span className="stat-text">起始能量：0点</span>
								</div>
								<div className="stat-item">
									<span className="stat-icon">🔄</span>
									<span className="stat-text">每回合结算制</span>
								</div>
							</div>
						</div>
					</section>
					<section className="rules-section">
						<h2 className="section-title">⚔️ 行动系统</h2>
						<p className="section-desc">每回合玩家可选择以下两种行动类型之一：</p>
						<div className="action-category">
							<h3 className="category-title">🛡️ 被动行动</h3>
							<div className="actions-grid">
								<div className="action-card passive bing">
									<div className="action-header">
										<span className="action-icon">🥧</span>
										<h4 className="action-name">饼类</h4>
									</div>
									<div className="action-effect">
										<div className="action-item">
											<strong>饼：</strong>获得1能量，伤害倍率×1
										</div>
										<div className="action-item">
											<strong>馕：</strong>获得2能量，伤害倍率×3
										</div>
										<p className="action-note">获得能量 + 伤害倍率</p>
									</div>
								</div>
								<div className="action-card passive dan">
									<div className="action-header">
										<span className="action-icon"></span>
										<h4 className="action-name">弹</h4>
									</div>
									<div className="action-effect">
										<p>效果：消耗所有能量</p>
									</div>
								</div>
								<div className="action-card passive fang">
									<div className="action-header">
										<span className="action-icon">🛡️</span>
										<h4 className="action-name">防类</h4>
									</div>
									<div className="action-effect">
										<div className="action-item">
											<strong>防[attacktype]：</strong>免疫指定类型攻击
										</div>
										<div className="action-item">
											<strong>防[class]：</strong>免疫指定class的攻击值
										</div>
										<div className="action-item">
											<strong>防[action]：</strong>免疫指定action的攻击
										</div>
										<p className="action-note">不消耗能量</p>
									</div>
								</div>
							</div>
						</div>
						<div className="action-category">
							<h3 className="category-title">⚔️ 主动行动</h3>
							<div className="attack-table-wrapper">
								<h4 className="table-title">基础攻击类型</h4>
								<table className="attack-table">
									<thead>
										<tr>
											<th>攻击类型</th>
											<th>攻击值</th>
											<th>防御值</th>
											<th>消耗能量</th>
											<th>攻击属性</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td><strong>撒</strong></td>
											<td>[普通]1</td>
											<td>5</td>
											<td>1</td>
											<td>基础攻击</td>
										</tr>
										<tr>
											<td><strong>tin</strong></td>
											<td>[普通]3</td>
											<td>1</td>
											<td>1</td>
											<td>基础攻击</td>
										</tr>
										<tr>
											<td><strong>南蛮</strong></td>
											<td>[穿透]3</td>
											<td>5</td>
											<td>3</td>
											<td>穿透类攻击</td>
										</tr>
										<tr>
											<td><strong>大闪</strong></td>
											<td>[穿透]4</td>
											<td>5</td>
											<td>4</td>
											<td>穿透类攻击</td>
										</tr>
										<tr>
											<td><strong>万箭</strong></td>
											<td>[防弹]2</td>
											<td>5</td>
											<td>3</td>
											<td>防弹类攻击</td>
										</tr>
										<tr>
											<td><strong>核爆</strong></td>
											<td>[核爆]5</td>
											<td>6</td>
											<td>5</td>
											<td>核爆攻击</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className="combination-rules">
								<h4 className="combo-title">行动组合规则</h4>
								<div className="combo-grid">
									<div className="combo-card">
										<h5> 单一行动</h5>
										<p>基础类型的叠加（n次）</p>
										<ul>
											<li>攻击值：n × 基础攻击值</li>
											<li>防御值：n × 基础防御值</li>
											<li>消耗能量：n × 基础消耗</li>
										</ul>
									</div>
									<div className="combo-card">
										<h5>🔀 复合行动</h5>
										<p>多种单一行动的组合</p>
										<ul>
											<li>攻击值：各单一行动攻击值之和</li>
											<li>防御值：各单一行动防御值之和</li>
											<li>消耗能量：各单一行动消耗能量之和</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</section>
					<section className="rules-section">
						<h2 className="section-title">🎯 结算机制</h2>
						<div className="settlement-step">
							<h3 className="step-title">1️⃣ 能量检查</h3>
							<div className="rules-card warning">
								<p><strong>爆点机制：</strong>如果任一方能量不足以支付消耗，该方"爆点"</p>
								<p><strong>爆点惩罚：</strong>-3血，回合结束</p>
							</div>
						</div>
						<div className="settlement-step">
							<h3 className="step-title">2️⃣ 血量结算</h3>
							<div className="settlement-scenarios">
								<div className="scenario-card">
									<h4>🛡️ 双方均被动行动</h4>
									<p>双方血量不变</p>
								</div>
								<div className="scenario-card">
									<h4>⚔️ 双方均主动行动</h4>
									<div className="scenario-details">
										<p><strong>存在复合行动时：</strong></p>
										<p>双方均扣血 = 对方攻击总和 - 己方防御总和</p>
										<p><strong>均为单一行动时：</strong></p>
										<ul>
											<li>同类型：按叠加次数抵消，剩余方造成攻击伤害，satin有特殊效果</li>
											<li>不同类型：按复合类型结算</li>
										</ul>
									</div>
								</div>
								<div className="scenario-card">
									<h4>⚔️🛡️ 一方主动，一方被动</h4>
									<div className="passive-damage-table">
										<table>
											<thead>
												<tr>
													<th>被动方类型</th>
													<th>受到伤害</th>
													<th>主动方受到伤害</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td><strong>饼</strong></td>
													<td>(攻击[普通]+攻击[穿透]+攻击[防弹]) × 伤害倍率</td>
													<td>0</td>
												</tr>
												<tr>
													<td><strong>防（防[attacktype]）</strong></td>
													<td>攻击[核爆]+攻击[穿透]</td>
													<td>0</td>
												</tr>
												<tr>
													<td><strong>弹</strong></td>
													<td>攻击[核爆]+攻击[防弹]</td>
													<td>攻击[普通]+攻击[穿透]</td>
												</tr>
												<tr>
													<td><strong>防[class]</strong></td>
													<td>除该class外的所有攻击</td>
													<td>攻击[普通]+攻击[穿透]+攻击[防弹]+攻击[核爆]</td>
												</tr>
												<tr>
													<td><strong>防[action]</strong></td>
													<td>若攻击方为该action则免疫，否则受到所有攻击</td>
													<td>0</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
						<div className="settlement-step">
							<h3 className="step-title">3️⃣ 胜负判定</h3>
							<div className="victory-rules">
								<div className="victory-item">
									<span className="victory-condition">🏆</span>
									<span>一方血量&gt;0，另一方&lt;0：血量&gt;0的一方获胜</span>
								</div>
								<div className="victory-item">
									<span className="victory-condition">⚖️</span>
									<span>双方血量均&lt;0：血量较高的一方获胜</span>
								</div>
								<div className="victory-item">
									<span className="victory-condition">🤝</span>
									<span>双方血量相同且均&lt;0：平局</span>
								</div>
							</div>
						</div>
						<div className="settlement-step">
							<h3 className="step-title">4️⃣ 回合结束</h3>
							<div className="rules-card">
								<p>若有人受到伤害，双方能量清零，进入下一回合</p>
							</div>
						</div>
					</section>
					<section className="rules-section">
						<h2 className="section-title">⚠️ 策略要点</h2>
						<div className="rules-card important">
							<ul className="important-list">
								<li>预判对手行动，选择最优策略</li>
								<li>利用复合行动创造优势</li>
								<li>掌握各种攻击类型的克制关系</li>
								<li>灵活运用被动行动进行防御和发育</li>
							</ul>
						</div>
					</section>
				</main>
			</div>
		</PageTransition>
	);
};
export default BattleRulesPage;
