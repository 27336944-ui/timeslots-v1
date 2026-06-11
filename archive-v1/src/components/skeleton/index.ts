interface SkeletonData {
  type: string;
  count: number;
  lines: number[];
}

interface SkeletonMethods {
  [key: string]: (...args: unknown[]) => unknown;
}

Component<SkeletonData, Record<string, any>, SkeletonMethods, never[]>({
  options: { styleIsolation: 'isolated' },
  properties: {
    type: { type: String, value: 'line' },
    count: { type: Number, value: 3 },
  },
  data: {
    type: 'line',
    count: 3,
    lines: [0, 1, 2],
  },
  observers: {
    count(c: number) {
      const arr: number[] = [];
      for (let i = 0; i < c; i++) {
        arr.push(i);
      }
      this.setData({ lines: arr });
    },
  },
});
