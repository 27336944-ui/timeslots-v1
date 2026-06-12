import { BusinessException, ErrorCodes } from './business-exception';


describe('BusinessException', () => {
  it('should create with code and message', () => {
    const ex = new BusinessException(40401, '未找到');
    expect(ex.businessCode).toBe(40401);
    expect(ex.message).toBe('未找到');
  });

  it('should be instance of Error', () => {
    const ex = new BusinessException(40001, '参数错误');
    expect(ex).toBeInstanceOf(Error);
  });

  it('should extend HttpException', () => {
    const ex = new BusinessException(40001, '参数错误');
    expect(ex.getStatus()).toBe(400);
  });
});


describe('ErrorCodes', () => {
  it('should define expected codes', () => {
    expect(ErrorCodes.VALIDATION_FAILED).toBe(40001);
    expect(ErrorCodes.INVALID_DATE).toBe(40002);
    expect(ErrorCodes.EVENT_NOT_FOUND).toBe(40401);
    expect(ErrorCodes.FORBIDDEN).toBe(40303);
    expect(ErrorCodes.CONCURRENT_MODIFICATION).toBe(40901);
    expect(ErrorCodes.INTERNAL_ERROR).toBe(50000);
  });

  it.each([
    ['VALIDATION_FAILED', 40001],
    ['EVENT_NOT_FOUND', 40401],
    ['FORBIDDEN', 40303],
    ['CONCURRENT_MODIFICATION', 40901],
    ['TOKEN_MISSING', 40101],
  ])('%s should be %d', (name, expected) => {
    expect(ErrorCodes[name as keyof typeof ErrorCodes]).toBe(expected);
  });
});
