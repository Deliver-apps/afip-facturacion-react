import { User, CreateUserRequest, UpdateUserRequest } from '../entities';

export interface UserRepository {
  getUsers(forceRefresh?: boolean): Promise<User[]>;
  createUser(user: CreateUserRequest): Promise<User>;
  updateUser(id: number, user: UpdateUserRequest): Promise<User>;
  deleteUser(id: number): Promise<void>;
  verifyAfipConnection(username: string): Promise<boolean>;
}
