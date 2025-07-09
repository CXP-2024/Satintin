// 用户信息服务

import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";
import { setUserInfo, getUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

// 刷新用户信息的函数
export const refreshUserInfo = async (): Promise<void> => {
    const currentUser = getUserInfo();
    if (!currentUser.userID) {
        console.warn('No user ID found, cannot refresh user info');
        return;
    }

    console.log('🔄 Refreshing user info from server...');
    
    try {
        const response = await new Promise<string>((resolve, reject) => {
            new GetUserInfoMessage(currentUser.userID).send(
                (info) => {
                    console.log('✅ User info refreshed successfully');
                    resolve(info);
                },
                (error) => {
                    console.error('❌ Failed to refresh user info:', error);
                    reject(error);
                }
            );
        });

        // 解析并更新用户信息
        const userInfo = typeof response === 'string' ? JSON.parse(response) : response;
        setUserInfo(userInfo);
        console.log('📝 User info updated in store');
    } catch (error) {
        console.error('Failed to refresh user info:', error);
        throw error;
    }
};
