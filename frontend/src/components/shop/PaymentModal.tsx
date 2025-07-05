import React from 'react';
import './PaymentModal.css';
import successQrImage from '../../assets/images/success_qr.png';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentComplete: () => void;
    amount: number;
    crystals: number;
    isProcessing: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onPaymentComplete,
    amount,
    crystals,
    isProcessing
}) => {
    if (!isOpen) return null;

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="payment-modal-header">
                    <h3>扫码支付</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="payment-modal-content">
                    <div className="payment-info">
                        <p className="payment-amount">支付金额: ¥{amount}</p>
                        <p className="payment-crystals">获得原石: {crystals}</p>
                    </div>
                    
                    <div className="qr-code-container">
                        <img 
                            src={successQrImage} 
                            alt="支付二维码" 
                            className="qr-code-image"
                        />
                        <p className="qr-code-tip">请使用微信或支付宝扫描二维码完成支付</p>
                    </div>
                    
                    <div className="payment-actions">
                        <button 
                            className="payment-complete-btn"
                            onClick={onPaymentComplete}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '处理中...' : '充值完成'}
                        </button>
                        <button 
                            className="payment-cancel-btn"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            取消支付
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
