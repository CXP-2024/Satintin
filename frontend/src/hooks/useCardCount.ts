import { useState, useEffect } from 'react';
import { GetPlayerCardsMessage } from "Plugins/CardService/APIs/GetPlayerCardsMessage";

export const useCardCount = (userToken: string | null, userID: string | undefined) => {
    const [cardCount, setCardCount] = useState<number>(0);

    const fetchCardCount = async () => {
        // 确保userToken和userID都存在
        if (!userToken || !userID) {
            console.warn('🃏 [useCardCount] 缺少必要参数 - userToken:', !!userToken, 'userID:', !!userID);
            return;
        }
        
        try {
            console.log('🃏 [useCardCount] 开始获取用户卡牌数量, userID:', userID);
            const response: any = await new Promise((resolve, reject) => {
                new GetPlayerCardsMessage(userID).send(
                    (res: any) => {
                        console.log('🃏 [useCardCount] 获取卡牌原始响应:', res);
                        resolve(res);
                    },
                    (err: any) => {
                        console.error('🃏 [useCardCount] 获取卡牌失败:', err);
                        reject(err);
                    }
                );
            });
            
            // 解析响应数据
            const cardEntries = typeof response === 'string' ? JSON.parse(response) : response;
            console.log('🃏 [useCardCount] 解析后的卡牌数据:', cardEntries);
            
            // 确保cardEntries是数组
            if (Array.isArray(cardEntries)) {
                const totalCards = cardEntries.length; // 计算包含重复卡牌的总数
                console.log('🃏 [useCardCount] 获取到卡牌数量:', totalCards);
                setCardCount(totalCards);
            } else {
                console.warn('🃏 [useCardCount] 卡牌数据格式不正确:', cardEntries);
                setCardCount(0);
            }
            
        } catch (err) {
            console.error('🃏 [useCardCount] 获取卡牌数量失败:', err);
            setCardCount(0);
        }
    };

    // 在组件挂载时获取卡牌数量 - 同时检查userToken和userID
    useEffect(() => {
        console.log('🃏 [useCardCount] useEffect触发 - userToken:', !!userToken, 'userID:', !!userID);
        if (userToken && userID) {
            fetchCardCount();
        }
    }, [userToken, userID]);

    return { cardCount, fetchCardCount };
};
