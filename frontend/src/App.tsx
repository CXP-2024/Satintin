import React, { useEffect } from 'react';
import AppRouter from './components/AppRouter';
import GlobalLoadingOverlay from './components/GlobalLoadingOverlay';
import { AlertProvider } from './components/common/AlertProvider';
import { useUserInfo, getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import { autoLogoutManager } from './utils/autoLogout';
import './App.css';

function App() {
  const user = useUserInfo();
  const userToken = getUserToken();

  useEffect(() => {
    // 只为普通用户启动自动logout监听，不为管理员启动
    if (user && userToken && user.permissionLevel < 1) {
      console.log('🎯 [App] 普通用户已登录，启动自动logout监听');
      autoLogoutManager.startListening();
      // 确保token缓存是最新的
      autoLogoutManager.updateToken();
    } else {
      console.log('🎯 [App] 管理员用户或未登录，停止自动logout监听');
      autoLogoutManager.stopListening();
    }

    // 组件卸载时清理
    return () => {
      console.log('🧹 [App] 应用组件卸载');
      autoLogoutManager.stopListening();
    };
  }, [user, userToken]);

  return (
    <div className="App">
      <AlertProvider enableWindowAlertOverride={true}>
        <AppRouter />
        <GlobalLoadingOverlay />
      </AlertProvider>
    </div>
  );
}

export default App;
