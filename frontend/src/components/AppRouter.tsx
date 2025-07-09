import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from '../pages/User/LoginPage';
import RegisterPage from '../pages/User/RegisterPage';
import GameHomePage from '../pages/GameHomePage';
import BattlePage from '../pages/Battle/BattlePage';
import CardCollectionPage from '../pages/Card/CardCollectionPage';
import WishPage from '../pages/Card/WishPage';
import WishResultPage from '../pages/Card/WishResultPage';
import BattleRulesPage from '../pages/Battle/BattleRulesPage';
import BattleTestPage from '../pages/Battle/BattleTestPage';
import BattleRoom from '../pages/Battle/BattleRoom';
import ShopPage from "../pages/Asset/ShopPage";
import AdminDashboardPage from "../pages/Admin/AdminDashboardPage";
import AdminRegisterPage from "../pages/Admin/AdminRegisterPage";
import { useUserToken, useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import ChatBox from './gameHome/ChatBox';
import ChatPage from 'pages/Chat/ChatPage';

// 内部路由组件，用于监听路由变化
const RouterContent: React.FC = () => {
	const location = useLocation();
	const userToken = useUserToken();
	const user = useUserInfo();
	const isAuthenticated = !!userToken;
	const isAdmin = user.permissionLevel >= 1;

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
							return <LoginPage />;
						})()
					) : (
						(() => {
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
							return <RegisterPage />;
						})()
					) : (
						(() => {
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
							return <GameHomePage />;
						})()
					) : (
						(() => {
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
							return <BattlePage />;
						})()
					) : (
						(() => {
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
							return <CardCollectionPage />;
						})()
					) : (
						(() => {
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
							return <WishPage />;
						})()
					) : (
						(() => {
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
							return <WishResultPage />;
						})()
					) : (
						(() => {
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
							return <BattleRoom />;
						})()
					) : (
						(() => {
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
							return <BattleTestPage />;
						})()
					) : (
						(() => {
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
							return <BattleRulesPage />;
						})()
					) : (
						(() => {
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
							return <ShopPage />;
						})()
					) : (
						(() => {
							return <Navigate to="/login" replace />;
						})()
					)
				}
			/>
			<Route
				path="/chat"
				element={
					isAuthenticated ? (
						(() => {
							return <ChatPage />;
						})()
					) : (
						(() => {
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
								return <AdminDashboardPage />;
							})()
						) : (
							(() => {
								console.log('⛔ [AppRouter] 非管理员用户尝试访问管理页面，重定向到游戏页面', isAuthenticated, user.permissionLevel);
								return <Navigate to="/game" replace />;
							})()
						)
					) : (
						(() => {
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
							return <AdminRegisterPage />;
						})()
					) : (
						(() => {
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
