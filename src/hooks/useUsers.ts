import { useState, useEffect, useCallback } from 'react';
import { User } from '@src/domain/entities';
import { container } from '@src/infrastructure/di';
import { apiCache } from '@src/services';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchUsers = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await container.userService.getUsers(forceRefresh);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(() => {
    // Forzar refresh y limpiar cache
    apiCache.clear('users');
    fetchUsers(true);
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: number, userData: Partial<User>) => {
    try {
      setLoading(true);
      await container.userService.updateUser(id, userData);
      await fetchUsers(true); // Refrescar lista después de actualizar
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await container.userService.deleteUser(id);
      await fetchUsers(true); // Refrescar lista después de eliminar
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const verifyAfipConnection = useCallback(async (username: string) => {
    try {
      return await container.userService.verifyAfipConnection(username);
    } catch (error) {
      console.error('Error verifying AFIP connection:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refreshUsers,
    updateUser,
    deleteUser,
    verifyAfipConnection,
  };
};
