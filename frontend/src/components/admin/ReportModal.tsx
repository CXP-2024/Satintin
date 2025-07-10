import React from 'react';
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';

interface UserNameCache {
  [key: string]: string;
}

export interface ReportModalProps {
    selectedReport: CheatingReport | null;
    isReportModalClosing: boolean;
    handleCloseReportModal: () => void;
    handleResolveReport: (reportID: string, isResolved: boolean) => void;
    handleBanPlayer: (userID: string, days: number) => void;
    userNameCache: UserNameCache;
}

const ReportModal: React.FC<ReportModalProps> = ({
  selectedReport,
  isReportModalClosing,
  handleCloseReportModal,
  handleResolveReport,
  handleBanPlayer,
  userNameCache
}) => {
  if (!selectedReport) return null;
  return (
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
              <span className="admin-info-value">{selectedReport.reportID}</span>
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">举报者:</span>
              <span className="admin-info-value">
                {userNameCache[selectedReport.reportingUserID]}
                <span className="user-id">({selectedReport.reportingUserID})</span>
              </span>
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">被举报者:</span>
              <span className="admin-info-value">
                {userNameCache[selectedReport.reportedUserID]}
                <span className="user-id">({selectedReport.reportedUserID})</span>
              </span>
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">举报原因:</span>
              <span className="admin-info-value">{selectedReport.reportReason}</span>
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">举报日期:</span>
              <span className="admin-info-value">{selectedReport.getFormattedTime()}</span>
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">状态:</span>
              <span className="admin-info-value" style={{ justifyContent: 'center' }}>
                <span className={`admin-status-badge ${selectedReport.isResolved ? 'admin-status-resolved' : 'admin-status-pending'}`}>
                  {selectedReport.getStatusText()}
                </span>
              </span>
            </div>
          </div>
          <div className="admin-actions">
            <h4>处理决定</h4>
            <div className="admin-action-buttons">
              {!selectedReport.isResolved ? (
                <>
                  <button
                    className="admin-action-btn admin-resolve-btn"
                    onClick={() => handleResolveReport(selectedReport.reportID, true)}
                  >
                    标记为已处理
                  </button>
                  <button
                    className="admin-action-btn admin-ban-btn"
                    onClick={() => handleBanPlayer(selectedReport.reportedUserID, 1)}
                  >
                    警告并封禁1天
                  </button>
                  <button
                    className="admin-action-btn admin-ban-btn"
                    onClick={() => handleBanPlayer(selectedReport.reportedUserID, 7)}
                  >
                    封禁7天
                  </button>
                  <button
                    className="admin-action-btn admin-ban-btn severe"
                    onClick={() => handleBanPlayer(selectedReport.reportedUserID, 30)}
                  >
                    封禁30天
                  </button>
                </>
              ) : (
                <button
                  className="admin-action-btn admin-reopen-btn"
                  onClick={() => handleResolveReport(selectedReport.reportID, false)}
                >
                  重新开启举报
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
