import React, { useState } from 'react';
import './ReportModal.css';
import { SoundUtils } from 'utils/soundUtils';

interface ReportModalProps {
  opponentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  opponentName,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 预设的举报原因选项
  const reportReasons = [
    { id: 'inappropriate_behavior', label: '不当行为/言论' },
    { id: 'cheating', label: '作弊行为' },
    { id: 'afk', label: '挂机/消极游戏' },
    { id: 'bug_exploit', label: '利用游戏漏洞' },
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

    setIsSubmitting(true);
    setSubmitError(null);
    
    // 提交举报
    onSubmit(selectedReason, description);
    
    // 重置表单
    setSelectedReason('');
    setDescription('');
    setIsSubmitting(false);
    
    // 播放提交音效
    SoundUtils.playClickSound(0.5);
    
    // 关闭模态框
    onClose();
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
    <div className="report-modal-overlay">
      <div className="report-modal">
        <div className="report-modal-header">
          <h2>举报玩家: {opponentName}</h2>
          <button className="close-button" onClick={handleCancel}>×</button>
        </div>
        
        <div className="report-modal-body">
          <div className="report-reason-section">
            <h3>举报原因</h3>
            <div className="report-reason-options">
              {reportReasons.map((reason) => (
                <label key={reason.id} className="report-reason-option">
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
          
          <div className="report-description-section">
            <h3>详细描述</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述发生的情况，以帮助我们进行调查..."
              rows={5}
              maxLength={500}
            />
            <div className="description-char-count">
              {description.length}/500
            </div>
          </div>
          
          {submitError && (
            <div className="report-error-message">
              {submitError}
            </div>
          )}
        </div>
        
        <div className="report-modal-footer">
          <button 
            className="report-cancel-button" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button 
            className="report-submit-button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交举报'}
          </button>
        </div>
        
        <div className="report-modal-note">
          <p>注意: 恶意举报可能会导致您的账号受到处罚。我们会认真审核每一份举报。</p>
        </div>
      </div>
    </div>
  );
};

export default ReportModal; 