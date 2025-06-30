import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './AdminDashboardPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { clearUserInfo, useUserInfo, initUserToken, getUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import PlayerManagement from '../components/PlayerManagement';
import ReportHandling from '../components/ReportHandling';

// 模拟数据 - 举报列表 (仅用于显示通知数量)
const mockReports = [
  {
    id: 'report-001',
    status: '待处理'
  },
  {
    id: 'report-002',
    status: '待处理'
  },
  {
    id: 'report-003',
    status: '待处理'
  },
  {
    id: 'report-004',
    status: '待处理'
  },
  {
    id: 'report-005',
    status: '待处理'
  },
  {
    id: 'report-006',
    status: '待处理'
  },
  {
    id: 'report-007',
    status: '已处理'
  },
  {
    id: 'report-008',
    status: '已处理'
  }
];

const AdminDashboardPage: React.FC = () => {
  const user = useUserInfo();
  const { navigateWithTransition } = usePageTransition();
  const [activeTab, setActiveTab] = useState<'players' | 'reports'>('players');
  const [searchTerm, setSearchTerm] = useState('');

  // 初始化音效
  useEffect(() => {
    SoundUtils.setClickSoundSource(clickSound);
  }, []);

  // 播放按钮点击音效
  const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
  };

  // 检查是否为管理员
  useEffect(() => {
    if (user && user.permissionLevel < 10) {
      console.log('⚠️ [AdminDashboard] 非管理员用户尝试访问管理页面');
      navigateWithTransition('/game');
    }
  }, [user, navigateWithTransition]);

  const handleLogout = () => {
    console.log('🚪 [AdminDashboard] 管理员退出登录');
    playClickSound();
    clearUserInfo();
    initUserToken();
    navigateWithTransition('/login');
  };

  const handleTabChange = (tab: 'players' | 'reports') => {
    playClickSound();
    setActiveTab(tab);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <PageTransition className="admin-dashboard">
      <div className="admin-container">
        {/* 顶部状态栏 */}
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>管理员控制台</h1>
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
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => handleTabChange('reports')}
            >
              举报处理
              {mockReports.filter(r => r.status === '待处理').length > 0 && (
                <span className="admin-badge-notification">{mockReports.filter(r => r.status === '待处理').length}</span>
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
          </div>

          {/* 内容区域 */}
          <div className="admin-content">
            {/* 玩家管理 */}
            {activeTab === 'players' && (
              <PlayerManagement searchTerm={searchTerm} />
            )}

            {/* 举报处理 */}
            {activeTab === 'reports' && (
              <ReportHandling searchTerm={searchTerm} />
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminDashboardPage;
