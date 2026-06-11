
import { observable, action } from 'mobx-miniprogram';
import { storage } from '../utils/storage';

const TOKEN_KEY = 'token';

interface AuthStore {
  token: string;
  isLoggedIn: boolean;
  wxLoggingIn: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  setWxLoggingIn: (v: boolean) => void;
}

const savedToken = storage.get<string>(TOKEN_KEY) || '';

export const authStore: AuthStore = observable({
  token: savedToken,
  isLoggedIn: !!savedToken,
  wxLoggingIn: false,

  setToken: action(function (this: AuthStore, token: string) {
    this.token = token;
    this.isLoggedIn = true;
    storage.set(TOKEN_KEY, token);
  }),

  clearToken: action(function (this: AuthStore) {
    this.token = '';
    this.isLoggedIn = false;
    storage.remove(TOKEN_KEY);
  }),

  setWxLoggingIn: action(function (this: AuthStore, v: boolean) {
    this.wxLoggingIn = v;
  }),
});
