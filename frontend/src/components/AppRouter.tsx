import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import GameLobby from '../pages/GameLobby';
import BattlePage from '../pages/BattlePage';

/**
 * 应用路由配置
 */
const AppRouter: React.FC = () => {
	return (
		<Router>
			<Routes>
				{/* 默认路由重定向到登录页 */}
				<Route path="/" element={<Navigate to="/login" replace />} />

				{/* 登录页面 */}
				<Route path="/login" element={<LoginPage />} />

				{/* 游戏大厅 */}
				<Route path="/lobby" element={<GameLobby />} />

				{/* 对战页面 */}
				<Route path="/battle/:roomId" element={<BattlePage />} />

				{/* 管理员面板 */}
				<Route path="/admin" element={<AdminDashboard />} />

				{/* 404页面 */}
				<Route path="*" element={<div>页面不存在</div>} />
			</Routes>
		</Router>
	);
};

export default AppRouter;
