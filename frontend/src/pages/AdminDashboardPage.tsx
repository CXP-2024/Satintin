import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './AdminDashboardPage.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { clearUserInfo, useUserInfo, initUserToken, getUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

// 模拟数据 - 玩家列表
const mockPlayers = [
  {
    id: 'user-001',
    username: '旅行者',
    email: 'traveler@example.com',
    stoneAmount: 12500,
    registerTime: '2023-05-15',
    lastLogin: '2023-10-01',
    status: '正常',
    reports: 0
  },
  {
    id: 'user-002',
    username: '派蒙',
    email: 'paimon@example.com',
    stoneAmount: 8700,
    registerTime: '2023-06-20',
    lastLogin: '2023-09-30',
    status: '正常',
    reports: 0
  },
  {
    id: 'user-003',
    username: '钟离',
    email: 'zhongli@example.com',
    stoneAmount: 35000,
    registerTime: '2023-04-10',
    lastLogin: '2023-10-02',
    status: '正常',
    reports: 0
  },
  {
    id: 'user-004',
    username: '雷电将军',
    email: 'raiden@example.com',
    stoneAmount: 28000,
    registerTime: '2023-07-05',
    lastLogin: '2023-09-28',
    status: '正常',
    reports: 2
  },
  {
    id: 'user-005',
    username: '胡桃',
    email: 'hutao@example.com',
    stoneAmount: 19500,
    registerTime: '2023-08-12',
    lastLogin: '2023-10-01',
    status: '正常',
    reports: 1
  }
];

// 模拟数据 - 举报列表
const mockReports = [
  {
    id: 'report-001',
    reporterId: 'user-002',
    reporterName: '派蒙',
    targetId: 'user-004',
    targetName: '雷电将军',
    reason: '使用不当语言',
    date: '2023-09-28',
    status: '待处理'
  },
  {
    id: 'report-002',
    reporterId: 'user-003',
    reporterName: '钟离',
    targetId: 'user-004',
    targetName: '雷电将军',
    reason: '涉嫌作弊',
    date: '2023-09-30',
    status: '待处理'
  },
  {
    id: 'report-003',
    reporterId: 'user-001',
    reporterName: '旅行者',
    targetId: 'user-005',
    targetName: '胡桃',
    reason: '不当行为',
    date: '2023-09-29',
    status: '待处理'
  }
];

// 模拟数据 - 交易记录
const mockTransactions = [
  {
    id: 'trans-001',
    userId: 'user-001',
    username: '旅行者',
    type: '充值',
    amount: 1200,
    date: '2023-09-25',
    status: '成功'
  },
  {
    id: 'trans-002',
    userId: 'user-003',
    username: '钟离',
    type: '消费',
    amount: -800,
    date: '2023-09-26',
    status: '成功'
  },
  {
    id: 'trans-003',
    userId: 'user-004',
    username: '雷电将军',
    type: '充值',
    amount: 3000,
    date: '2023-09-27',
    status: '成功'
  },
  {
    id: 'trans-004',
    userId: 'user-002',
    username: '派蒙',
    type: '消费',
    amount: -1500,
    date: '2023-09-28',
    status: '成功'
  },
  {
    id: 'trans-005',
    userId: 'user-005',
    username: '胡桃',
    type: '充值',
    amount: 2500,
    date: '2023-09-29',
    status: '成功'
  }
];

