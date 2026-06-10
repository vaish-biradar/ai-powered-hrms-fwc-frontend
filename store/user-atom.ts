'use client';
import { atom } from 'jotai';

export interface UserInfo {
  id?: string | undefined;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  image?: string;
  role?: 'HR' | 'Employee';
  accessToken?: string;
  expires?: number | null;
  // add other fields as needed (e.g., jobTitle, phone, etc.)
}

// Initialize with null or a default empty state
export const userAtom = atom<UserInfo | null>(null);
