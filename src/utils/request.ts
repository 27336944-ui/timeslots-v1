

import { storage } from './storage';
import type { ApiResponse, WxRequestData, WxRequestMethod } from '../types/api';


const BASE_URL = 'http://localhost:7777';
const TOKEN_KEY = 'token';


function getToken(): string | null {
  return storage.get<string>(TOKEN_KEY);
}


async function request<T>(
  method: WxRequestMethod,
  path: string,
  data?: WxRequestData,
): Promise<T> {
  const token = getToken();
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header,
      timeout: 10000,
      enableHttp2: false,
      success(res) {
        
        const body = res.data as ApiResponse<T>;
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === 0) {
            
            resolve(body.data as T);
          } else {
            
            reject(new Error(body.message || `Business error: ${body.code}`));
          }
        } else {
          
          resolve(body as unknown as T);
        }
      },
      fail(err) {
        const msg = err.errMsg || 'Network error';
        
        if (msg.includes('合法域名') || msg.includes('domain')) {
          reject(new Error('开发环境请在微信开发者工具勾选"不校验合法域名"，或配置 HTTPS 域名'));
        } else if (msg.includes('timeout')) {
          reject(new Error('请求超时，请检查后端服务是否运行'));
        } else if (
          msg.includes('ECONNREFUSED') || msg.includes('ERR_CONNECTION_REFUSED')
        ) {
          reject(new Error('后端服务未启动，请在 server/ 目录执行 npm run start:dev 启动后端'));
        } else {
          reject(new Error(msg));
        }
      },
    });
  });
}


export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}


export function post<T>(path: string, data?: WxRequestData): Promise<T> {
  return request<T>('POST', path, data);
}


export function put<T>(path: string, data?: WxRequestData): Promise<T> {
  return request<T>('PUT', path, data);
}


export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}


export function patch<T>(path: string, data?: WxRequestData): Promise<T> {
  return request<T>('PATCH' as WxRequestMethod, path, data);
}
