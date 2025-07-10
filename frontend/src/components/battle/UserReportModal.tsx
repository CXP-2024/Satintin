import React, { useState } from 'react';
import './UserReportModal.css';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo, getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import { CreateReportMessage } from "Plugins/AdminService/APIs/CreateReportMessage";

interface UserReportModalProps {
  username: string;
  userID: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, reason: string, description: string) => void;
}

const UserReportModal: React.FC<UserReportModalProps> = ({
  username,
  userID,
  isOpen,
  onClose,
  onSubmit
}) => {
  const currentUser = useUserInfo();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // 预设的举报原因选项
  const reportReasons = [
    { id: 'inappropriate_name', label: '不当用户名' },
    { id: 'harassment', label: '骚扰行为' },
    { id: 'impersonation', label: '冒充他人' },
    { id: 'suspicious_activity', label: '可疑活动' },
    { id: 'other', label: '其他原因' }
  ];

  const handleSubmit = () => {
    if (!selectedReason) {
      setSubmitError('请选择举报原因');
      return;
    }

    if (description.length < 10) {
      setSubmitError('请详细描述举报原因（至少10个字符）');
      return;
    }

    const userToken = getUserToken();
    const currentPlayer = currentUser?.userID;
    if (!userToken) {
      setSubmitError('您需要登录才能举报用户');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    // 提交举报
    new CreateReportMessage(
      currentPlayer,
      userID,
      selectedReason + ": " + description
    ).send(
      () => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        
        // 调用外部提交回调
        onSubmit(userID, selectedReason, description);
        
        setTimeout(() => {
          setSelectedReason('');
          setDescription('');
          setSubmitSuccess(false);
          onClose();
        }, 2000);
      },
      (error: any) => {
        console.error('举报提交失败:', error);
        setIsSubmitting(false);
        setSubmitError('举报提交失败，请稍后再试');
      }
    );
  };

  const handleCancel = () => {
    SoundUtils.playClickSound(0.5);
    setSelectedReason('');
    setDescription('');
    setSubmitError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="user-report-modal-overlay" onClick={onClose}>
      <div className="user-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-report-modal-header">
          <h2>举报用户: {username}</h2>
          <button className="user-report-close-button" onClick={handleCancel}>×</button>
        </div>
        
        {submitSuccess ? (
          <div className="user-report-modal-success">
            <div className="user-report-success-icon">✓</div>
            <h3>举报已提交</h3>
            <p>感谢您的反馈，我们会尽快处理</p>
          </div>
        ) : (
          <>
            <div className="user-report-modal-body">
              <div className="user-report-reason-section">
                <h3>举报原因</h3>
                <div className="user-report-reason-options">
                  {reportReasons.map((reason) => (
                    <label key={reason.id} className="user-report-reason-option">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.id}
                        checked={selectedReason === reason.id}
                        onChange={() => setSelectedReason(reason.id)}
                      />
                      <span>{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="user-report-description-section">
                <h3>详细描述</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述举报原因，以帮助我们进行调查..."
                  rows={5}
                  maxLength={500}
                />
                <div className="user-report-char-count">
                  {description.length}/500
                </div>
              </div>
              
              {submitError && (
                <div className="user-report-error-message">
                  {submitError}
                </div>
              )}
            </div>
            
            <div className="user-report-modal-footer">
              <button 
                className="user-report-cancel-button" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button 
                className="user-report-submit-button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交举报'}
              </button>
            </div>
          </>
        )}
        
        <div className="user-report-modal-note">
          <p>注意: 恶意举报可能会导致您的账号受到处罚。我们会认真审核每一份举报。</p>
        </div>
      </div>
    </div>
  );
};

export default UserReportModal; 