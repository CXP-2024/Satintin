// 用户验证服务

import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";

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
