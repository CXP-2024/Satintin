import {getUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";
import { AddFriendMessage } from "Plugins/UserService/APIs/AddFriendMessage";
import { RemoveFriendMessage } from "Plugins/UserService/APIs/RemoveFriendMessage";
import { BlockUserMessage } from "Plugins/UserService/APIs/BlockUserMessage";
import { SoundUtils } from 'utils/soundUtils';
import { FriendInfo, BlockedUserInfo, refreshUserInfo, clearFriendValidationCache} from './UserProfileUtils';

// 定义 UserProfile 处理函数所需的状态类型
export interface UserProfileHandleState {
    user: any;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    friendsData: FriendInfo[];
    setFriendsData: (data: FriendInfo[] | ((prev: FriendInfo[]) => FriendInfo[])) => void;
    blockedData: BlockedUserInfo[];
    setBlockedData: (data: BlockedUserInfo[] | ((prev: BlockedUserInfo[]) => BlockedUserInfo[])) => void;
    addFriendID: string;
    setAddFriendID: (id: string) => void;
    isClosing: boolean;
    setIsClosing: (closing: boolean) => void;
    activeTab: 'friends' | 'blocked';
    setActiveTab: (tab: 'friends' | 'blocked') => void;
    onClose: () => void;
    refreshUserInfo?: () => Promise<void>; // 刷新用户信息的函数
}

// 添加好友
export const handleAddFriend = async (state: UserProfileHandleState) => {
    const { user, addFriendID, setLoading, setAddFriendID, refreshUserInfo } = state;
    
    if (!addFriendID.trim()) return;

    setLoading(true);
    try {
        await new Promise<string>((resolve, reject) => {
            new AddFriendMessage(user.userID, addFriendID.trim()).send(
                (result) => resolve(result),
                (error) => reject(error)
            );
        });

        setAddFriendID('');
        
        // 刷新用户信息以获取最新的好友列表
        if (refreshUserInfo) {
            console.log('🔄 Refreshing user info after adding friend...');
            await refreshUserInfo();
            clearFriendValidationCache(); // 清除验证缓存，确保下次加载时获取最新数据
        }
        
        alert('好友添加成功！');
    } catch (error) {
        console.error('Failed to add friend:', error);
        alert('添加好友失败');
    } finally {
        setLoading(false);
    }
};

// 移除好友
export const handleRemoveFriend = async (friendID: string, state: UserProfileHandleState) => {
    const { setLoading, setFriendsData, refreshUserInfo } = state;
    const user = getUserInfo()
    
    setLoading(true);
    try {
        await new Promise<string>((resolve, reject) => {
            new RemoveFriendMessage(user.userID, friendID).send(
                (result) => resolve(result),
                (error) => reject(error)
            );
        });

        // 先从本地状态中移除好友（即时反馈）
        setFriendsData(prev => prev.filter(friend => friend.id !== friendID));
        
        // 然后刷新用户信息以确保数据一致性
        if (refreshUserInfo) {
            console.log('🔄 Refreshing user info after removing friend...');
            await refreshUserInfo();
            clearFriendValidationCache(); // 清除验证缓存，确保下次加载时获取最新数据
        }
        
    } catch (error) {
        console.error('Failed to remove friend:', error);
        alert('移除好友失败');
    } finally {
        setLoading(false);
    }
};

// 拉黑用户
export const handleBlockUser = async (userID: string, state: UserProfileHandleState) => {
    const { setLoading, friendsData, setFriendsData, setBlockedData, refreshUserInfo } = state;
    
    setLoading(true);
    try {
        await new Promise<string>((resolve, reject) => {
            new BlockUserMessage(getUserInfo().userID, userID).send(
                (result) => resolve(result),
                (error) => reject(error)
            );
        });

        // 从好友列表中移除并添加到黑名单（即时反馈）
        const friendToBlock = friendsData.find(friend => friend.id === userID);
        if (friendToBlock) {
            setFriendsData(prev => prev.filter(friend => friend.id !== userID));
            setBlockedData(prev => [...prev, {
                id: friendToBlock.id,
                username: friendToBlock.username,
                rank: friendToBlock.rank,
                blockedDate: new Date().toISOString().split('T')[0]
            }]);
        }
        
        // 刷新用户信息以确保数据一致性
        if (refreshUserInfo) {
            console.log('🔄 Refreshing user info after blocking user...');
            await refreshUserInfo();
            clearFriendValidationCache(); // 清除验证缓存，确保下次加载时获取最新数据
        }
        
    } catch (error) {
        console.error('Failed to block user:', error);
        alert('拉黑用户失败');
    } finally {
        setLoading(false);
    }
};

// 解除拉黑 (暂时没有API)
export const handleUnblockUser = async (userID: string) => {
    // TODO: 实现解除拉黑API
    alert('解除拉黑功能暂未实现');
};

// 播放按钮点击音效
export const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
};

// 处理关闭
export const handleClose = (state: UserProfileHandleState) => {
    const { setIsClosing, onClose } = state;
    
    playClickSound();
    setIsClosing(true);
    // 等待动画完成后再隐藏模态框
    setTimeout(() => {
        setIsClosing(false);
        onClose();
    }, 300); // 300ms 匹配 CSS 动画时长
};

// 处理关闭按钮点击
export const handleCloseButtonClick = (e: React.MouseEvent, state: UserProfileHandleState) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose(state);
};

// 处理遮罩点击
export const handleOverlayClick = (e: React.MouseEvent, state: UserProfileHandleState) => {
    if (e.target === e.currentTarget) {
        handleClose(state);
    }
};

// 处理选项卡切换
export const handleTabSwitch = (tab: 'friends' | 'blocked', state: UserProfileHandleState) => {
    const { activeTab, setActiveTab } = state;
    
    if (tab === activeTab) return;
    playClickSound();
    setActiveTab(tab);
};

// 获取状态显示信息
export const getStatusInfo = (status: string) => {
    switch (status) {
        case 'online':
            return { text: '在线', color: '#27ae60', icon: '🟢' };
        case 'offline':
            return { text: '离线', color: '#95a5a6', icon: '⚫' };
        case 'in-game':
            return { text: '对战中', color: '#e74c3c', icon: '🔴' };
        default:
            return { text: '未知', color: '#95a5a6', icon: '⚫' };
    }
};

// 获取段位颜色
export const getRankColor = (rank: string) => {
    if (rank.includes('青铜')) return '#CD7F32';
    if (rank.includes('白银')) return '#C0C0C0';
    if (rank.includes('黄金')) return '#FFD700';
    if (rank.includes('白金')) return '#E5E4E2';
    if (rank.includes('钻石')) return '#B9F2FF';
    return '#95a5a6';
};
