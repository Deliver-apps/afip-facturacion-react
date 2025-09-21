import { JobRepository } from '@src/domain/repositories';
import { Job, CreateFacturaRequest } from '@src/domain/entities';
import { 
  getFacturas, 
  createFactura, 
  retryFactura, 
  pauseBilling, 
  deleteFacturasFromUser 
} from '@src/api/facturacion';

export class ApiJobRepository implements JobRepository {
  async getJobs(forceRefresh = false): Promise<Job[]> {
    return getFacturas(forceRefresh);
  }

  async createJob(request: CreateFacturaRequest): Promise<Job> {
    const response = await createFactura(request);
    // La API actual no retorna el job creado, así que necesitaríamos refetchear
    // o modificar la API para que retorne el job creado
    return response; // Asumiendo que la API se modifica para retornar el job
  }

  async retryJob(jobId: number): Promise<void> {
    await retryFactura(jobId);
  }

  async pauseJobs(jobIds: number[]): Promise<void> {
    await pauseBilling(jobIds);
  }

  async deleteJobsByUserId(userId: number): Promise<void> {
    await deleteFacturasFromUser(userId);
  }
}
