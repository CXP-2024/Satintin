import { SoundUtils } from 'utils/soundUtils';

type SoundUtilsType = typeof SoundUtils;

export const playClickSound = (soundUtils: SoundUtilsType): void => {
  try {
    soundUtils.playClickSound();
  } catch (error) {
    console.error('❌ [ReportUtils] 播放点击音效失败:', error);
  }
};

export const getAdminToken = (getUserTokenFn: () => string | null): string | null => {
  const userToken = getUserTokenFn();
  if (!userToken) {
    console.error('❌ [ReportUtils] 用户token不存在');
    return null;
  }
  return userToken;
};

// 确保文件被视为模块
export type { SoundUtilsType }; 