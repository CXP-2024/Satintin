import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import { useUserSearch } from '../hooks/useUserSearch';
import { useCardCount } from '../hooks/useCardCount';
import PageTransition from '../components/PageTransition';
import UserProfile from '../components/gameHome/UserProfile';
import RewardModal from '../components/gameHome/RewardModal';
import AlreadyClaimedModal from '../components/gameHome/AlreadyClaimedModal';
import GameHeader from '../components/gameHome/GameHeader';
import UserStats from '../components/gameHome/UserStats';
import MainActions from '../components/gameHome/MainActions';
import QuickInfo from '../components/gameHome/QuickInfo';
import SearchUserModal from '../components/gameHome/SearchUserModal';
import './GameHomePage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {
	clearUserInfo,
	useUserInfo,
	initUserToken,
	getUserInfo,
	useUserToken,
	getUserToken,
	setUserInfoField
} from "Plugins/CommonUtils/Store/UserInfoStore";
import { autoLogoutManager } from 'utils/autoLogout';
import { GetAssetTransactionMessage } from "Plugins/AssetService/APIs/GetAssetTransactionMessage";
import { RewardAssetMessage } from "Plugins/AssetService/APIs/RewardAssetMessage";
import { AssetTransaction } from "Plugins/AssetService/Objects/AssetTransaction";
import { QueryAssetStatusMessage } from "Plugins/AssetService/APIs/QueryAssetStatusMessage";
import { LoadBattleDeckMessage } from "Plugins/CardService/APIs/LoadBattleDeckMessage";

