import React, { useEffect, useState, useCallback } from 'react';
import './PaymentModal.css';
import successQrImage from '../../assets/images/success_qr.png';
import paidSuccessImage from '../../assets/images/paid_success.png';
import clickSound from '../../assets/sound/yinxiao.mp3';
import paidSuccessSound from '../../assets/sound/paid_success.mp3';
import { SoundUtils } from '../../utils/soundUtils';

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
    const [showSuccessPage, setShowSuccessPage] = useState(false);
    const [successAudio, setSuccessAudio] = useState<HTMLAudioElement | null>(null);

    // 播放按钮点击音效
    const playClickSound = () => {
        SoundUtils.playClickSound(0.5);
    };

    // 播放充值成功音效 - 使用 useCallback 确保函数稳定性
    const playSuccessSound = useCallback(() => {
        console.log('Attempting to play success sound, audio object:', successAudio);
        if (successAudio) {
            try {
                successAudio.currentTime = 0;
                successAudio.volume = 0.7;
                const playPromise = successAudio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Success audio playback failed:', error);
                    });
                }
            } catch (error) {
                console.log('Error in playSuccessSound:', error);
            }
        } else {
            console.log('Success audio not available');
        }
    }, [successAudio]);

    // 初始化音效
    useEffect(() => {
        SoundUtils.setClickSoundSource(clickSound);
        // 预加载充值成功音效
        const audio = new Audio(paidSuccessSound);
        audio.preload = 'auto';

        // 确保音频加载完成
        const handleLoadedData = () => {
            console.log('Success audio loaded successfully');
            setSuccessAudio(audio);
        };

        const handleError = () => {
            console.error('Failed to load success audio');
            setSuccessAudio(audio); // 即使加载失败也设置，避免阻塞
        };

        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('error', handleError);

        // 立即设置音频对象，不等待完全加载
        setSuccessAudio(audio);

        return () => {
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    // 3秒自动切换到成功页面
    useEffect(() => {
        if (isOpen && !showSuccessPage && successAudio) {
            console.log('Setting up auto success timer, audio ready:', !!successAudio);
            const timer = setTimeout(() => {
                console.log('Auto switching to success page and playing sound');
                setShowSuccessPage(true);

                // 延迟一小段时间确保页面切换完成后再播放音效
                setTimeout(() => {
                    playSuccessSound();
                }, 100);
            }, 1000);

            return () => {
                console.log('Clearing auto success timer');
                clearTimeout(timer);
            };
        } else {
            console.log('Auto timer conditions not met:', {
                isOpen,
                showSuccessPage,
                hasAudio: !!successAudio
            });
        }
    }, [isOpen, showSuccessPage, successAudio, playSuccessSound]);

    // 处理充值完成按钮点击
    const handlePaymentComplete = () => {
        playClickSound();
        setShowSuccessPage(true);
        playSuccessSound();
    };

    // 处理取消按钮点击
    const handleCancel = () => {
        playClickSound();
        onClose();
    };

    // 处理成功页面确认按钮
    const handleSuccessConfirm = () => {
        playClickSound();
        onPaymentComplete();
        // 重置状态
        setShowSuccessPage(false);
    };

    // 重置组件状态当模态框关闭时
    useEffect(() => {
        if (!isOpen) {
            setShowSuccessPage(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="payment-modal-overlay" onClick={showSuccessPage ? undefined : handleCancel}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                {!showSuccessPage ? (
                    // 支付二维码页面
                    <>
                        <div className="payment-modal-header">
                            <h3>扫码支付</h3>
                            <button className="close-btn" onClick={handleCancel}>×</button>
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
                                    onClick={handlePaymentComplete}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? '处理中...' : '充值完成'}
                                </button>
                                <button
                                    className="payment-cancel-btn"
                                    onClick={handleCancel}
                                    disabled={isProcessing}
                                >
                                    取消支付
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    // 充值成功页面
                    <>
                        <div className="payment-modal-header">
                            <h3>充值成功</h3>
                        </div>

                        <div className="payment-modal-content">
                            <div className="success-container">
                                <img
                                    src={paidSuccessImage}
                                    alt="充值成功"
                                    className="success-image"
                                />
                                <h4 className="success-title">充值成功！</h4>
                                <div className="success-info">
                                    <p className="success-amount">支付金额: ¥{amount}</p>
                                    <p className="success-crystals">获得原石: {crystals}</p>
                                </div>
                            </div>

                            <div className="success-actions">
                                <button
                                    className="success-confirm-btn"
                                    onClick={handleSuccessConfirm}
                                >
                                    确认
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
