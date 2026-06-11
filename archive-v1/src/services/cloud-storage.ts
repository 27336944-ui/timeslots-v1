/**
 * wx.cloud.uploadFile 入参（仅含 MVP 必需字段）。
 */
export interface CloudUploadOptions {
  /** 云端路径（含文件名前缀，如 `user/<userId>/avatar.jpg`） */
  cloudPath: string;
  /** 本地临时文件路径（wx.chooseMedia 返回） */
  filePath: string;
}

/**
 * wx.cloud.uploadFile 返回值（仅含 MVP 必需字段）。
 */
export interface CloudUploadResult {
  /** 云端文件 ID；后续入库用此 ID 引用文件 */
  fileID: string;
}

/**
 * 临时文件 URL 项。
 */
export interface CloudTempUrlItem {
  fileID: string;
  /** 有效期约 2 小时，仅供前端展示 */
  tempFileURL: string;
}

/**
 * 文件删除结果项。
 */
export interface CloudDeleteItem {
  fileID: string;
  /** 0 = 成功；其他见 wx.cloud 文档 */
  status: number;
}

/**
 * 微信云存储客户端契约。
 *
 * **当前实现是 stub**（详见 `cloudStorage` 导出），M3 接入 wx.cloud 后替换。
 *
 * @see AGENTS §6.5
 */
export interface ICloudStorageClient {
  /**
   * 上传文件到微信云存储。
   *
   * @param options - 含 cloudPath + filePath
   * @returns 含 fileID
   */
  upload(options: CloudUploadOptions): Promise<CloudUploadResult>;
  /**
   * 换取 fileID 列表的临时访问 URL。
   *
   * @param fileIDs - 云端文件 ID 列表
   * @returns 临时 URL 列表
   */
  getTempFileURL(fileIDs: string[]): Promise<CloudTempUrlItem[]>;
  /**
   * 删除云端文件。
   *
   * @param fileIDs - 云端文件 ID 列表
   * @returns 删除结果列表
   */
  delete(fileIDs: string[]): Promise<CloudDeleteItem[]>;
}

/**
 * ICloudStorageClient 的占位实现。
 *
 * 所有方法抛 "deferred to M3" 错误（见 AGENTS §6.5 契约）。
 */
class StubCloudStorageClient implements ICloudStorageClient {
  async upload(_options: CloudUploadOptions): Promise<CloudUploadResult> {
    throw new Error('ICloudStorageClient.upload() not implemented, deferred to M3 (need wx.cloud env ID)');
  }

  async getTempFileURL(_fileIDs: string[]): Promise<CloudTempUrlItem[]> {
    throw new Error('ICloudStorageClient.getTempFileURL() not implemented, deferred to M3 (need wx.cloud env ID)');
  }

  async delete(_fileIDs: string[]): Promise<CloudDeleteItem[]> {
    throw new Error('ICloudStorageClient.delete() not implemented, deferred to M3 (need wx.cloud env ID)');
  }
}

/**
 * 全局 ICloudStorageClient 单例（当前指向 stub）。
 *
 * 业务侧统一 `import { cloudStorage } from '@/services/cloud-storage'`；
 * **禁止**在页面/组件里直接 `new StubCloudStorageClient`。
 */
export const cloudStorage: ICloudStorageClient = new StubCloudStorageClient();
