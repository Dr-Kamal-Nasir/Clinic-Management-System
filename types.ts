// types.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  // etc.
}

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};