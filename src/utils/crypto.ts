/**
 * 轻量文本混淆 — XOR 固定 key + Base64
 * 用于本地存储 token 的透明加密，提高逆向门槛（非真加密）
 */
const XOR_KEY = 'tsv1_k3y_2026';

function xorEncode(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export function obfuscate(text: string): string {
  if (!text) return '';
  const xored = xorEncode(text, XOR_KEY);
  // 用 btoa 不可用的小程序环境 → 手动 Base64
  return toBase64(xored);
}

export function deobfuscate(encoded: string): string {
  if (!encoded) return '';
  try {
    const xored = fromBase64(encoded);
    return xorEncode(xored, XOR_KEY); // XOR 两次还原
  } catch {
    return '';
  }
}

function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = str.charCodeAt(i++);
    const c = str.charCodeAt(i++);
    const idx1 = a >> 2;
    const idx2 = ((a & 3) << 4) | (b >> 4);
    const idx3 = ((b & 15) << 2) | (c >> 6);
    const idx4 = c & 63;
    result += chars[idx1] + chars[idx2];
    result += isNaN(b) ? '=' : chars[idx3];
    result += isNaN(c) ? '=' : chars[idx4];
  }
  return result;
}

function fromBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  str = str.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < str.length) {
    const idx1 = chars.indexOf(str.charAt(i++));
    const idx2 = chars.indexOf(str.charAt(i++));
    const idx3 = chars.indexOf(str.charAt(i++));
    const idx4 = chars.indexOf(str.charAt(i++));
    const a = (idx1 << 2) | (idx2 >> 4);
    const b = ((idx2 & 15) << 4) | (idx3 >> 2);
    const c = ((idx3 & 3) << 6) | idx4;
    result += String.fromCharCode(a);
    if (idx3 !== 64) result += String.fromCharCode(b);
    if (idx4 !== 64) result += String.fromCharCode(c);
  }
  return result;
}
