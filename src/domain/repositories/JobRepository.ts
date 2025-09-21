import { Job, CreateFacturaRequest } from '../entities';

export interface JobRepository {
  getJobs(forceRefresh?: boolean): Promise<Job[]>;
  createJob(request: CreateFacturaRequest): Promise<Job>;
  retryJob(jobId: number): Promise<void>;
  pauseJobs(jobIds: number[]): Promise<void>;
  deleteJobsByUserId(userId: number): Promise<void>;
}
