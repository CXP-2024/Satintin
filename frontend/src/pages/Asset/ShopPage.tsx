import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import PaymentModal from '../../components/shop/PaymentModal';
import './ShopPage.css';
import primogemIcon from '../../assets/images/primogem-icon.png';
import clickSound from '../../assets/sound/yinxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo, setUserInfoField} from "Plugins/CommonUtils/Store/UserInfoStore";
import { ChargeAssetMessage } from 'Plugins/AssetService/APIs/ChargeAssetMessage';
import { QueryAssetStatusMessage } from 'Plugins/AssetService/APIs/QueryAssetStatusMessage';
import { showSuccess } from 'utils/alertUtils';

const ShopPage: React.FC = () => {
    const user = useUserInfo();
	const userID = user?.userID;
    const { navigateWithTransition } = usePageTransition();
    const [rechargingIndex, setRechargingIndex] = useState<number | null>(null);
    
    // 支付弹窗相关状态
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentPayment, setCurrentPayment] = useState<{
        amount: number;
        crystals: number;
        index: number;
    } | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // 初始化音效
    useEffect(() => {
        SoundUtils.setClickSoundSource(clickSound);
    }, []);

    // 播放按钮点击音效
    const playClickSound = () => {
        SoundUtils.playClickSound(0.5);
    };    const handleBackToHome = () => {
        console.log('🏠 [ShopPage] 返回游戏大厅');
        playClickSound();
        navigateWithTransition('/', '正在返回游戏大厅...');
    };

    // 刷新用户原石余额函数
    const refreshUserAssets = async () => {
        try {
            const response: any = await new Promise((resolve, reject) => {
                new QueryAssetStatusMessage(userID).send(
                    (res: any) => resolve(res),
                    (err: any) => reject(err)
                );
            });
            console.log('AssetService raw response:', response);
            
            let stoneAmount: number;
            if (typeof response === 'number') {
                stoneAmount = response;
            } else if (typeof response === 'string' && !isNaN(+response)) {
                stoneAmount = +response;
            } else if (response && typeof response === 'object') {
                stoneAmount = +(response.data ?? response.result ?? 0);
            } else {
                console.warn('Cannot parse stoneAmount from response');
                return;
            }

            // 使用 setUserInfoField 来正确更新状态
            setUserInfoField('stoneAmount', stoneAmount);
            console.log('用户原石数量已更新:', stoneAmount);
        } catch (err) {
            console.error('刷新用户资产失败:', err);
        }
    };

    const handleRecharge = async (amount: number, crystals: number, index: number) => {
        console.log(`💰 [ShopPage] 用户准备充值: ${amount}元, ${crystals}原石`);
        playClickSound();
        
        // 设置当前支付信息并显示支付弹窗
        setCurrentPayment({ amount, crystals, index });
        setShowPaymentModal(true);
    };

    // 处理支付完成
    const handlePaymentComplete = async () => {
        if (!currentPayment) return;
        
        console.log(`💰 [ShopPage] 开始处理充值: ${currentPayment.amount}元, ${currentPayment.crystals}原石`);
        setIsProcessingPayment(true);
        
        try {
            const result = await new Promise((resolve, reject) => {
                new ChargeAssetMessage(userID, currentPayment.crystals).send(
                    (response: any) => response.error ? reject(new Error(response.error)) : resolve(response)
                );
            });
            
            console.log('充值成功:', result);
            
            // 刷新用户资产
            await refreshUserAssets();
            
            // 关闭弹窗
            setShowPaymentModal(false);
            setCurrentPayment(null);
            
            // 显示成功消息
            showSuccess(`充值成功！获得 ${currentPayment.crystals} 原石`, '充值成功');
            
        } catch (error) {
            console.error('充值失败:', error);
            alert('充值失败，请重试');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // 关闭支付弹窗
    const handleClosePaymentModal = () => {
        if (!isProcessingPayment) {
            setShowPaymentModal(false);
            setCurrentPayment(null);
        }
    };

    // 充值选项数据
    const rechargeOptions = [
        { amount: 6, crystals: 60 },
        { amount: 32, crystals: 320 },
        { amount: 64, crystals: 640 },
        { amount: 128, crystals: 1280 },
        { amount: 324, crystals: 3240 },
        { amount: 648, crystals: 6480 },
    ];

    return (
        <PageTransition className="shop-page">
            {/* 顶部状态栏 */}
            <header className="page-header">
                <button className="back-btn" onClick={handleBackToHome}>
                    ← 返回大厅
                </button>
                <h1>原石商店</h1>
                <div className="user-currency-header">
                    <img src={primogemIcon} alt="原石" className="currency-icon" />
                    <span className="currency-amount">{user?.stoneAmount || 0}</span>
                </div>
            </header>

            <main className="shop-main">
                <div className="shop-banner">
                    <div className="banner-content">
                        <h2 className="banner-title">原石充值</h2>
                        <p className="banner-subtitle">购买原石以强化您的卡牌阵容</p>
                    </div>
                </div>

                <section className="recharge-options">
                    <div className="options-grid">
                        {rechargeOptions.map((option, index) => (
                            <div className="recharge-card" key={index}>
                                <div className="crystal-image">
                                    <img src={primogemIcon} alt="原石" />
                                </div>
                                <div className="crystal-amount">
                                    <span className="amount">{option.crystals}</span>
                                    <span className="label">原石</span>
                                </div>
                                <div className="price">
                                    <span className="price-label">¥</span>
                                    <span className="price-amount">{option.amount}</span>
                                </div>                                <button
                                    className="recharge-btn"
                                    onClick={() => handleRecharge(option.amount, option.crystals, index)}
                                    disabled={rechargingIndex === index}
                                >
                                    {rechargingIndex === index ? '充值中...' : '立即充值'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="shop-info">
                    <div className="info-card">
                        <h3>充值须知</h3>
                        <ul>
                            <li>充值后原石将立即添加到您的账户</li>
                            <li>原石可用于购买卡牌、祈愿和其他游戏内容</li>
                            <li>所有交易均为最终交易，不支持退款</li>
                            <li>如遇充值问题，请联系客服支持</li>                        </ul>
                    </div>
                </section>
            </main>
            
            {/* 支付弹窗 */}
            {currentPayment && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={handleClosePaymentModal}
                    onPaymentComplete={handlePaymentComplete}
                    amount={currentPayment.amount}
                    crystals={currentPayment.crystals}
                    isProcessing={isProcessingPayment}
                />
            )}
        </PageTransition>
    );
};

export default ShopPage;
