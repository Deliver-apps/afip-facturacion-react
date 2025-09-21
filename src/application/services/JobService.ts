import { Job, CreateFacturaRequest } from '@src/domain/entities';
import { JobRepository } from '@src/domain/repositories';

export class JobService {
  constructor(private jobRepository: JobRepository) {}

  async getJobs(forceRefresh = false): Promise<Job[]> {
    return this.jobRepository.getJobs(forceRefresh);
  }

  async createFactura(request: CreateFacturaRequest): Promise<Job> {
    // Validaciones de negocio
    if (!request.userId || request.userId <= 0) {
      throw new Error('ID de usuario inválido');
    }

    if (!request.minBill || request.minBill <= 0) {
      throw new Error('Monto mínimo debe ser mayor a 0');
    }

    if (!request.maxBill || request.maxBill <= 0) {
      throw new Error('Monto máximo debe ser mayor a 0');
    }

    if (request.minBill > request.maxBill) {
      throw new Error('Monto mínimo no puede ser mayor al monto máximo');
    }

    if (!request.billNumber || request.billNumber <= 0) {
      throw new Error('Número de facturas debe ser mayor a 0');
    }

    if (!request.startDate) {
      throw new Error('Fecha de inicio es requerida');
    }

    if (!request.endDate) {
      throw new Error('Fecha de fin es requerida');
    }

    // Validar fechas
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    
    if (startDate >= endDate) {
      throw new Error('Fecha de inicio debe ser anterior a la fecha de fin');
    }

    return this.jobRepository.createJob(request);
  }

  async retryJob(jobId: number): Promise<void> {
    if (!jobId || jobId <= 0) {
      throw new Error('ID de job inválido');
    }

    return this.jobRepository.retryJob(jobId);
  }

  async pauseJobs(jobIds: number[]): Promise<void> {
    if (!jobIds || jobIds.length === 0) {
      throw new Error('Debe proporcionar al menos un ID de job');
    }

    const invalidIds = jobIds.filter(id => !id || id <= 0);
    if (invalidIds.length > 0) {
      throw new Error('Todos los IDs de jobs deben ser válidos');
    }

    return this.jobRepository.pauseJobs(jobIds);
  }

  async deleteJobsByUserId(userId: number): Promise<void> {
    if (!userId || userId <= 0) {
      throw new Error('ID de usuario inválido');
    }

    return this.jobRepository.deleteJobsByUserId(userId);
  }
}
