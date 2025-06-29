import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import NavMenu from './NavMenu';
import {useUserToken} from "Plugins/CommonUtils/Store/UserInfoStore";

const AppRouter: React.FC = () => {
	const userToken = useUserToken();
	const isAuthenticated = !!userToken;

	console.log('🧭 [AppRouter] 路由组件渲染，当前认证状态:', isAuthenticated);
	console.log('🌐 [AppRouter] 当前路径:', window.location.pathname);

	return (
		<Router>
			<NavMenu />
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
