// 缓存管理服务

// 缓存控制变量
let shouldSkipValidation = false;
let lastValidationTime = 0;
const VALIDATION_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存时间

// 检查是否应该跳过验证（基于缓存）
export const shouldSkipValidationCheck = (): boolean => {
    const now = Date.now();
    return shouldSkipValidation && (now - lastValidationTime) < VALIDATION_CACHE_DURATION;
};

// 更新缓存状态
export const updateValidationCache = (): void => {
    shouldSkipValidation = true;
    lastValidationTime = Date.now();
};

// 强制清除验证缓存的函数（供外部调用）
export const clearFriendValidationCache = (): void => {
    shouldSkipValidation = false;
    lastValidationTime = 0;
    console.log('🧹 Friend validation cache cleared');
};

// 获取缓存持续时间
export const getCacheDuration = (): number => {
    return VALIDATION_CACHE_DURATION;
};
