/// <reference types="react-scripts" />

// 添加视频文件类型声明
declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.avi' {
  const src: string;
  export default src;
}

declare module '*.mov' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
    REACT_APP_API_BASE_URL: string;
    REACT_APP_USER_SERVICE_URL: string;
    REACT_APP_CARD_SERVICE_URL: string;
    REACT_APP_ADMIN_SERVICE_URL: string;
    REACT_APP_ASSET_SERVICE_URL: string;
    REACT_APP_BATTLE_SERVICE_URL: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_BASE_URL: string;
    REACT_APP_USER_SERVICE_URL: string;
    REACT_APP_CARD_SERVICE_URL: string;
    REACT_APP_ADMIN_SERVICE_URL: string;
    REACT_APP_ASSET_SERVICE_URL: string;
    REACT_APP_BATTLE_SERVICE_URL: string;
  }
}
