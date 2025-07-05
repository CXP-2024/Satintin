import { useState } from 'react';
import { useUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import { QueryIDByUserNameMessage } from "Plugins/UserService/APIs/QueryIDByUserNameMessage";
import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";
import { QueryAssetStatusMessage } from "Plugins/AssetService/APIs/QueryAssetStatusMessage";

export const useUserSearch = () => {
    const userToken = useUserToken();
    const [searchUsername, setSearchUsername] = useState('');
    const [searchedUser, setSearchedUser] = useState<any>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [showSearchUser, setShowSearchUser] = useState(false);

    const handleSearchUser = async (userID?: string) => {
        if (!searchUsername.trim()) {
            setSearchError('请输入用户名');
            return;
        }

        setSearchLoading(true);
        setSearchError('');
        
        try {
            console.log('🔍 [useUserSearch] 开始搜索用户:', searchUsername);
            
            // Step 1: 根据用户名查询用户ID
            const userIdResponse: any = await new Promise((resolve, reject) => {
                new QueryIDByUserNameMessage(searchUsername).send(
                    (res: any) => resolve(res),
                    (err: any) => reject(err)
                );
            });
            
            const targetUserId = typeof userIdResponse === 'string' ? userIdResponse : userIdResponse.userID;
            console.log('🔍 [useUserSearch] 查询到用户ID:', targetUserId);
            
            // Step 2: 根据用户ID获取用户详细信息
            const userInfoResponse: any = await new Promise((resolve, reject) => {
                new GetUserInfoMessage(userToken, targetUserId).send(
                    (res: any) => resolve(res),
                    (err: any) => reject(err)
                );
            });
            
            const userInfo = typeof userInfoResponse === 'string' ? JSON.parse(userInfoResponse) : userInfoResponse;
            console.log('🔍 [useUserSearch] 获取到用户信息:', userInfo);
            
            // Step 3: 获取用户的原石数量
            try {
                const assetStatusResponse: any = await new Promise((resolve, reject) => {
                    new QueryAssetStatusMessage(userID || '').send(
                        (res: any) => resolve(res),
                        (err: any) => reject(err)
                    );
                });
                
                const stoneAmount = typeof assetStatusResponse === 'string' ? 
                    parseInt(assetStatusResponse) : assetStatusResponse.stoneAmount || assetStatusResponse;
                
                console.log('🔍 [useUserSearch] 获取到原石数量:', stoneAmount);
                
                // 更新用户信息中的原石数量
                userInfo.stoneAmount = stoneAmount;
            } catch (assetError) {
                console.warn('🔍 [useUserSearch] 获取原石数量失败:', assetError);
                // 如果获取原石失败，使用默认值或保持原有值
                userInfo.stoneAmount = userInfo.stoneAmount || 'N/A';
            }
            
            setSearchedUser(userInfo);
            setSearchError('');
            
        } catch (error) {
            console.error('🔍 [useUserSearch] 搜索用户失败:', error);
            if (error instanceof Error) {
                if (error.message.includes('不存在')) {
                    setSearchError('用户不存在');
                } else {
                    setSearchError('搜索失败，请重试');
                }
            } else {
                setSearchError('搜索失败，请重试');
            }
            setSearchedUser(null);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleShowSearchUser = () => {
        console.log('🔍 [useUserSearch] 显示搜索用户弹窗');
        setShowSearchUser(true);
        setSearchUsername('');
        setSearchedUser(null);
        setSearchError('');
    };

    const handleCloseSearchUser = () => {
        console.log('🔍 [useUserSearch] 关闭搜索用户弹窗');
        setShowSearchUser(false);
        setSearchUsername('');
        setSearchedUser(null);
        setSearchError('');
    };

    return {
        searchUsername,
        setSearchUsername,
        searchedUser,
        searchLoading,
        searchError,
        showSearchUser,
        handleSearchUser,
        handleShowSearchUser,
        handleCloseSearchUser
    };
};
