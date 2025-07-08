import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";
// 定义类型接口
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
}

// 轻量级检查用户是否存在（优化版：使用现有API但采用智能缓存策略）
export const checkUserExistsLightweight = async (userID: string): Promise<boolean> => {
    console.log('Performing lightweight user existence check:', userID);

    try {
        // Use GetUserInfoMessage but with optimized error handling
        // Note: This is a step-by-step approach - future optimization could use ViewUserBasicInfoMessage
        const response = await new Promise<string>((resolve, reject) => {
            new GetUserInfoMessage(userID).send(
                (info) => {
                    console.log('Lightweight user check success:', userID);
                    resolve(info);
                },
                (error) => {
                    console.log('Lightweight user check failed:', userID, error);
                    // Check if this is the "head of empty list" error which means user doesn't exist
                    if (typeof error === 'string' && error.includes('head of empty list')) {
                        console.warn(`User with ID ${userID} does not exist`);
                        resolve(''); // Return empty string to indicate user not found
                    } else {
                        reject(error);
                    }
                }
            );
        });

        // If we got a response, user exists
        if (response && response.trim() !== '') {
            console.log(`✅ User ${userID} exists (lightweight check)`);
            return true;
        } else {
            console.log(`❌ User ${userID} does not exist (lightweight check)`);
            return false;
        }
    } catch (error) {
        console.error('Error in lightweight user existence check:', userID, error);
        return false;
    }
};

