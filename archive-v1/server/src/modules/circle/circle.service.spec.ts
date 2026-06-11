import { Test, TestingModule } from '@nestjs/testing';
import { CircleService } from './circle.service';
import { PrismaService } from '../../prisma/prisma.service';

const userId = '11111111-1111-1111-1111-111111111111';
const otherId = '22222222-2222-2222-2222-222222222222';

const mockCircle = {
  id: 'c1',
  ownerId: userId,
  name: '技术圈',
  description: null,
  inviteCode: 'abc12345',
  status: 'ACTIVE',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('CircleService', () => {
  let service: CircleService;

  const client = {
    circle: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    circleMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };
  const prismaMock = {
    client,
    $transaction: jest.fn((fn: (tx: any) => any) => fn(client)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<CircleService>(CircleService);
  });

  describe('create', () => {
    it('应创建圈子 + 成员 + 自动生成 inviteCode', async () => {
      client.circle.create.mockResolvedValue(mockCircle);
      client.circleMember.create.mockResolvedValue({});
      client.circleMember.count.mockResolvedValue(1);
      const result = await service.create(userId, { name: '技术圈' });
      expect(result.name).toBe('技术圈');
      expect(result.memberCount).toBe(1);
      expect(result.role).toBe('OWNER');
      // inviteCode 应非空且 8 位
      expect(result.inviteCode).toBeDefined();
      expect(result.inviteCode.length).toBe(8);
    });
  });

  describe('findMyCircles', () => {
    it('应返回用户加入的圈子列表', async () => {
      client.circleMember.findMany.mockResolvedValue([
        { circleId: 'c1', userId, role: 'OWNER', circle: mockCircle },
      ]);
      client.circleMember.count.mockResolvedValue(3);
      const list = await service.findMyCircles(userId);
      expect(list).toHaveLength(1);
      expect(list[0].memberCount).toBe(3);
    });
  });

  describe('findOne', () => {
    it('成员可查看详情', async () => {
      client.circleMember.findFirst.mockResolvedValue({
        circleId: 'c1', userId, role: 'OWNER', circle: mockCircle,
      });
      client.circleMember.count.mockResolvedValue(3);
      const view = await service.findOne(userId, 'c1');
      expect(view.id).toBe('c1');
      expect(view.memberCount).toBe(3);
    });

    it('非成员抛 40401', async () => {
      client.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.findOne(userId, 'c1')).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('update', () => {
    it('OWNER 可更新', async () => {
      client.circleMember.findFirst.mockResolvedValue({
        circleId: 'c1', userId, role: 'OWNER',
      });
      client.circle.update.mockResolvedValue(mockCircle);
      client.circleMember.count.mockResolvedValue(3);
      const view = await service.update(userId, 'c1', { name: '新名' });
      expect(service['toView']).toBeDefined();
      expect(client.circle.update).toHaveBeenCalled();
    });

    it('非 OWNER 抛 40301', async () => {
      client.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.update(userId, 'c1', { name: 'x' })).rejects.toMatchObject({ businessCode: 40301 });
    });
  });

  describe('getInviteCode', () => {
    it('OWNER/ADMIN 可查看', async () => {
      client.circleMember.findFirst.mockResolvedValue({
        circleId: 'c1', userId, role: 'OWNER', circle: mockCircle,
      });
      const code = await service.getInviteCode(userId, 'c1');
      expect(code).toBe('abc12345');
    });

    it('普通成员抛 40301', async () => {
      client.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.getInviteCode(userId, 'c1')).rejects.toMatchObject({ businessCode: 40301 });
    });
  });

  describe('joinByCode', () => {
    it('有效邀请码可加入', async () => {
      client.circle.findUnique.mockResolvedValue(mockCircle);
      client.circleMember.findFirst.mockResolvedValue(null);
      client.circleMember.create.mockResolvedValue({});
      client.circleMember.count.mockResolvedValue(2);
      const view = await service.joinByCode(otherId, 'abc12345');
      expect(view.memberCount).toBe(2);
      expect(view.role).toBe('MEMBER');
    });

    it('已加入者抛 40901', async () => {
      client.circle.findUnique.mockResolvedValue(mockCircle);
      client.circleMember.findFirst.mockResolvedValue({ id: 'cm1', circleId: 'c1', userId });
      await expect(service.joinByCode(userId, 'abc12345')).rejects.toMatchObject({ businessCode: 40901 });
    });

    it('无效邀请码抛 40401', async () => {
      client.circle.findUnique.mockResolvedValue(null);
      await expect(service.joinByCode(userId, 'bad')).rejects.toMatchObject({ businessCode: 40401 });
    });
  });

  describe('remove', () => {
    it('OWNER 可软删除', async () => {
      client.circleMember.findFirst.mockResolvedValue({
        circleId: 'c1', userId, role: 'OWNER',
      });
      client.circle.update.mockResolvedValue({});
      await service.remove(userId, 'c1');
      const call = client.circle.update.mock.calls[0][0];
      expect(call.data.isDeleted).toBe(true);
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });

    it('非 OWNER 抛 40301', async () => {
      client.circleMember.findFirst.mockResolvedValue(null);
      await expect(service.remove(userId, 'c1')).rejects.toMatchObject({ businessCode: 40301 });
    });
  });

  describe('removeMember', () => {
    it('ADMIN 可踢人', async () => {
      client.circleMember.findFirst
        .mockResolvedValueOnce({ circleId: 'c1', userId, role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 'cm2', circleId: 'c1', userId: otherId, role: 'MEMBER' });
      client.circleMember.update.mockResolvedValue({});
      await service.removeMember(userId, 'c1', 'cm2');
      expect(client.circleMember.update).toHaveBeenCalled();
    });

    it('踢 OWNER 抛 40301', async () => {
      client.circleMember.findFirst
        .mockResolvedValueOnce({ circleId: 'c1', userId, role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'cm2', circleId: 'c1', userId: otherId, role: 'OWNER' });
      await expect(service.removeMember(userId, 'c1', 'cm2')).rejects.toMatchObject({ businessCode: 40301 });
    });
  });
});
