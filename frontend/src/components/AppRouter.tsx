import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import GameHomePage from '../pages/GameHomePage';
import BattlePage from '../pages/BattlePage';
import CardCollectionPage from '../pages/CardCollectionPage';
import WishPage from '../pages/WishPage';
import WishResultPage from '../pages/WishResultPage';
import BattleRulesPage from '../pages/BattleRulesPage';
import BattleTestPage from '../pages/BattleTestPage';
import BattleRoom from '../pages/BattleRoom';
import ShopPage from "../pages/ShopPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminRegisterPage from "../pages/AdminRegisterPage";
import {useUserToken, useUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";
import { autoLogoutManager } from '../utils/autoLogout';

// 内部路由组件，用于监听路由变化
const RouterContent: React.FC = () => {
	const location = useLocation();
	const userToken = useUserToken();
	const user = useUserInfo();
	const isAuthenticated = !!userToken;
	const isAdmin = user.permissionLevel >= 1;

	console.log('🧭 [AppRouter] 路由组件渲染，当前认证状态:', isAuthenticated);
	console.log('🌐 [AppRouter] 当前路径:', window.location.pathname);

	useEffect(() => {
		// 只在特定路由变化时执行logout
		const handleRouteChange = async () => {
			console.log('🛣️ [AppRouter] 路由变化:', location.pathname);
			
			// 注意：不要在这里自动logout，因为手动logout后会导航到/login
			// 这会导致重复logout和循环重定向
			// 手动logout应该在各个页面的logout函数中处理
		};

		handleRouteChange();
	}, [location.pathname, user, userToken]); // 只监听路径变化

	return (
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
							console.log('↩️ [AppRouter] (from register) 已登录，重定向到游戏页面');
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
				path="/battle"
				element={
					isAuthenticated ? (
						(() => {
							console.log('⚔️ [AppRouter] 渲染战斗页面');
							return <BattlePage />;
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
				path="/cards"
				element={
					isAuthenticated ? (
						(() => {
							console.log('🃏 [AppRouter] 渲染卡组页面');
							return <CardCollectionPage />;
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
				path="/wish"
				element={
					isAuthenticated ? (
						(() => {
							console.log('✨ [AppRouter] 渲染祈愿页面');
							return <WishPage />;
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
				path="/wish-result"
				element={
					isAuthenticated ? (
						(() => {
							console.log('🎁 [AppRouter] 渲染抽卡结果页面');
							return <WishResultPage />;
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
				path="/battle-room"
				element={
					isAuthenticated ? (
						(() => {
							console.log('🏟️ [AppRouter] 渲染对战房间');
							return <BattleRoom />;
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
				path="/battle-test"
				element={
					isAuthenticated ? (
						(() => {
							console.log('🧪 [AppRouter] 渲染对战测试页面');
							return <BattleTestPage />;
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
				path="/battle-rules"
				element={
					isAuthenticated ? (
						(() => {
							console.log('📖 [AppRouter] 渲染对战规则页面');
							return <BattleRulesPage />;
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
				path="/shop"
				element={
					isAuthenticated ? (
						(() => {
							console.log('📖 [AppRouter] 渲染商店页面');
							return <ShopPage />;
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
				path="/admin"
				element={
					isAuthenticated ? (
						isAdmin ? (
							(() => {
								console.log('👑 [AppRouter] 渲染管理员控制台');
								return <AdminDashboardPage />;
							})()
						) : (
							(() => {
								console.log('⛔ [AppRouter] 非管理员用户尝试访问管理页面，重定向到游戏页面',isAuthenticated,user.permissionLevel);
								return <Navigate to="/game" replace />;
							})()
						)
					) : (
						(() => {
							console.log('🔒 [AppRouter] 未登录，重定向到登录页面');
							return <Navigate to="/login" replace />;
						})()
					)
				}
			/>
			<Route
				path="/admin-register"
				element={
					!isAuthenticated ? (
						(() => {
							console.log('📄 [AppRouter] 渲染管理员注册页面');
							return <AdminRegisterPage />;
						})()
					) : (
						(() => {
							console.log('↩️ [AppRouter] （from admin register)已登录，重定向到游戏页面');
							return <Navigate to="/game" replace />;
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
	);
};

const AppRouter: React.FC = () => {
	return (
		<Router>
			<RouterContent />
		</Router>
	);
};

export default AppRouter;
