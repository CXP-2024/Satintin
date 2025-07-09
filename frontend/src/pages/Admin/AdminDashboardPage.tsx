import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import './AdminDashboardPage.css';
import clickSound from '../../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { clearUserInfo, useUserInfo, initUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import PlayerManagement from '../../components/admin/PlayerManagement';
import ReportHandling from '../../components/admin/ReportHandling';
import { useAdminUsers } from '../../components/admin/hooks/useAdminUsers';
import { useAdminReports } from '../../components/admin/hooks/useAdminReports';
import { AdminTab } from '../../types/adminDashboard';

const AdminDashboardPage: React.FC = () => {
  const user = useUserInfo();
  const { navigateWithTransition } = usePageTransition();
  const [activeTab, setActiveTab] = useState<AdminTab>('players');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    userList,
    usersLoading,
    usersError,
    loadUserAllInfo
  } = useAdminUsers();

  const {
    reports,
    reportsLoading,
    reportsError,
    loadReports
  } = useAdminReports();

  // 初始化音效
  useEffect(() => {
    SoundUtils.setClickSoundSource(clickSound);
  }, []);

  // 检查管理员权限并加载数据
  useEffect(() => {
    console.log('🔍 [AdminDashboard] 权限检查 - 用户:', user);
    console.log('🔍 [AdminDashboard] 权限等级:', user?.permissionLevel);
    
    if (user && user.permissionLevel >= 1) {
      console.log('✅ [AdminDashboard] 管理员权限验证通过，开始加载数据');
      loadReports();
      loadUserAllInfo();
    } else {
      console.log('⏳ [AdminDashboard] 用户信息未加载或权限不足');
    }
  }, [user]);

  const handleLogout = () => {
    console.log('🚪 [AdminDashboard] 管理员手动退出登录');
    playClickSound();
    
    localStorage.removeItem('adminToken');
    clearUserInfo();
    initUserToken();
    navigateWithTransition('/login');
  };

  const handleTabChange = (tab: AdminTab) => {
    playClickSound();
    setActiveTab(tab);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
  };

  const pendingReportsCount = reports.filter(report => !report.isResolved).length;
  const onlineUsersCount = userList.filter(user => user.isOnline).length;

  return (
    <PageTransition className="admin-dashboard">
      <div className="admin-container">
        {/* 顶部状态栏 */}
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>管理员控制台</h1>
            <div className="status-indicators">
              {(reportsLoading || usersLoading) && <span className="loading-indicator">加载中...</span>}
              {(reportsError || usersError) && (
                <span className="error-indicator">
                  错误: {reportsError || usersError}
                </span>
              )}
              <span className="stats-indicator">
                在线用户: {onlineUsersCount} | 总用户: {userList.length}
              </span>
            </div>
          </div>
          <div className="admin-header-right">
            <div className="admin-user-info">
              <span className="admin-username">{user?.userName}</span>
              <span className="admin-badge">管理员</span>
            </div>
            <button className="admin-logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="admin-main">
          {/* 标签页导航 */}
          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${activeTab === 'players' ? 'active' : ''}`}
              onClick={() => handleTabChange('players')}
            >
              玩家管理
              {userList.length > 0 && (
                <span className="admin-count-badge">{userList.length}</span>
              )}
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => handleTabChange('reports')}
            >
              举报处理
              {pendingReportsCount > 0 && (
                <span className="admin-badge-notification">{pendingReportsCount}</span>
              )}
            </button>
          </div>

          {/* 搜索栏 */}
          <div className="admin-search">
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <button 
              className={`refresh-btn ${(reportsLoading || usersLoading) ? 'loading' : ''}`}
              onClick={() => {
                playClickSound();
                if (activeTab === 'players') {
                  loadUserAllInfo();
                } else {
                  loadReports();
                }
              }}
              disabled={reportsLoading || usersLoading}
              title={activeTab === 'players' ? '刷新用户数据' : '刷新举报数据'}
            >
              <svg 
                className="refresh-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="m20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              <span className="refresh-text">
                {(reportsLoading || usersLoading) ? '刷新中...' : '刷新'}
              </span>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="admin-content">
            {activeTab === 'players' && (
              <PlayerManagement 
                searchTerm={searchTerm}
                userList={userList}
                loading={usersLoading}
                error={usersError}
                onRefresh={loadUserAllInfo}
                onUserUpdated={loadUserAllInfo}
              />
            )}

            {activeTab === 'reports' && (
              <ReportHandling 
                searchTerm={searchTerm}
                reports={reports}
                loading={reportsLoading}
                error={reportsError}
                onRefresh={loadReports}
                onReportUpdated={loadReports}
              />
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminDashboardPage;
