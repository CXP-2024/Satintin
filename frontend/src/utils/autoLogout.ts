import { LogoutUserMessage } from '../Plugins/UserService/APIs/LogoutUserMessage';
import { getUserToken, clearUserInfo, initUserToken } from 'Plugins/CommonUtils/Store/UserInfoStore';

class AutoLogoutManager {
  private currentUserToken: string | null = null;
  private isListening: boolean = false;

  /**
   * 启动监听
   */
  startListening(): void {
    console.log('🎧 [AutoLogout] 启动监听');
    this.currentUserToken = getUserToken();
    console.log('🔑 [AutoLogout] 缓存token:', this.currentUserToken?.substring(0, 10) + '...');

    if (this.isListening) {
      console.log('⚠️ [AutoLogout] 已在监听中');
      return;
    }

    window.addEventListener('beforeunload', this.handleBeforeUnload);
    this.isListening = true;
    console.log('✅ [AutoLogout] 监听器已添加');
  }

  /**
   * 停止监听
   */
  stopListening(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.isListening = false;
    this.currentUserToken = null;
  }

  /**
   * 页面关闭处理 - 使用多种方法确保请求发送
   */
  handleBeforeUnload = (event: BeforeUnloadEvent) => {
    console.log('🚨 [AutoLogout] beforeunload触发');
    
    if (!this.currentUserToken) {
      console.log('❌ [AutoLogout] 没有token');
      event.preventDefault();
      event.returnValue = 'Token为空，无法logout';
      return 'Token为空';
    }

    console.log('🚪 [AutoLogout] 执行logout');
    
    // 尝试发送logout请求
    this.sendLogoutRequest(this.currentUserToken);
    
    // 显示确认对话框（暂时保留用于调试）
    event.preventDefault();
    event.returnValue = '正在执行logout，请稍候...';
    return '正在执行logout';
  };

  /**
   * 发送logout请求 - 使用多种方法
   */
  private sendLogoutRequest(userToken: string): void {
    console.log('📤 [AutoLogout] 发送logout请求，token:', userToken.substring(0, 10) + '...');

    const logoutData = {
      userToken: userToken,
      planContext: {
        traceID: { id: `logout-${Date.now()}` },
        transactionLevel: 0
      }
    };

    // 方法1: sendBeacon (最推荐)
    try {
      const success = navigator.sendBeacon(
        'http://127.0.0.1:10010/api/LogoutUserMessage',
        JSON.stringify(logoutData)
      );
      console.log(`📡 [AutoLogout] sendBeacon结果: ${success}`);
      
      if (success) {
        console.log('✅ [AutoLogout] sendBeacon成功');
        return;
      }
    } catch (error) {
      console.error('❌ [AutoLogout] sendBeacon失败:', error);
    }

    // 方法2: 同步XHR (备用)
    try {
      console.log('🔄 [AutoLogout] 尝试同步XHR');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://127.0.0.1:10010/api/LogoutUserMessage', false); // false = 同步
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(logoutData));
      
      console.log(`📡 [AutoLogout] 同步XHR状态: ${xhr.status}`);
      console.log(`📡 [AutoLogout] 同步XHR响应: ${xhr.responseText}`);
      
      if (xhr.status === 200) {
        console.log('✅ [AutoLogout] 同步XHR成功');
        return;
      }
    } catch (error) {
      console.error('❌ [AutoLogout] 同步XHR失败:', error);
    }

    // 方法3: fetch with keepalive (备用)
    try {
      console.log('🔄 [AutoLogout] 尝试fetch keepalive');
      fetch('http://127.0.0.1:10010/api/LogoutUserMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logoutData),
        keepalive: true
      }).then(response => {
        console.log(`📡 [AutoLogout] fetch keepalive状态: ${response.status}`);
      }).catch(error => {
        console.log('❌ [AutoLogout] fetch keepalive失败:', error);
      });
    } catch (error) {
      console.error('❌ [AutoLogout] fetch keepalive异常:', error);
    }
  }

  /**
   * 更新token
   */
  updateToken(): void {
    this.currentUserToken = getUserToken();
    console.log('🔄 [AutoLogout] token已更新');
  }

  /**
   * 手动logout
   */
  async manualLogout(reason: string, providedToken?: string): Promise<void> {
    const userToken = providedToken || getUserToken();
    if (!userToken) return;

    console.log('🖱️ [AutoLogout] 手动logout:', reason);
    return new Promise((resolve, reject) => {
      new LogoutUserMessage(userToken).send(
        () => resolve(),
        (error) => reject(error)
      );
    });
  }
}

const autoLogoutManagerInstance = new AutoLogoutManager();
export const autoLogoutManager = autoLogoutManagerInstance;
