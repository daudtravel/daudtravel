import { create } from "zustand";

interface UserInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface SignupStore {
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
}

export const useSignupStore = create<SignupStore>((set) => ({
  userInfo: {
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    password: undefined,
    confirmPassword: undefined,
  },
  setUserInfo: (info) => set({ userInfo: info }),
}));
