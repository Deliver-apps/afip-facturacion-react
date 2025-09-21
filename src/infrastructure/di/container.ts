// Dependency Injection Container
import { UserService, JobService } from '@src/application/services';
import { ApiUserRepository, ApiJobRepository } from '@src/infrastructure/repositories';

// Crear instancias de repositorios
const userRepository = new ApiUserRepository();
const jobRepository = new ApiJobRepository();

// Crear instancias de servicios con dependencias inyectadas
export const userService = new UserService(userRepository);
export const jobService = new JobService(jobRepository);

// Container para acceso centralizado
export const container = {
  userService,
  jobService,
} as const;
