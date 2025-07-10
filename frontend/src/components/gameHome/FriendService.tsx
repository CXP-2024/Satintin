// 好友服务

import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";
import { FriendInfo, FriendEntry } from "./UserProfile/UserProfileTypes";

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
            rank: friendData.rank || '黑铁',
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
export const parseFriendListToArray = (friendList: any): FriendEntry[] => {
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
export const isValidFriendEntry = (entry: any): boolean => {
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
export const filterValidFriendEntries = (friendListArray: FriendEntry[]): FriendEntry[] => {
    console.log('Processing friend list array:', friendListArray);
    console.log('Friend list array length:', friendListArray.length);

    const validEntries = friendListArray.filter(isValidFriendEntry);
    console.log('Valid friend entries:', validEntries);
    
    return validEntries;
};

// 批量获取好友详细信息
export const fetchFriendsDetailedInfo = async (
    validUserIDs: string[], 
    setFriendsLoadingStatus: (status: string) => void
): Promise<FriendInfo[]> => {
    const fetchStartTime = performance.now();
    //setFriendsLoadingStatus('正在获取好友详细信息...');
    const validFriends: FriendInfo[] = [];

    for (let i = 0; i < validUserIDs.length; i++) {
        const friendID = validUserIDs[i];
        //setFriendsLoadingStatus(`正在加载好友 ${i + 1}/${validUserIDs.length}...`);
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
