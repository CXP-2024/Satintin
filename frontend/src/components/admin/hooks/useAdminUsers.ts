import { useState } from 'react';
import { User } from 'Plugins/UserService/Objects/User';
import { GetAllUserIDsMessage } from 'Plugins/UserService/APIs/GetAllUserIDsMessage';
import { GetUserInfoMessage } from 'Plugins/UserService/APIs/GetUserInfoMessage';
import { getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";

export const useAdminUsers = () => {
  const [userList, setUserList] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const loadUserAllInfo = () => {
    setUsersLoading(true);
    setUsersError(null);

    const adminToken = getUserToken();
    
    if (!adminToken) {
      setUsersError('管理员token不存在，请重新登录');
      setUsersLoading(false);
      return;
    }

    console.log('👥 [AdminDashboard] 开始加载用户完整信息');
    
    new GetAllUserIDsMessage().send(
      (response: string) => {
        try {
          console.log('👥 [AdminDashboard] 获取用户ID响应:', response);
          
          let userIDs: string[] = [];
          try {
            const parsed = JSON.parse(response);
            if (typeof parsed === 'string') {
              userIDs = JSON.parse(parsed);
            } else {
              userIDs = parsed;
            }
          } catch (e) {
            console.error('❌ [AdminDashboard] 解析用户ID失败:', e);
            throw new Error('解析用户ID失败');
          }
          
          if (!Array.isArray(userIDs)) {
            throw new Error('返回的用户ID不是数组格式');
          }
          
          console.log('👥 [AdminDashboard] 获取到用户ID列表:', userIDs);
          
          const userPromises = userIDs.map((userID: string) => {
            return new Promise<User>((resolve, reject) => {
              new GetUserInfoMessage(userID).send(
                (userResponse: string) => {
                  try {
                    console.log(`👤 [AdminDashboard] 获取用户${userID}信息:`, userResponse);
                    
                    let userData: any = userResponse;
                    if (typeof userResponse === 'string') {
                      userData = JSON.parse(userResponse);
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
                    
                    resolve(userObj);
                  } catch (error) {
                    console.error(`❌ [AdminDashboard] 解析用户${userID}信息失败:`, error);
                    reject(error);
                  }
                },
                (error: any) => {
                  console.error(`❌ [AdminDashboard] 获取用户${userID}信息失败:`, error);
                  reject(error);
                }
              );
            });
          });
          
          Promise.all(userPromises)
            .then((users: User[]) => {
              console.log('👥 [AdminDashboard] 成功加载所有用户信息:', users);
              setUserList(users);
              setUsersLoading(false);
            })
            .catch((error) => {
              console.error('❌ [AdminDashboard] 加载用户信息失败:', error);
              setUsersError('加载用户详细信息失败');
              setUsersLoading(false);
            });
          
        } catch (error) {
          console.error('❌ [AdminDashboard] 处理用户ID响应失败:', error);
          setUsersError('处理用户ID响应失败');
          setUsersLoading(false);
        }
      },
      (error: any) => {
        console.error('❌ [AdminDashboard] 获取用户ID失败:', error);
        setUsersError('获取用户ID失败');
        setUsersLoading(false);
      }
    );
  };

  return {
    userList,
    usersLoading,
    usersError,
    loadUserAllInfo
  };
}; 