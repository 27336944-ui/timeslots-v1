import { TransformInterceptor } from '../interceptors/transform.interceptor';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';


function createMockContext(path: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path }),
    }),
    getClass: () => class Fake {},
    getHandler: () => (() => undefined) as unknown as (...args: unknown[]) => unknown,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({} as ReturnType<ExecutionContext['switchToRpc']>),
    switchToWs: () => ({} as ReturnType<ExecutionContext['switchToWs']>),
    getType: () => 'http' as const,
  } as unknown as ExecutionContext;
}


describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap success response with code 0', (done) => {
    const ctx = createMockContext('/api/v1/health');
    const handler: CallHandler = { handle: () => of({ status: 'ok' }) };

    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res).toHaveProperty('code', 0);
      expect(res).toHaveProperty('message', 'success');
      expect(res.data).toEqual({ status: 'ok' });
      done();
    });
  });

  it('should preserve path from request', (done) => {
    const ctx = createMockContext('/api/v1/test');
    const handler: CallHandler = { handle: () => of({}) };

    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res).toHaveProperty('path', '/api/v1/test');
      done();
    });
  });

  it('should include timestamp', (done) => {
    const ctx = createMockContext('/api/v1/health');
    const handler: CallHandler = { handle: () => of({}) };

    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res).toHaveProperty('timestamp');
      expect(typeof res.timestamp).toBe('string');
      done();
    });
  });

  it('should handle null data', (done) => {
    const ctx = createMockContext('/api/v1/test');
    const handler: CallHandler = { handle: () => of(null) };

    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.data).toBeNull();
      expect(res.code).toBe(0);
      done();
    });
  });
});
