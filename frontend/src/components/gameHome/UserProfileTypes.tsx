// 用户资料相关类型定义

export interface FriendInfo {
    id: string;
    username: string;
    rank: string;
    status: 'online' | 'offline' | 'in-game';
    lastSeen: string;
}

export interface BlockedUserInfo {
    id: string;
    username: string;
    rank: string;
    blockedDate: string;
}

// 好友列表条目类型
export interface FriendEntry {
    friendID: string;
}

// 定义状态管理函数类型
export interface UserProfileState {
    user: any;
    setFriendsData: (data: FriendInfo[]) => void;
    setBlockedData: (data: BlockedUserInfo[]) => void;
    setLoading: (loading: boolean) => void;
    setFriendsLoadingStatus: (status: string) => void;
    refreshUserInfo?: () => Promise<void>; // 可选的刷新用户信息函数
}
