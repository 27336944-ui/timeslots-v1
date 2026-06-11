import { request } from '../src/utils/request';
import type { TimeBlockVO, TimeBlockListResponse } from '../src/types/api';

interface CreateTimeBlockInput {
  title: string;
  startAt: string;
  endAt: string;
  color: string;
  categoryId: string | null;
  notes: string;
}

interface UpdateTimeBlockInput extends Partial<CreateTimeBlockInput> {
  id: string;
}

export async function fetchTodayBlocks(): Promise<TimeBlockVO[]> {
  const today = new Date().toISOString().slice(0, 10);
  const response = await request<TimeBlockListResponse>({
    url: '/api/v1/time-blocks',
    method: 'GET',
    data: { date: today },
  });
  return response.items;
}

export async function fetchBlockById(id: string): Promise<TimeBlockVO> {
  return request<TimeBlockVO>({
    url: `/api/v1/time-blocks/${id}`,
    method: 'GET',
  });
}

export async function createBlock(input: CreateTimeBlockInput): Promise<TimeBlockVO> {
  return request<TimeBlockVO>({
    url: '/api/v1/time-blocks',
    method: 'POST',
    data: input,
  });
}

export async function updateBlock(input: UpdateTimeBlockInput): Promise<TimeBlockVO> {
  return request<TimeBlockVO>({
    url: `/api/v1/time-blocks/${input.id}`,
    method: 'PATCH',
    data: input,
  });
}

export async function deleteBlock(id: string): Promise<void> {
  await request<null>({
    url: `/api/v1/time-blocks/${id}`,
    method: 'DELETE',
  });
}
