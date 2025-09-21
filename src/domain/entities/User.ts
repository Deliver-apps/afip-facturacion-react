export interface User {
  id: number;
  real_name: string;
  username: string;
  password: string;
}

export interface CreateUserRequest {
  real_name: string;
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  real_name?: string;
  username?: string;
  password?: string;
}
