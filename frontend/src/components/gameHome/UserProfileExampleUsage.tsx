// 使用示例：如何使用重构后的 UserProfile 模块

import { fetchFriendsData, fetchBlockedData, refreshUserInfo, clearFriendValidationCache } from "./UserProfileUtils";
import { UserProfileState } from "./UserProfileTypes";

// 示例：在 React 组件中使用
const ExampleUsage = () => {
    // 模拟的状态管理
    const userProfileState: UserProfileState = {
        user: {
            friendList: [
                { friendID: "user1" },
                { friendID: "user2" }
            ],
            blackList: [
                { blackUserID: "blocked1" }
            ]
        },
        setFriendsData: (data) => console.log("Friends data:", data),
        setBlockedData: (data) => console.log("Blocked data:", data),
        setLoading: (loading) => console.log("Loading:", loading),
        setFriendsLoadingStatus: (status) => console.log("Status:", status)
    };

    const handleLoadFriends = async () => {
        await fetchFriendsData(userProfileState);
    };

    const handleLoadBlocked = async () => {
        await fetchBlockedData(userProfileState);
    };

    const handleRefreshUserInfo = async () => {
        await refreshUserInfo();
    };

    const handleClearCache = () => {
        clearFriendValidationCache();
    };

    return (
        <div>
            <button onClick={handleLoadFriends}>加载好友</button>
            <button onClick={handleLoadBlocked}>加载黑名单</button>
            <button onClick={handleRefreshUserInfo}>刷新用户信息</button>
            <button onClick={handleClearCache}>清除缓存</button>
        </div>
    );
};

export default ExampleUsage;
