import React, { useState, useEffect } from 'react';
import { SoundUtils } from 'utils/soundUtils';
import { BanUserMessage } from "Plugins/AdminService/APIs/BanUserMessage";
import { ManageReportMessage } from "Plugins/AdminService/APIs/ManageReportMessage";
import { getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';
import { GetUserInfoMessage } from 'Plugins/UserService/APIs/GetUserInfoMessage';
import { User } from 'Plugins/UserService/Objects/User';
import ReportModal from './ReportModal';
import { playClickSound, getAdminToken } from './reportUtils';
import { ReportHandlingProps } from './types';
import { useUserNameCache } from './hooks/useUserNameCache';
import { usePagination } from './hooks/usePagination';
import { handleResolveReport, handleBanPlayer } from './utils/reportHandlingUtils';

const ReportHandling: React.FC<ReportHandlingProps> = ({ 
  searchTerm, 
  reports,
  loading,
  error,
  onRefresh,
  onReportUpdated
}) => {
  const [selectedReport, setSelectedReport] = useState<CheatingReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReportModalClosing, setIsReportModalClosing] = useState(false);
  
  const { userNameCache, fetchUserName } = useUserNameCache();
  const { 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    currentReports 
  } = usePagination({ 
    reports, 
    searchTerm, 
    userNameCache 
  });

  // 加载当前页面所有用户的用户名
  useEffect(() => {
    const loadUserNames = async () => {
      const userIDs = new Set<string>();
      currentReports.forEach(report => {
        userIDs.add(report.reportingUserID);
        userIDs.add(report.reportedUserID);
      });

      for (const userID of userIDs) {
        if (!userNameCache[userID]) {
          await fetchUserName(userID);
        }
      }
    };

    loadUserNames();
  }, [currentPage, reports, searchTerm]);

  const handleViewReport = (report: CheatingReport) => {
    playClickSound(SoundUtils);
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

  const handleResolveReportClick = (reportId: string, isResolved: boolean = true) => {
    handleResolveReport(
      reportId, 
      isResolved, 
      () => {
        handleCloseReportModal();
        onReportUpdated();
      }
    );
  };

  const handleBanPlayerClick = (playerId: string, days: number) => {
    handleBanPlayer(
      playerId, 
      days, 
      () => {
        if (selectedReport) {
          handleResolveReportClick(selectedReport.reportID, true);
        } else {
          handleCloseReportModal();
        }
      }
    );
  };

  // 处理页码变化
  const handlePageChange = (pageNumber: number) => {
    playClickSound(SoundUtils);
    setCurrentPage(pageNumber);
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="reports-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载举报记录...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="reports-section">
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button className="retry-btn" onClick={onRefresh}>
            重试
          </button>
        </div>
      </div>
    );
  }

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
              <tr key={report.reportID}>
                <td>{report.reportID.substring(0, 8)}...</td>
                <td>{userNameCache[report.reportingUserID]}</td>
                <td>{userNameCache[report.reportedUserID]}</td>
                <td>{report.reportReason}</td>
                <td>{report.getFormattedTime()}</td>
                <td>
                  <span className={`admin-status-badge ${report.isResolved ? 'admin-status-resolved' : 'admin-status-pending'}`}>
                    {report.getStatusText()}
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
            {currentReports.length < 10 && Array(10 - currentReports.length).fill(0).map((_, index) => (
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
        <ReportModal
          selectedReport={selectedReport}
          isReportModalClosing={isReportModalClosing}
          handleCloseReportModal={handleCloseReportModal}
          handleResolveReport={handleResolveReportClick}
          handleBanPlayer={handleBanPlayerClick}
          userNameCache={userNameCache}
        />
      )}
    </div>
  );
};

export default ReportHandling;

