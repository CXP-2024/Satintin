import { useState, useEffect } from 'react';
import { FindOrCreateMatchRoomMessage } from 'Plugins/UserService/APIs/Battle/FindOrCreateMatchRoomMessage';

/**
 * GetBattleRoomId
 * 通过调用FindOrCreateMatchRoomMessage API获取或创建对战房间ID
 * 
 * @param user - 用户对象，包含userID和其他用户信息
 * @returns string - 返回创建或找到的房间ID
 */
export const GetBattleRoomId = (user: any): string => {
  // 用于同步返回，创建一个临时ID作为后备
  const tempRoomId = new URLSearchParams(window.location.search).get('roomId') ||
               `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 使用useState创建一个状态来存储实际的roomID
  const [roomId, setRoomId] = useState<string>(tempRoomId);
  
  // 使用useEffect在组件挂载时发送API请求
  useEffect(() => {
    // 如果没有用户ID或是自定义匹配，不进行API调用
    if (!user || !user.userID || user.matchStatus === 'custom') {
      console.error('❌ [GetBattleRoomId] 无效的用户信息或自定义匹配');
      return;
    }
    
    // 调用API获取或创建房间ID
    new FindOrCreateMatchRoomMessage(user.userID, user.matchStatus).send(
      (response: any) => {
        try {
          // 尝试解析响应
          const parsedResponse = JSON.parse(response)
          setRoomId(parsedResponse.room_id)
        } catch (error) {
          console.error('❌ [GetBattleRoomId] 解析响应失败:', error);
        }
      },
      (error: any) => {
        console.error('❌ [GetBattleRoomId] 获取房间ID失败:', error);
      }
    );
  }, [user, tempRoomId]);
    
  // 如果没有用户ID或是自定义匹配，返回临时ID
  if (!user || !user.userID || user.matchStatus === 'custom') {
    return tempRoomId;
  }

  return roomId;
};

/**
 * GetBattleRoomIdSync
 * 同步版本的获取房间ID函数
 * 它会立即发送API请求并通过回调返回结果
 * 
 * @param user - 用户对象
 * @param callback - 接收房间ID的回调函数
 */
export const GetBattleRoomIdSync = (user: any, callback: (roomId: string) => void): void => {
  // 如果没有用户ID或是自定义匹配，使用URL中的roomId或创建临时ID
  const tempRoomId = new URLSearchParams(window.location.search).get('roomId') ||
               `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 如果没有用户ID或是自定义匹配模式，返回临时ID
  if (!user || !user.userID || user.matchStatus === 'custom') {
    console.error('❌ [GetBattleRoomIdSync] 无效的用户信息或自定义匹配');
    callback(tempRoomId);
    return;
  }

  // 调用API获取或创建房间ID
  new FindOrCreateMatchRoomMessage(user.userID, user.matchStatus).send(
    (response: any) => {
      try {
        // 尝试解析响应
        const parsedResponse = JSON.parse(response);
        console.log('✅ [GetBattleRoomIdSync] 成功获取房间ID:', parsedResponse.room_id);
        callback(parsedResponse.room_id);
      } catch (error) {
        console.error('❌ [GetBattleRoomIdSync] 解析响应失败:', error);
        callback(tempRoomId);
      }
    },
    (error: any) => {
      console.error('❌ [GetBattleRoomIdSync] 获取房间ID失败:', error);
      callback(tempRoomId);
    }
  );
};

export default GetBattleRoomIdSync;