const GameHomePage: React.FC = () => {
    const user = useUserInfo();
    const userToken = useUserToken();
    const userID = user?.userID;
    const DailyRewardAmount = 200; // 每日奖励数量
    const { navigateWithTransition } = usePageTransition();
    const { cardCount } = useCardCount(userToken, userID);
    const {
        searchUsername,
        setSearchUsername,
        searchedUser,
        searchLoading,
        searchError,
        showSearchUser,
        handleSearchUser,
        handleShowSearchUser,
        handleCloseSearchUser
    } = useUserSearch();
    
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [showAlreadyClaimedModal, setShowAlreadyClaimedModal] = useState(false);
    
    console.log('👤 [GameHomePage] 当前用户信息:', getUserInfo());
    console.log('🔍 [GameHomePage] userID:', userID, 'userToken:', userToken ? '有token' : '无token');

    // 初始化音效
    useEffect(() => {
        SoundUtils.setClickSoundSource(clickSound);
    }, []);

    // 播放按钮点击音效
    const playClickSound = () => {
        SoundUtils.playClickSound(0.5);
    };

    function logout() {
        playClickSound();
        // 获取当前token并传递给autoLogoutManager
        const currentUserToken = getUserToken();
        // 先清除本地状态
        clearUserInfo();
        initUserToken();
        
        // 使用保存的token执行服务器logout
        if (currentUserToken) {
            autoLogoutManager.manualLogout('普通用户手动退出登录', currentUserToken).catch(console.error);
        }
        
        // 立即导航到登录页
        navigateWithTransition('/login');
    }

    const handleLogout = () => {
        console.log('🚪 [GameHomePage] 用户点击退出登录');
        playClickSound();
        logout();
    };

    const handleNavigateToShop = () => {
        playClickSound();
        navigateWithTransition('/shop', '正在进入商店充值页面...');
    };

    const handleNavigateToBattle = () => {
        playClickSound();
        if (!userID) return;
        
        // 先检查战斗卡组配置
        new LoadBattleDeckMessage(userID).send(
            (info: any) => {
                try {
                    let battleDeck: string[] = [];
                    if (typeof info === 'string') {
                        battleDeck = JSON.parse(info);
                    } else {
                        battleDeck = info;
                    }
                    
                    if (battleDeck.length < 3) {
                        window.alert('战斗卡组需配置3个卡牌');
                        return;
                    }
                    
                    // 卡组检查通过，跳转到战斗页面
                    navigateWithTransition('/battle', '正在进入战斗...');
                } catch (e) {
                    console.error('parse battle deck error:', e);
                    window.alert('获取战斗卡组失败');
                }
            },
            (error: any) => {
                console.error('LoadBattleDeckMessage error:', error);
                window.alert('获取战斗卡组失败');
            }
        );
    };

    const handleNavigateToCards = () => {
        playClickSound();
        navigateWithTransition('/cards', '正在加载卡组...');
    };

    const handleNavigateToWish = () => {
        playClickSound();
        navigateWithTransition('/wish', '正在准备祈愿...');
    };

    const handleNavigateToRules = () => {
        playClickSound();
        navigateWithTransition('/battle-rules', '正在加载对战规则...');
    };

    const handleClaimReward = () => {
        playClickSound();
        if (!userID) return;
        new GetAssetTransactionMessage(userID).send(
            (info: any) => {
                try {
                    let parsed: any = info;
                    if (typeof parsed === 'string') {
                        parsed = JSON.parse(parsed);
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                    }
                    const transactionData = (parsed as any[]).map(item => new AssetTransaction(
                        item.transactionID,
                        item.userID,
                        item.transactionType,
                        item.changeAmount,
                        item.changeReason,
                        item.timestamp
                    ));
                    const rewardTxs = transactionData.filter(tx => tx.transactionType.toUpperCase() === 'REWARD' && tx.changeAmount === DailyRewardAmount);
                    if (rewardTxs.length > 0) {
                        const latest = rewardTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                        const latestDate = new Date(latest.timestamp);
                        const now = new Date();
                        if (
                            latestDate.getFullYear() === now.getFullYear() &&
                            latestDate.getMonth() === now.getMonth() &&
                            latestDate.getDate() === now.getDate()
                        ) {
                            // 今日已领取，显示样式化弹窗
                            setShowAlreadyClaimedModal(true);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('parse transactions error:', e);
                }
                new RewardAssetMessage(userID, DailyRewardAmount).send(
                    () => {
                        setShowRewardModal(true);
                        // 刷新原石数量
                        new QueryAssetStatusMessage(userID).send(
                            (res: string) => {
                                try {
                                    const amt = typeof res === 'string' ? parseInt(JSON.parse(res)) : res;
                                    setUserInfoField('stoneAmount', amt);
                                } catch (e) {
                                    console.error('parse asset status error:', e);
                                }
                            },
                            (err: any) => console.error('QueryAssetStatusMessage error:', err)
                        );
                    },
                    (error: any) => {
                        console.error('RewardAssetMessage error:', error);
                    }
                );
            },
            (error: any) => {
                console.error('GetAssetTransactionMessage error:', error);
            }
        );
    };

    const handleShowUserProfile = () => {
        playClickSound();
        setShowUserProfile(true);
    };

    const handleCloseUserProfile = () => {
        setShowUserProfile(false);
    };

    const handleCloseRewardModal = () => {
        setShowRewardModal(false);
    };

    const handleShowSearchUserWithSound = () => {
        playClickSound();
        handleShowSearchUser();
    };

    const handleSearchUserWithUserID = () => {
        handleSearchUser(userID);
    };
    return (
        <PageTransition className="game-page">
            <div className="game-home">
                <GameHeader
                    user={user}
                    onNavigateToRules={handleNavigateToRules}
                    onShowSearchUser={handleShowSearchUserWithSound}
                    onShowUserProfile={handleShowUserProfile}
                    onNavigateToShop={handleNavigateToShop}
                    onLogout={handleLogout}
                />

                <main className="home-main">
                    <section className="welcome-section">
                        <div className="welcome-content">
                            <h2 className="welcome-title">欢迎回来，{user?.userName}！</h2>
                            <p className="welcome-subtitle">准备好迎接激烈的卡牌对战了吗？</p>
                        </div>
                    </section>

                    <UserStats user={user} cardCount={cardCount} />

                    <MainActions
                        onNavigateToBattle={handleNavigateToBattle}
                        onNavigateToCards={handleNavigateToCards}
                        onNavigateToWish={handleNavigateToWish}
                    />

                    <QuickInfo onClaimReward={handleClaimReward} />
                </main>

                <UserProfile
                    isOpen={showUserProfile}
                    onClose={handleCloseUserProfile}
                />                <RewardModal
                    isOpen={showRewardModal}
                    onClose={handleCloseRewardModal}
                    rewardType="daily"
                    rewardAmount={200}
                    rewardTitle="每日奖励"
                    rewardDescription="恭喜您获得每日登录奖励！"
                />
                
                <AlreadyClaimedModal
                    isOpen={showAlreadyClaimedModal}
                    onClose={() => setShowAlreadyClaimedModal(false)}
                    rewardType="daily"
                    rewardTitle="今日已领取"
                    rewardDescription="您已领取过今日奖励，明天再来哦~"
                />

                <SearchUserModal
                    isOpen={showSearchUser}
                    searchUsername={searchUsername}
                    setSearchUsername={setSearchUsername}
                    searchedUser={searchedUser}
                    searchLoading={searchLoading}
                    searchError={searchError}
                    onSearch={handleSearchUserWithUserID}
                    onClose={handleCloseSearchUser}
                />
            </div>
        </PageTransition>
    );
};

export default GameHomePage;
