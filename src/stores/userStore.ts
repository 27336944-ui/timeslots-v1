
import { observable, action } from 'mobx-miniprogram';
import { storage } from '../utils/storage';
import type { UserInfo } from '../types/api';

const USER_KEY = 'user';


interface UserStore {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
}


const savedUser = storage.get<UserInfo>(USER_KEY);


export const userStore: UserStore = observable({
  user: savedUser ?? null,

  
  setUser: action(function (this: UserStore, user: UserInfo) {
    this.user = user;
    storage.set(USER_KEY, user);
  }),

  
  clearUser: action(function (this: UserStore) {
    this.user = null;
    storage.remove(USER_KEY);
  }),
});
