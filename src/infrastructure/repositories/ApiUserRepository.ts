import { UserRepository } from '@src/domain/repositories';
import { User, CreateUserRequest, UpdateUserRequest } from '@src/domain/entities';
import { getUsers, getOkFromAfipSdk } from '@src/api/users';
import { updateUserFacturacion, deleteUserFacturacion } from '@src/api/usersFacturacion';

export class ApiUserRepository implements UserRepository {
  async getUsers(forceRefresh = false): Promise<User[]> {
    return getUsers(forceRefresh);
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    // Esta funcionalidad necesitaría implementarse en la API
    throw new Error('Create user not implemented in API');
  }

  async updateUser(id: number, user: UpdateUserRequest): Promise<User> {
    await updateUserFacturacion(id, user);
    // Retornar el usuario actualizado (necesitaría refetchear o la API debería retornarlo)
    const users = await this.getUsers(true);
    const updatedUser = users.find(u => u.id === id);
    if (!updatedUser) {
      throw new Error('Usuario no encontrado después de la actualización');
    }
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await deleteUserFacturacion(id);
  }

  async verifyAfipConnection(username: string): Promise<boolean> {
    const response = await getOkFromAfipSdk(username);
    return Boolean(response);
  }
}
