import { create } from 'zustand';

export type User = {
  name: string;
  email: string;
  role: string;
};

type UserStore = {
  user: User;
  setUser: (data: Partial<User>) => void;
  clearUser: () => void;
};

const initialUser: User = {
 name: '',
  email: '',
  role: ''
};

export const useUserStore = create<UserStore>((set) => ({
  user: initialUser,
  setUser: (data) =>
    set((state) => ({ user: { ...state.user, ...data } })),
  clearUser: () => set({ user: initialUser }),
}));