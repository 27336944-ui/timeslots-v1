import { HttpException, HttpStatus } from '@nestjs/common';


describe('HttpException (factory)', () => {
  it('should create 400 with correct format', () => {
    const ex = new HttpException('参数错误', HttpStatus.BAD_REQUEST);
    expect(ex.getStatus()).toBe(400);
    expect(ex.message).toBe('参数错误');
  });

  it('should create 404 with correct format', () => {
    const ex = new HttpException('未找到', HttpStatus.NOT_FOUND);
    expect(ex.getStatus()).toBe(404);
  });

  it('should create 401 with correct format', () => {
    const ex = new HttpException('未授权', HttpStatus.UNAUTHORIZED);
    expect(ex.getStatus()).toBe(401);
  });

  it('should create 403 with correct format', () => {
    const ex = new HttpException('权限不足', HttpStatus.FORBIDDEN);
    expect(ex.getStatus()).toBe(403);
  });

  it('should create 500 with correct format', () => {
    const ex = new HttpException('服务器错误', HttpStatus.INTERNAL_SERVER_ERROR);
    expect(ex.getStatus()).toBe(500);
  });

  it('should preserve nested error message', () => {
    const ex = new HttpException({ message: '详情错误', error: 'bad_request' }, 400);
    expect(ex.getStatus()).toBe(400);
  });
});