// 批量检查多个用户是否存在（用于friend list validation）
export const validateMultipleUsersExist = async (
    userIDs: string[], 
    setFriendsLoadingStatus: (status: string) => void
): Promise<{valid: string[], invalid: string[]}> => {
    console.log('Validating multiple users:', userIDs);

    const valid: string[] = [];
    const invalid: string[] = [];

    // Process users sequentially to avoid overwhelming the backend
    for (let i = 0; i < userIDs.length; i++) {
        const userID = userIDs[i];
        setFriendsLoadingStatus(`验证用户 ${i + 1}/${userIDs.length}: ${userID}`);

        try {
            const exists = await checkUserExistsLightweight(userID);
            if (exists) {
                valid.push(userID);
            } else {
                invalid.push(userID);
            }
        } catch (error) {
            console.error(`Error checking user ${userID}:`, error);
            invalid.push(userID);
        }

        // Add small delay to prevent overwhelming the backend
        if (i < userIDs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    console.log('Validation results:', { valid, invalid });
    return { valid, invalid };
};

// 获取好友详细信息（假设用户已经通过轻量级验证存在）
export const fetchFriendInfo = async (friendID: string): Promise<FriendInfo | null> => {
    console.log('Fetching friend info for validated user ID:', friendID);

    if (!friendID || friendID.trim() === '') {
        console.error('Invalid friend ID: empty or null');
        return null;
    }

    // Since we pre-validate users, we can directly fetch their info
    try {
        const response = await new Promise<string>((resolve, reject) => {
            new GetUserInfoMessage(friendID).send(
                (info) => {
                    console.log('GetUserInfoMessage success for validated user:', friendID);
                    resolve(info);
                },
                (error) => {
                    console.error('GetUserInfoMessage error for validated user:', friendID, error);
                    // Even though user was validated, they might have been deleted in the meantime
                    if (typeof error === 'string' && error.includes('head of empty list')) {
                        console.warn(`User with ID ${friendID} was deleted between validation and fetch`);
                        resolve(''); // Return empty string to indicate user not found
                    } else {
                        reject(error);
                    }
                }
            );
        });

        console.log('Friend info response:', response);

        if (!response || response.trim() === '') {
            console.warn('Empty response from GetUserInfoMessage - user may have been deleted:', friendID);
            return null;
        }

        const friendData = JSON.parse(response);
        console.log('Parsed friend data:', friendData);

        // Validate required fields
        if (!friendData.userID || !friendData.userName) {
            console.error('Invalid friend data - missing required fields:', friendData);
            return null;
        }

        return {
            id: friendData.userID,
            username: friendData.userName,
            rank: friendData.rank || '青铜I',
            status: friendData.isOnline ? 'online' : 'offline',
            lastSeen: friendData.isOnline ? '在线' : '离线'
        };
    } catch (error) {
        console.error('Failed to fetch friend info for validated user:', friendID, 'Error:', error);

        // Handle specific backend errors gracefully
        if (typeof error === 'string' && error.includes('head of empty list')) {
            console.warn(`User ${friendID} not found in database - may have been deleted recently`);
            return null;
        }

        return null;
    }
};

// 解析好友列表数据为标准数组格式
const parseFriendListToArray = (friendList: any): FriendEntry[] => {
    console.log('User friend list:', friendList);
    console.log('Friend list length:', friendList?.length);

    if (Array.isArray(friendList)) {
        console.log('Friend list is already an array');
        return friendList;
    } 
    
    if (typeof friendList === 'string') {
        console.log('Friend list is a string, attempting to parse...');
        try {
            const parsed = JSON.parse(friendList);
            if (Array.isArray(parsed)) {
                console.log('Successfully parsed friend list from string:', parsed);
                return parsed;
            } else {
                console.error('Parsed friend list is not an array:', parsed);
                return [];
            }
        } catch (e) {
            console.error('Failed to parse friend list JSON:', e);
            return [];
        }
    } 
    
    if (friendList && typeof friendList === 'object') {
        console.log('Friend list is an object, checking if it needs parsing...');
        try {
            const jsonString = JSON.stringify(friendList);
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) {
                console.log('Successfully converted object to array:', parsed);
                return parsed;
            } else {
                console.error('Converted object is not an array:', parsed);
                return [];
            }
        } catch (e) {
            console.error('Failed to convert object to array:', e);
            return [];
        }
    }
    
    console.error('Friend list is not an array, string, or object:', typeof friendList);
    return [];
};

// 验证好友条目是否有效
const isValidFriendEntry = (entry: any): boolean => {
    if (!entry) {
        console.warn('Found null/undefined friend entry');
        return false;
    }
    if (!entry.friendID) {
        console.warn('Found friend entry without friendID:', entry);
        return false;
    }
    if (typeof entry.friendID !== 'string') {
        console.warn('Found friend entry with non-string friendID:', entry);
        return false;
    }
    if (entry.friendID.trim() === '') {
        console.warn('Found friend entry with empty friendID:', entry);
        return false;
    }
    return true;
};

// 过滤有效的好友条目
const filterValidFriendEntries = (friendListArray: FriendEntry[]): FriendEntry[] => {
    console.log('Processing friend list array:', friendListArray);
    console.log('Friend list array length:', friendListArray.length);

    const validEntries = friendListArray.filter(isValidFriendEntry);
    console.log('Valid friend entries:', validEntries);
    
    return validEntries;
};

// 批量验证用户存在性
const validateFriendUsers = async (
    validEntries: FriendEntry[], 
    setFriendsLoadingStatus: (status: string) => void
): Promise<{ validUserIDs: string[], invalidUserIDs: string[] }> => {
    const validationStartTime = performance.now();
    const friendIDs = validEntries.map(entry => entry.friendID);
    const { valid: validUserIDs, invalid: invalidUserIDs } = await validateMultipleUsersExist(friendIDs, setFriendsLoadingStatus);
    const validationEndTime = performance.now();

    console.log(`🚀 Validation completed in ${(validationEndTime - validationStartTime).toFixed(2)}ms`);
    console.log('User validation results:', { validUserIDs, invalidUserIDs });

    if (invalidUserIDs.length > 0) {
        console.warn('Found invalid friend user IDs:', invalidUserIDs);
        setFriendsLoadingStatus(`发现 ${invalidUserIDs.length} 个无效用户ID，将跳过`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { validUserIDs, invalidUserIDs };
};

// 批量获取好友详细信息
const fetchFriendsDetailedInfo = async (
    validUserIDs: string[], 
    setFriendsLoadingStatus: (status: string) => void
): Promise<FriendInfo[]> => {
    const fetchStartTime = performance.now();
    setFriendsLoadingStatus('正在获取好友详细信息...');
    const validFriends: FriendInfo[] = [];

    for (let i = 0; i < validUserIDs.length; i++) {
        const friendID = validUserIDs[i];
        setFriendsLoadingStatus(`正在加载好友 ${i + 1}/${validUserIDs.length}...`);
        console.log(`Fetching detailed info for valid user ${i}:`, friendID);

        try {
            const friendInfo = await fetchFriendInfo(friendID);
            if (friendInfo) {
                validFriends.push(friendInfo);
                console.log(`Successfully fetched friend ${i}:`, friendInfo);
            } else {
                console.warn(`Failed to fetch detailed info for friend ${friendID}`);
            }
        } catch (error) {
            console.error(`Error fetching friend ${i} (${friendID}):`, error);
            // Continue with next friend instead of failing completely
        }

        // Add small delay to prevent overwhelming the backend
        if (i < validUserIDs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    const fetchEndTime = performance.now();
    console.log(`🚀 Detailed info fetch completed in ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);
    console.log('All valid friends fetched:', validFriends);

    return validFriends;
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
export const fetchFriendsData = async (state: UserProfileState) => {
    const { user, setFriendsData, setLoading, setFriendsLoadingStatus } = state;
    const startTime = performance.now();

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

        // 3. 批量验证用户存在性
        const { validUserIDs, invalidUserIDs } = await validateFriendUsers(validEntries, setFriendsLoadingStatus);

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

// 获取黑名单数据
export const fetchBlockedData = async (state: UserProfileState) => {
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
