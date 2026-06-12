import { HealthService } from './health.service';
import { createPrismaMock } from '../test-utils/prisma-mock';


describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    const prisma = createPrismaMock();
    service = new HealthService(prisma as unknown as any);
  });

  it('should return status ok', async () => {
    const result = await service.check();
    expect(result).toHaveProperty('status', 'ok');
  });

  it('should return db connected', async () => {
    const result = await service.check();
    expect(result).toHaveProperty('db', 'connected');
  });

  it('should include timestamp', async () => {
    const result = await service.check();
    expect(result).toHaveProperty('timestamp');
    expect(typeof result.timestamp).toBe('string');
  });
});