const AdminDashboardPage: React.FC = () => {
  const user = useUserInfo();
  const { navigateWithTransition } = usePageTransition();
  const [activeTab, setActiveTab] = useState<'players' | 'reports' | 'transactions'>('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

  const handleTabChange = (tab: 'players' | 'reports' | 'transactions') => {
    playClickSound();
    setActiveTab(tab);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewPlayer = (player: any) => {
    playClickSound();
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const handleViewReport = (report: any) => {
    playClickSound();
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };

  const handleResolveReport = (reportId: string) => {
    playClickSound();
    console.log(`🛡️ [AdminDashboard] 处理举报 ${reportId}`);
    // 在实际应用中，这里会调用API来处理举报
    setShowReportModal(false);
  };

  const handleBanPlayer = (playerId: string, days: number) => {
    playClickSound();
    console.log(`🔨 [AdminDashboard] 封禁玩家 ${playerId} ${days}天`);
    // 在实际应用中，这里会调用API来封禁玩家
    setShowPlayerModal(false);
  };

  // 过滤玩家列表
  const filteredPlayers = mockPlayers.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 过滤举报列表
  const filteredReports = mockReports.filter(report =>
    report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 过滤交易记录
  const filteredTransactions = mockTransactions.filter(transaction =>
    transaction.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <button
              className={`admin-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => handleTabChange('transactions')}
            >
              交易记录
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
              <div className="players-section">
                <h2>玩家列表</h2>
                <div className="admin-data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>用户名</th>
                        <th>邮箱</th>
                        <th>原石数量</th>
                        <th>注册时间</th>
                        <th>最后登录</th>
                        <th>状态</th>
                        <th>举报数</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlayers.map(player => (
                        <tr key={player.id}>
                          <td>{player.id}</td>
                          <td>{player.username}</td>
                          <td>{player.email}</td>
                          <td>
                            <div className="stone-amount">
                              <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                              {player.stoneAmount}
                            </div>
                          </td>
                          <td>{player.registerTime}</td>
                          <td>{player.lastLogin}</td>
                          <td>
                            <span className={`admin-status-badge ${player.status === '正常' ? 'admin-status-normal' : 'admin-status-banned'}`}>
                              {player.status}
                            </span>
                          </td>
                          <td>
                            {player.reports > 0 ? (
                              <span className="admin-reports-badge">{player.reports}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td>
                            <button
                              className="admin-action-btn admin-view-btn"
                              onClick={() => handleViewPlayer(player)}
                            >
                              查看
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 举报处理 */}
            {activeTab === 'reports' && (
              <div className="reports-section">
                <h2>举报列表</h2>
                <div className="admin-data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>举报者</th>
                        <th>被举报者</th>
                        <th>原因</th>
                        <th>日期</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map(report => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.reporterName}</td>
                          <td>{report.targetName}</td>
                          <td>{report.reason}</td>
                          <td>{report.date}</td>
                          <td>
                            <span className={`admin-status-badge ${report.status === '待处理' ? 'admin-status-pending' : 'admin-status-resolved'}`}>
                              {report.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="admin-action-btn admin-view-btn"
                              onClick={() => handleViewReport(report)}
                            >
                              处理
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 交易记录 */}
            {activeTab === 'transactions' && (
              <div className="transactions-section">
                <h2>交易记录</h2>
                <div className="admin-data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>用户</th>
                        <th>类型</th>
                        <th>金额</th>
                        <th>日期</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(transaction => (
                        <tr key={transaction.id}>
                          <td>{transaction.id}</td>
                          <td>{transaction.username}</td>
                          <td>{transaction.type}</td>
                          <td className={transaction.amount > 0 ? 'amount-positive' : 'amount-negative'}>
                            <div className="stone-amount">
                              <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                              {transaction.amount}
                            </div>
                          </td>
                          <td>{transaction.date}</td>
                          <td>
                            <span className={`admin-status-badge ${transaction.status === '成功' ? 'admin-status-success' : 'admin-status-failed'}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 玩家详情模态框 */}
        {showPlayerModal && selectedPlayer && (
          <div className="modal-overlay">
            <div className="modal-container player-modal">
              <div className="modal-header">
                <h3>玩家详情</h3>
                <button className="close-btn" onClick={handleClosePlayerModal}>×</button>
              </div>
              <div className="modal-content">
                <div className="player-info">
                  <div className="info-row">
                    <span className="info-label">ID:</span>
                    <span className="info-value">{selectedPlayer.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">用户名:</span>
                    <span className="info-value">{selectedPlayer.username}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">邮箱:</span>
                    <span className="info-value">{selectedPlayer.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">原石数量:</span>
                    <span className="info-value">
                      <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                      {selectedPlayer.stoneAmount}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">注册时间:</span>
                    <span className="info-value">{selectedPlayer.registerTime}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">最后登录:</span>
                    <span className="info-value">{selectedPlayer.lastLogin}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">状态:</span>
                    <span className={`status-badge ${selectedPlayer.status === '正常' ? 'status-normal' : 'status-banned'}`}>
                      {selectedPlayer.status}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">举报数:</span>
                    <span className="info-value">{selectedPlayer.reports}</span>
                  </div>
                </div>
                <div className="admin-actions">
                  <h4>管理操作</h4>
                  <div className="action-buttons">
                    <button
                      className="admin-action-btn admin-ban-btn"
                      onClick={() => handleBanPlayer(selectedPlayer.id, 1)}
                    >
                      封禁1天
                    </button>
                    <button
                      className="admin-action-btn admin-ban-btn"
                      onClick={() => handleBanPlayer(selectedPlayer.id, 7)}
                    >
                      封禁7天
                    </button>
                    <button
                      className="admin-action-btn admin-ban-btn"
                      onClick={() => handleBanPlayer(selectedPlayer.id, 30)}
                    >
                      封禁30天
                    </button>
                    <button
                      className="action-btn reset-btn"
                      onClick={() => console.log(`🔄 [AdminDashboard] 重置密码 ${selectedPlayer.id}`)}
                    >
                      重置密码
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 举报详情模态框 */}
        {showReportModal && selectedReport && (
          <div className="modal-overlay">
            <div className="modal-container report-modal">
              <div className="modal-header">
                <h3>举报详情</h3>
                <button className="close-btn" onClick={handleCloseReportModal}>×</button>
              </div>
              <div className="modal-content">
                <div className="report-info">
                  <div className="info-row">
                    <span className="info-label">举报ID:</span>
                    <span className="info-value">{selectedReport.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">举报者:</span>
                    <span className="info-value">{selectedReport.reporterName} ({selectedReport.reporterId})</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">被举报者:</span>
                    <span className="info-value">{selectedReport.targetName} ({selectedReport.targetId})</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">举报原因:</span>
                    <span className="info-value">{selectedReport.reason}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">举报日期:</span>
                    <span className="info-value">{selectedReport.date}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">状态:</span>
                    <span className={`status-badge ${selectedReport.status === '待处理' ? 'status-pending' : 'status-resolved'}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>
                <div className="admin-actions">
                  <h4>处理决定</h4>
                  <div className="action-buttons">
                    <button
                      className="action-btn resolve-btn"
                      onClick={() => handleResolveReport(selectedReport.id)}
                    >
                      无需处理
                    </button>
                    <button
                      className="action-btn ban-btn"
                      onClick={() => handleBanPlayer(selectedReport.targetId, 1)}
                    >
                      警告并封禁1天
                    </button>
                    <button
                      className="action-btn ban-btn"
                      onClick={() => handleBanPlayer(selectedReport.targetId, 7)}
                    >
                      封禁7天
                    </button>
                    <button
                      className="action-btn ban-btn severe"
                      onClick={() => handleBanPlayer(selectedReport.targetId, 30)}
                    >
                      封禁30天
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminDashboardPage;
