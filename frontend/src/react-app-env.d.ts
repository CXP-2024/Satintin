/// <reference types="react-scripts" />

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
