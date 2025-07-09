// 黑名单用户服务

import { BlockedUserInfo, FriendInfo, UserProfileState } from "./UserProfile/UserProfileTypes";
import { fetchFriendInfo } from "./FriendService";

// 获取黑名单数据
export const fetchBlockedData = async (state: UserProfileState): Promise<void> => {
    const { user, setBlockedData, setLoading } = state;
    
    if (!user?.blackList) {
        setBlockedData([]);
        return;
    }

    setLoading(true);
    try {
        const blockedPromises = user.blackList.map(blackEntry =>
            fetchFriendInfo(blackEntry.blackUserID)
        );

        const blockedInfos = await Promise.all(blockedPromises);
        const validBlocked = blockedInfos.filter((blocked): blocked is FriendInfo => blocked !== null)
            .map(blocked => ({
                id: blocked.id,
                username: blocked.username,
                rank: blocked.rank,
                blockedDate: new Date().toISOString().split('T')[0] // 暂时使用当前日期
            }));

        setBlockedData(validBlocked);
    } catch (error) {
        console.error('Failed to fetch blocked data:', error);
        setBlockedData([]);
    } finally {
        setLoading(false);
    }
};
