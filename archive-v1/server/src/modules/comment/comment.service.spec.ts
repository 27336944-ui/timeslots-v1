import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const userId = '11111111-1111-1111-1111-111111111111';
const otherId = '22222222-2222-2222-2222-222222222222';

describe('CommentService', () => {
  let service: CommentService;
  const client = {
    timeBlock: { findFirst: jest.fn() },
    comment: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    circleMember: { findFirst: jest.fn() },
  };
  const prismaServiceMock = { client };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();
    service = module.get<CommentService>(CommentService);
  });

  describe('create', () => {
    const dto: CreateCommentDto = { content: 'test comment' };

    it('block 不存在抛 40401', async () => {
      client.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.create(userId, 'b1', dto)).rejects.toMatchObject({ businessCode: 40401 });
    });

    it('无权访问 block 抛 40301', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId: otherId, circleId: null, nature: 'PRIVATE' });
      await expect(service.create(userId, 'b1', dto)).rejects.toMatchObject({ businessCode: 40301 });
    });

    it('parent 不存在抛 40401', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId, circleId: null, nature: 'PUBLIC' });
      client.comment.findFirst.mockResolvedValue(null);
      await expect(service.create(userId, 'b1', { ...dto, parentId: 'p1' })).rejects.toMatchObject({ businessCode: 40401 });
    });

    it('创建评论应写入 content', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId, circleId: null, nature: 'PUBLIC' });
      client.comment.create.mockResolvedValue({ id: 'c1', blockId: 'b1', authorId: userId, content: 'test comment', parentId: null, createdAt: new Date() });
      const result = await service.create(userId, 'b1', dto);
      expect(result.content).toBe('test comment');
      expect(result.blockId).toBe('b1');
      const call = client.comment.create.mock.calls[0][0];
      expect(call.data.content).toBe('test comment');
    });
  });

  describe('findByBlock', () => {
    it('block 不存在抛 40401', async () => {
      client.timeBlock.findFirst.mockResolvedValue(null);
      await expect(service.findByBlock(userId, 'b1')).rejects.toMatchObject({ businessCode: 40401 });
    });

    it('无权查看抛 40301', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId: otherId, circleId: null, nature: 'PRIVATE' });
      await expect(service.findByBlock(userId, 'b1')).rejects.toMatchObject({ businessCode: 40301 });
    });

    it('公开 block 允许任何人查看评论', async () => {
      client.timeBlock.findFirst.mockResolvedValue({ id: 'b1', userId: otherId, circleId: null, nature: 'PUBLIC' });
      client.comment.findMany.mockResolvedValue([]);
      const result = await service.findByBlock(userId, 'b1');
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const dto: UpdateCommentDto = { content: 'updated' };

    it('评论不存在抛 40401', async () => {
      client.comment.findFirst.mockResolvedValue(null);
      await expect(service.update(userId, 'c1', dto)).rejects.toMatchObject({ businessCode: 40401 });
    });

    it('无权修改他人评论抛 40301', async () => {
      client.comment.findFirst.mockResolvedValue({ id: 'c1', authorId: otherId });
      await expect(service.update(userId, 'c1', dto)).rejects.toMatchObject({ businessCode: 40301 });
    });

    it('author 可更新自己评论', async () => {
      client.comment.findFirst.mockResolvedValue({ id: 'c1', authorId: userId });
      client.comment.update.mockResolvedValue({ id: 'c1', blockId: 'b1', authorId: userId, content: 'updated', parentId: null, createdAt: new Date() });
      const result = await service.update(userId, 'c1', dto);
      expect(result.content).toBe('updated');
    });
  });

  describe('remove', () => {
    it('评论不存在抛 40401', async () => {
      client.comment.findFirst.mockResolvedValue(null);
      await expect(service.remove(userId, 'c1')).rejects.toMatchObject({ businessCode: 40401 });
    });

    it('无权删除他人评论抛 40301', async () => {
      client.comment.findFirst.mockResolvedValue({ id: 'c1', authorId: otherId });
      await expect(service.remove(userId, 'c1')).rejects.toMatchObject({ businessCode: 40301 });
    });
  });
});
