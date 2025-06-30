import React, { useState, useEffect } from 'react';
import { SoundUtils } from 'utils/soundUtils';

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
    status: '待处理',
    details: '在游戏聊天中使用了侮辱性语言，影响了游戏体验。'
  },
  {
    id: 'report-002',
    reporterId: 'user-003',
    reporterName: '钟离',
    targetId: 'user-004',
    targetName: '雷电将军',
    reason: '涉嫌作弊',
    date: '2023-09-30',
    status: '待处理',
    details: '在对战中表现异常，怀疑使用了外挂程序提高胜率。'
  },
  {
    id: 'report-003',
    reporterId: 'user-001',
    reporterName: '旅行者',
    targetId: 'user-005',
    targetName: '胡桃',
    reason: '不当行为',
    date: '2023-09-29',
    status: '待处理',
    details: '在多人游戏中故意妨碍队友，导致任务失败。'
  },
  {
    id: 'report-004',
    reporterId: 'user-006',
    reporterName: '温迪',
    targetId: 'user-010',
    targetName: '达达利亚',
    reason: '恶意骚扰',
    date: '2023-09-27',
    status: '待处理',
    details: '在游戏中持续跟踪并骚扰其他玩家，多次发送不友好信息。'
  },
  {
    id: 'report-005',
    reporterId: 'user-007',
    reporterName: '甘雨',
    targetId: 'user-010',
    targetName: '达达利亚',
    reason: '违规交易',
    date: '2023-09-28',
    status: '待处理',
    details: '尝试进行游戏外的真实货币交易，违反了游戏规则。'
  },
  {
    id: 'report-006',
    reporterId: 'user-009',
    reporterName: '刻晴',
    targetId: 'user-010',
    targetName: '达达利亚',
    reason: '账号共享',
    date: '2023-09-30',
    status: '待处理',
    details: '怀疑该账号被多人共享使用，违反了账号使用规定。'
  },
  {
    id: 'report-007',
    reporterId: 'user-011',
    reporterName: '神里绫华',
    targetId: 'user-008',
    targetName: '魈',
    reason: '不当言论',
    date: '2023-09-26',
    status: '已处理',
    details: '在公共聊天频道发表政治敏感言论，引起其他玩家不适。'
  },
  {
    id: 'report-008',
    reporterId: 'user-012',
    reporterName: '宵宫',
    targetId: 'user-005',
    targetName: '胡桃',
    reason: '欺骗行为',
    date: '2023-09-25',
    status: '已处理',
    details: '在交易中欺骗新手玩家，谎称物品价值以获取不公平利益。'
  }
];

interface ReportHandlingProps {
  searchTerm: string;
}

const ReportHandling: React.FC<ReportHandlingProps> = ({ searchTerm }) => {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReportModalClosing, setIsReportModalClosing] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每页显示10条记录

  // 播放按钮点击音效
  const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
  };

  const handleViewReport = (report: any) => {
    playClickSound();
    setSelectedReport(report);
    setIsReportModalClosing(false);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalClosing(true);
    setTimeout(() => {
      setShowReportModal(false);
      setIsReportModalClosing(false);
    }, 300); // 动画持续时间
  };

  const handleResolveReport = (reportId: string) => {
    playClickSound();
    console.log(`🛡️ [AdminDashboard] 处理举报 ${reportId}`);
    // 在实际应用中，这里会调用API来处理举报
    handleCloseReportModal();
  };

  const handleBanPlayer = (playerId: string, days: number) => {
    playClickSound();
    console.log(`🔨 [AdminDashboard] 封禁玩家 ${playerId} ${days}天`);
    // 在实际应用中，这里会调用API来封禁玩家
    handleCloseReportModal();
  };

  // 过滤举报列表
  const filteredReports = mockReports.filter(report =>
    report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 计算总页数
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // 确保当前页码在有效范围内
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // 获取当前页的数据
  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 处理页码变化
  const handlePageChange = (pageNumber: number) => {
    playClickSound();
    setCurrentPage(pageNumber);
  };

  return (
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
            {currentReports.map(report => (
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
            {/* 如果当前页不足10条数据，添加空行保持表格高度一致 */}
            {currentReports.length < itemsPerPage && Array(itemsPerPage - currentReports.length).fill(0).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: '60px' }}>
                <td colSpan={7}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      <div className="pagination">
        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </button>

        {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          下一页
        </button>
      </div>

      {/* 举报详情模态框 */}
      {showReportModal && selectedReport && (
        <div className={`admin-modal-overlay ${isReportModalClosing ? 'closing' : ''}`}>
          <div className="admin-modal-container report-modal">
            <div className="admin-modal-header">
              <h3>举报详情</h3>
              <button className="admin-close-btn" onClick={handleCloseReportModal}>
                <span>×</span>
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="report-info">
                <div className="admin-info-row">
                  <span className="admin-info-label">举报ID:</span>
                  <span className="admin-info-value">{selectedReport.id}</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">举报者:</span>
                  <span className="admin-info-value">{selectedReport.reporterName} ({selectedReport.reporterId})</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">被举报者:</span>
                  <span className="admin-info-value">{selectedReport.targetName} ({selectedReport.targetId})</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">举报原因:</span>
                  <span className="admin-info-value">{selectedReport.reason}</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">举报日期:</span>
                  <span className="admin-info-value">{selectedReport.date}</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">状态:</span>
                  <span className="admin-info-value" style={{ justifyContent: 'center' }}>
                    <span className={`admin-status-badge ${selectedReport.status === '待处理' ? 'admin-status-pending' : 'admin-status-resolved'}`}>
                      {selectedReport.status}
                    </span>
                  </span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">详细描述:</span>
                  <span className="admin-info-value report-details">{selectedReport.details}</span>
                </div>
              </div>
              <div className="admin-actions">
                <h4>处理决定</h4>
                <div className="admin-action-buttons">
                  <button
                    className="admin-action-btn admin-resolve-btn"
                    onClick={() => handleResolveReport(selectedReport.id)}
                  >
                    无需处理
                  </button>
                  <button
                    className="admin-action-btn admin-ban-btn"
                    onClick={() => handleBanPlayer(selectedReport.targetId, 1)}
                  >
                    警告并封禁1天
                  </button>
                  <button
                    className="admin-action-btn admin-ban-btn"
                    onClick={() => handleBanPlayer(selectedReport.targetId, 7)}
                  >
                    封禁7天
                  </button>
                  <button
                    className="admin-action-btn admin-ban-btn severe"
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
  );
};

export default ReportHandling;
