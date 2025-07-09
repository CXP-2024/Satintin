// 主要的用户资料工具函数 - 重构后的协调器

import { UserProfileState, FriendEntry } from "./UserProfileTypes";
import { refreshUserInfo } from "../UserInfoService";
import { shouldSkipValidationCheck, updateValidationCache, clearFriendValidationCache } from "../CacheService";
import { validateMultipleUsersExist } from "../UserValidationService";
import { parseFriendListToArray, filterValidFriendEntries, fetchFriendsDetailedInfo } from "../FriendService";
import { fetchBlockedData } from "../BlockedUserService";

// 重新导出常用函数和类型
export { refreshUserInfo, clearFriendValidationCache, fetchBlockedData };
export type { UserProfileState, FriendEntry, FriendInfo, BlockedUserInfo } from "./UserProfileTypes";

// 批量验证用户存在性（带缓存控制）
const validateFriendUsers = async (
    validEntries: FriendEntry[], 
    setFriendsLoadingStatus: (status: string) => void,
    forceRefresh = false
): Promise<{ validUserIDs: string[], invalidUserIDs: string[] }> => {
    // 检查是否需要跳过验证（当最近刚验证过时）
    if (!forceRefresh && shouldSkipValidationCheck()) {
        console.log('🚀 Skipping friend validation due to recent cache');
        setFriendsLoadingStatus('使用缓存的验证结果...');
        const allFriendIDs = validEntries.map(entry => entry.friendID);
        return { validUserIDs: allFriendIDs, invalidUserIDs: [] };
    }

    const validationStartTime = performance.now();
    const friendIDs = validEntries.map(entry => entry.friendID);
    const { valid: validUserIDs, invalid: invalidUserIDs } = await validateMultipleUsersExist(friendIDs, setFriendsLoadingStatus);
    const validationEndTime = performance.now();

    console.log(`🚀 Validation completed in ${(validationEndTime - validationStartTime).toFixed(2)}ms`);
    console.log('User validation results:', { validUserIDs, invalidUserIDs });

    // 更新缓存状态
    updateValidationCache();

    if (invalidUserIDs.length > 0) {
        console.warn('Found invalid friend user IDs:', invalidUserIDs);
        setFriendsLoadingStatus(`发现 ${invalidUserIDs.length} 个无效用户ID，将跳过`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { validUserIDs, invalidUserIDs };
};

// 处理加载完成状态
const handleLoadingComplete = (
    invalidUserIDs: string[], 
    setFriendsLoadingStatus: (status: string) => void
): void => {
    if (invalidUserIDs.length > 0) {
        setFriendsLoadingStatus(`加载完成，跳过了 ${invalidUserIDs.length} 个无效用户`);
        // Optional: Clean up invalid friends
        // await cleanInvalidFriends(invalidUserIDs);
    } else {
        setFriendsLoadingStatus('加载完成');
    }

    // Clear status after a delay
    setTimeout(() => setFriendsLoadingStatus(''), 3000);
};

// 获取好友列表数据（重构版：分解为多个职责明确的函数）
export const fetchFriendsData = async (state: UserProfileState, forceRefresh = false): Promise<void> => {
    const { user, setFriendsData, setLoading, setFriendsLoadingStatus } = state;
    const startTime = performance.now();

    // 如果强制刷新，先清除缓存
    if (forceRefresh) {
        clearFriendValidationCache();
        console.log('🧹 Force refresh: cache cleared');
    }

    // 检查用户是否有好友列表
    if (!user?.friendList) {
        console.log('No friend list found for user');
        setFriendsData([]);
        return;
    }

    setLoading(true);
    setFriendsLoadingStatus('正在验证好友列表...');

    try {
        // 1. 解析好友列表为标准数组格式
        const friendListArray = parseFriendListToArray(user.friendList);
        if (friendListArray.length === 0) {
            setFriendsData([]);
            setFriendsLoadingStatus('');
            setLoading(false);
            return;
        }

        // 2. 过滤有效的好友条目
        const validEntries = filterValidFriendEntries(friendListArray);
        if (validEntries.length === 0) {
            console.log('No valid friend entries found');
            setFriendsData([]);
            setFriendsLoadingStatus('');
            setLoading(false);
            return;
        }

        // 3. 批量验证用户存在性（带缓存控制）
        const { validUserIDs, invalidUserIDs } = await validateFriendUsers(validEntries, setFriendsLoadingStatus, forceRefresh);

        // 4. 获取有效用户的详细信息
        const validFriends = await fetchFriendsDetailedInfo(validUserIDs, setFriendsLoadingStatus);

        // 5. 处理加载完成状态
        const totalTime = performance.now() - startTime;
        console.log(`🚀 Total friend loading time: ${totalTime.toFixed(2)}ms`);
        
        handleLoadingComplete(invalidUserIDs, setFriendsLoadingStatus);
        setFriendsData(validFriends);

    } catch (error) {
        console.error('Failed to fetch friends data:', error);
        setFriendsData([]);
        setFriendsLoadingStatus('加载好友列表失败');
    } finally {
        setLoading(false);
    }
};
