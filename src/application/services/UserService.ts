import { User, CreateUserRequest, UpdateUserRequest } from '@src/domain/entities';
import { UserRepository } from '@src/domain/repositories';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUsers(forceRefresh = false): Promise<User[]> {
    return this.userRepository.getUsers(forceRefresh);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    // Validaciones de negocio
    if (!userData.username || userData.username.trim().length === 0) {
      throw new Error('Username es requerido');
    }
    
    if (!userData.real_name || userData.real_name.trim().length === 0) {
      throw new Error('Nombre real es requerido');
    }

    if (!userData.password || userData.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    return this.userRepository.createUser(userData);
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    if (id <= 0) {
      throw new Error('ID de usuario inválido');
    }

    // Validar datos si se proporcionan
    if (userData.username !== undefined && userData.username.trim().length === 0) {
      throw new Error('Username no puede estar vacío');
    }

    if (userData.real_name !== undefined && userData.real_name.trim().length === 0) {
      throw new Error('Nombre real no puede estar vacío');
    }

    if (userData.password !== undefined && userData.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    return this.userRepository.updateUser(id, userData);
  }

  async deleteUser(id: number): Promise<void> {
    if (id <= 0) {
      throw new Error('ID de usuario inválido');
    }

    return this.userRepository.deleteUser(id);
  }

  async verifyAfipConnection(username: string): Promise<boolean> {
    if (!username || username.trim().length === 0) {
      throw new Error('Username es requerido para verificar conexión AFIP');
    }

    return this.userRepository.verifyAfipConnection(username);
  }
}
