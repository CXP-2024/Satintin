import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './AdminDashboardPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { clearUserInfo, useUserInfo, initUserToken, getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import PlayerManagement from '../components/PlayerManagement';
import ReportHandling from '../components/ReportHandling';
import { ViewAllReportsMessage } from 'Plugins/AdminService/APIs/ViewAllReportsMessage';
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';
import { ViewUserAllInfoMessage } from 'Plugins/AdminService/APIs/ViewUserAllInfoMessage';
import { UserAllInfo } from 'Plugins/AdminService/Objects/UserAllInfo';

const AdminDashboardPage: React.FC = () => {
  const user = useUserInfo();
  const { navigateWithTransition } = usePageTransition();
  const [activeTab, setActiveTab] = useState<'players' | 'reports'>('players');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 替换 mockReports 为真实数据
  const [reports, setReports] = useState<CheatingReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // 新增：用户信息管理状态
  const [userAllInfoList, setUserAllInfoList] = useState<UserAllInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // 初始化音效
  useEffect(() => {
    SoundUtils.setClickSoundSource(clickSound);
  }, []);

  // 加载用户完整信息
  const loadUserAllInfo = () => {
    if (!user || user.permissionLevel < 1) return;
    
    setUsersLoading(true);
    setUsersError(null);

    const adminToken = getUserToken();
    
    if (!adminToken) {
      setUsersError('管理员token不存在，请重新登录');
      setUsersLoading(false);
      return;
    }

    console.log('👥 [AdminDashboard] 开始加载用户完整信息，使用token:', adminToken);
    
    new ViewUserAllInfoMessage(adminToken, "").send(
      (response: string) => {
        try {
          console.log('👥 [AdminDashboard] 用户信息原始响应:', response);
          
          // 解析响应数据
          let userData = JSON.parse(response);
          console.log('👥 [AdminDashboard] 用户信息解析结果:', userData);
          
          // 如果是字符串，再解析一次
          if (typeof userData === 'string') {
            userData = JSON.parse(userData);
            console.log('👥 [AdminDashboard] 用户信息二次解析结果:', userData);
          }
          
          if (!Array.isArray(userData)) {
            throw new Error(`期望数组，但得到: ${typeof userData}`);
          }
          
          const userObjects = userData.map((data: any) => 
            new UserAllInfo(
              data.userID,
              data.username,
              data.banDays,
              data.isOnline,
              data.stoneAmount
            )
          );
          
          console.log('👥 [AdminDashboard] 成功创建用户信息对象:', userObjects);
          setUserAllInfoList(userObjects);
          setUsersLoading(false);
        } catch (error) {
          console.error('❌ [AdminDashboard] 解析用户信息失败:', error);
          setUsersError('解析用户信息失败');
          setUsersLoading(false);
        }
      },
      (error: any) => {
        console.error('❌ [AdminDashboard] 获取用户信息失败:', error);
        setUsersError('获取用户信息失败');
        setUsersLoading(false);
      }
    );
  };

  // 加载举报数据
  const loadReports = () => {
    if (!user || user.permissionLevel < 1) return;
    
    setReportsLoading(true);
    setReportsError(null);

    // 使用管理员token，从多个可能的来源获取
    const adminToken = getUserToken();
    
    if (!adminToken) {
      setReportsError('管理员token不存在，请重新登录');
      setReportsLoading(false);
      return;
    }

    console.log('📋 [AdminDashboard] 开始加载举报记录，使用token:', adminToken);
    
    new ViewAllReportsMessage(adminToken).send(
      (response: string) => {
        try {
          console.log('📋 [AdminDashboard] 原始响应:', response);
          
          // 第一次解析
          let firstParse = JSON.parse(response);
          console.log('📋 [AdminDashboard] 第一次解析结果:', firstParse);
          console.log('📋 [AdminDashboard] 第一次解析类型:', typeof firstParse);
          
          // 如果第一次解析后还是字符串，再解析一次
          let reportData = firstParse;
          if (typeof firstParse === 'string') {
            reportData = JSON.parse(firstParse);
            console.log('📋 [AdminDashboard] 第二次解析结果:', reportData);
          }
          
          console.log('📋 [AdminDashboard] 最终数据类型:', typeof reportData);
          console.log('📋 [AdminDashboard] 是否为数组:', Array.isArray(reportData));
          
          if (!Array.isArray(reportData)) {
            throw new Error(`期望数组，但得到: ${typeof reportData}`);
          }
          
          const reportObjects = reportData.map((data: any) => 
            new CheatingReport(
              data.reportID,
              data.reportingUserID,
              data.reportedUserID,
              data.reportReason,
              data.isResolved,
              data.reportTime
            )
          );
          
          console.log('📋 [AdminDashboard] 成功创建举报对象:', reportObjects);
          setReports(reportObjects);
          setReportsLoading(false);
        } catch (error) {
          console.error('❌ [AdminDashboard] 解析举报数据失败:', error);
          setReportsError('解析举报数据失败');
          setReportsLoading(false);
        }
      },
      (error: any) => {
        console.error('❌ [AdminDashboard] 获取举报记录失败:', error);
        setReportsError('获取举报记录失败');
        setReportsLoading(false);
      }
    );
  };

  // 播放按钮点击音效
  const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
  };

  // 检查管理员权限并加载数据
  useEffect(() => {
    console.log('🔍 [AdminDashboard] 权限检查 - 用户:', user);
    console.log('🔍 [AdminDashboard] 权限等级:', user?.permissionLevel);

    
    // 如果是管理员，加载所有数据
    if (user && user.permissionLevel >= 1) {
      console.log('✅ [AdminDashboard] 管理员权限验证通过，开始加载数据');
      loadReports();
      loadUserAllInfo(); // 新增：加载用户信息
    } else {
      console.log('⏳ [AdminDashboard] 用户信息未加载或权限不足');
    }
  }, [user]);

  const handleLogout = () => {
    console.log('🚪 [AdminDashboard] 管理员手动退出登录');
    playClickSound();
    
    // 清除管理员特定的token
    localStorage.removeItem('adminToken');
    
    // 清除本地状态
    clearUserInfo();
    initUserToken();
    
    // 立即导航到登录页
    navigateWithTransition('/login');
  };

  const handleTabChange = (tab: 'players' | 'reports') => {
    playClickSound();
    setActiveTab(tab);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 刷新举报数据 - 传递给子组件使用
  const refreshReports = () => {
    console.log('🔄 [AdminDashboard] 手动刷新举报数据');
    loadReports();
  };

  // 刷新用户数据
  const refreshUsers = () => {
    console.log('🔄 [AdminDashboard] 手动刷新用户数据');
    loadUserAllInfo();
  };

  // 处理举报状态更新的回调
  const onReportUpdated = () => {
    console.log('📝 [AdminDashboard] 举报状态已更新，刷新列表');
    loadReports(); // 重新加载数据以反映最新状态
  };

  // 处理用户信息更新的回调
  const onUserUpdated = () => {
    console.log('📝 [AdminDashboard] 用户信息已更新，刷新列表');
    loadUserAllInfo(); // 重新加载用户数据
  };

  // 计算待处理举报数量
  const pendingReportsCount = reports.filter(report => !report.isResolved).length;
  
  // 计算在线用户数量
  const onlineUsersCount = userAllInfoList.filter(user => user.isOnline).length;

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
                在线用户: {onlineUsersCount} | 总用户: {userAllInfoList.length}
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
              {userAllInfoList.length > 0 && (
                <span className="admin-count-badge">{userAllInfoList.length}</span>
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
                  refreshUsers();
                } else {
                  refreshReports();
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
            {/* 玩家管理 */}
            {activeTab === 'players' && (
              <PlayerManagement 
                searchTerm={searchTerm}
                userAllInfoList={userAllInfoList}
                loading={usersLoading}
                error={usersError}
                onRefresh={refreshUsers}
                onUserUpdated={onUserUpdated}
              />
            )}

            {/* 举报处理 */}
            {activeTab === 'reports' && (
              <ReportHandling 
                searchTerm={searchTerm}
                reports={reports}
                loading={reportsLoading}
                error={reportsError}
                onRefresh={refreshReports}
                onReportUpdated={onReportUpdated}
              />
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminDashboardPage;
