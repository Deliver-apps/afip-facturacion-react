import { useState, useEffect, useCallback } from 'react';
import { Job, CreateFacturaRequest } from '@src/domain/entities';
import { container } from '@src/infrastructure/di';
import { apiCache } from '@src/services';

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchJobs = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await container.jobService.getJobs(forceRefresh);
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(() => {
    // Forzar refresh y limpiar cache
    apiCache.clear('facturas');
    fetchJobs(true);
  }, [fetchJobs]);

  const createFactura = useCallback(async (request: CreateFacturaRequest) => {
    try {
      setLoading(true);
      await container.jobService.createFactura(request);
      await fetchJobs(true); // Refrescar lista después de crear
      return true;
    } catch (error) {
      console.error('Error creating factura:', error);
      setError(error instanceof Error ? error.message : 'Error al crear factura');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  const retryJob = useCallback(async (jobId: number) => {
    try {
      setLoading(true);
      await container.jobService.retryJob(jobId);
      await fetchJobs(true); // Refrescar lista después de reintentar
      return true;
    } catch (error) {
      console.error('Error retrying job:', error);
      setError(error instanceof Error ? error.message : 'Error al reintentar job');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  const pauseJobs = useCallback(async (jobIds: number[]) => {
    try {
      setLoading(true);
      await container.jobService.pauseJobs(jobIds);
      await fetchJobs(true); // Refrescar lista después de pausar
      return true;
    } catch (error) {
      console.error('Error pausing jobs:', error);
      setError(error instanceof Error ? error.message : 'Error al pausar jobs');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  const deleteJobsByUserId = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      await container.jobService.deleteJobsByUserId(userId);
      await fetchJobs(true); // Refrescar lista después de eliminar
      return true;
    } catch (error) {
      console.error('Error deleting jobs:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar jobs');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refreshJobs,
    createFactura,
    retryJob,
    pauseJobs,
    deleteJobsByUserId,
  };
};
