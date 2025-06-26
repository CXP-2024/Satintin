import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/AdminServiceSimple';

const AdminDashboard: React.FC = () => {
	const [systemStats, setSystemStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const adminService = new AdminService();

	useEffect(() => {
		loadSystemStats();
	}, []);

	const loadSystemStats = async () => {
		try {
			const token = localStorage.getItem('authToken') || '';
			const stats = await adminService.getSystemStats(token);
			setSystemStats(stats);
		} catch (error) {
			console.error('加载系统统计失败:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleBanUser = async (userId: string, days: number) => {
		try {
			const token = localStorage.getItem('authToken') || '';
			const result = await adminService.banUser(token, userId, days);
			alert(result);
		} catch (error) {
			console.error('封禁用户失败:', error);
			alert('封禁失败');
		}
	};

	if (loading) {
		return <div style={{ padding: '20px' }}>加载中...</div>;
	}

	return (
		<div style={{ padding: '20px' }}>
			<h1>管理员面板</h1>

			<div style={{ marginBottom: '30px' }}>
				<h2>系统统计</h2>
				{systemStats ? (
					<div>
						<p>活跃用户数: {systemStats.activeUsers || '暂无数据'}</p>
						<p>总对战次数: {systemStats.totalBattles || '暂无数据'}</p>
						<p>抽卡次数: {systemStats.totalDraws || '暂无数据'}</p>
					</div>
				) : (
					<p>暂无统计数据</p>
				)}
			</div>

			<div>
				<h2>用户管理</h2>
				<div style={{ marginBottom: '20px' }}>
					<button
						onClick={() => {
							const userId = prompt('请输入要封禁的用户ID:');
							const days = prompt('请输入封禁天数:');
							if (userId && days) {
								handleBanUser(userId, parseInt(days));
							}
						}}
						style={{
							padding: '10px 20px',
							backgroundColor: '#ff4757',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						封禁用户
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
