/**
 * 序列化接口定义
 * 用于统一后端对象的序列化行为
 */
export interface Serializable {
  /**
   * 将对象序列化为JSON字符串
   */
  toJson(): string;
  
  /**
   * 将对象转换为普通对象
   */
  toObject(): Record<string, any>;
}

/**
 * 抽象序列化基类
 */
export abstract class SerializableBase implements Serializable {
  toJson(): string {
    return JSON.stringify(this.toObject());
  }
  
  abstract toObject(): Record<string, any>;
}

/**
 * 序列化工具函数
 */
export class SerializationUtils {
  /**
   * 将对象数组序列化为JSON
   */
  static serializeArray<T extends Serializable>(items: T[]): string {
    return JSON.stringify(items.map(item => item.toObject()));
  }
  
  /**
   * 深度序列化对象
   */
  static deepSerialize(obj: any): Record<string, any> {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => SerializationUtils.deepSerialize(item));
    }
    
    if (obj.toObject && typeof obj.toObject === 'function') {
      return obj.toObject();
    }
    
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = SerializationUtils.deepSerialize(obj[key]);
      }
    }
    
    return result;
  }
}