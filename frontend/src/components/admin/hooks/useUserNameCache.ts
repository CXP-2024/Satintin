import { useState } from 'react';
import { GetUserInfoMessage } from 'Plugins/UserService/APIs/GetUserInfoMessage';
import { User } from 'Plugins/UserService/Objects/User';
import { UserNameCache } from '../types';

export const useUserNameCache = () => {
  const [userNameCache, setUserNameCache] = useState<UserNameCache>({});

  const fetchUserName = async (userID: string) => {
    if (userNameCache[userID]) {
      return userNameCache[userID];
    }

    return new Promise<string>((resolve) => {
      new GetUserInfoMessage(userID).send(
        (response: string) => {
          try {
            let userData: any = response;
            if (typeof response === 'string') {
              userData = JSON.parse(response);
              if (typeof userData === 'string') {
                userData = JSON.parse(userData);
              }
            }

            const userObj = new User(
              userData.userID,
              userData.userName,
              userData.passwordHash,
              userData.email,
              userData.phoneNumber,
              userData.registerTime,
              userData.permissionLevel,
              userData.banDays,
              userData.isOnline,
              userData.matchStatus,
              userData.stoneAmount,
              userData.credits,
              userData.rank,
              userData.rankPosition,
              userData.friendList,
              userData.blackList,
              userData.messageBox
            );

            setUserNameCache(prev => ({
              ...prev,
              [userID]: userObj.userName
            }));
            resolve(userObj.userName);
          } catch (error) {
            console.error(`❌ [ReportHandling] 解析用户${userID}信息失败:`, error);
            resolve(userID);
          }
        },
        (error: any) => {
          console.error(`❌ [ReportHandling] 获取用户${userID}信息失败:`, error);
          resolve(userID);
        }
      );
    });
  };

  return { userNameCache, fetchUserName };
}; 