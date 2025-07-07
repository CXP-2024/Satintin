import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import { useUserSearch } from '../hooks/useUserSearch';
import { useCardCount } from '../hooks/useCardCount';
import PageTransition from '../components/PageTransition';
import UserProfile from '../components/gameHome/UserProfile';
import RewardModal from '../components/gameHome/RewardModal';
import GameHeader from '../components/gameHome/GameHeader';
import UserStats from '../components/gameHome/UserStats';
import MainActions from '../components/MainActions';
import QuickInfo from '../components/QuickInfo';
import SearchUserModal from '../components/SearchUserModal';
import './GameHomePage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {
	clearUserInfo,
	useUserInfo,
	initUserToken,
	getUserInfo,
	useUserToken,
	getUserToken
} from "Plugins/CommonUtils/Store/UserInfoStore";
import { autoLogoutManager } from '../utils/autoLogout';

const GameHomePage: React.FC = () => {
    const user = useUserInfo();
    const userToken = useUserToken();
    const userID = user?.userID;
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
        navigateWithTransition('/battle', '正在进入战斗...');
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
        setShowRewardModal(true);
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
                />

                <RewardModal
                    isOpen={showRewardModal}
                    onClose={handleCloseRewardModal}
                    rewardType="daily"
                    rewardAmount={200}
                    rewardTitle="每日奖励"
                    rewardDescription="恭喜您获得每日登录奖励！"
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
