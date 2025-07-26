import { IUser } from '@/lib/models/User';

const API_BASE_URL = '/api/admin/users';

export const getUsers = async (): Promise<IUser[]> => {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const createUser = async (data: FormData): Promise<IUser> => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};

export const updateUser = async (id: string, data: FormData): Promise<IUser> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
};

export const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete user');
};