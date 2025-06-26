import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import GameHomePage from '../pages/GameHomePage';

const AppRouter: React.FC = () => {
	const { isAuthenticated } = useAuthStore();

	console.log('🧭 [AppRouter] 路由组件渲染，当前认证状态:', isAuthenticated);
	console.log('🌐 [AppRouter] 当前路径:', window.location.pathname);

	return (
		<Router>
			<Routes>
				<Route
					path="/login"
					element={
						!isAuthenticated ? (
							(() => {
								console.log('📄 [AppRouter] 渲染登录页面');
								return <LoginPage />;
							})()
						) : (
							(() => {
								console.log('↩️ [AppRouter] 已登录，重定向到游戏页面');
								return <Navigate to="/game" replace />;
							})()
						)
					}
				/>
				<Route
					path="/register"
					element={
						!isAuthenticated ? (
							(() => {
								console.log('📄 [AppRouter] 渲染注册页面');
								return <RegisterPage />;
							})()
						) : (
							(() => {
								console.log('↩️ [AppRouter] 已登录，重定向到游戏页面');
								return <Navigate to="/game" replace />;
							})()
						)
					}
				/>
				<Route
					path="/game"
					element={
						isAuthenticated ? (
							(() => {
								console.log('🎮 [AppRouter] 渲染游戏主页');
								return <GameHomePage />;
							})()
						) : (
							(() => {
								console.log('🔒 [AppRouter] 未登录，重定向到登录页面');
								return <Navigate to="/login" replace />;
							})()
						)
					}
				/>
				<Route
					path="/"
					element={
						(() => {
							const targetPath = isAuthenticated ? "/game" : "/login";
							console.log(`🏠 [AppRouter] 根路径访问，重定向到: ${targetPath}`);
							return <Navigate to={targetPath} replace />;
						})()
					}
				/>
			</Routes>
		</Router>
	);
};

export default AppRouter;
