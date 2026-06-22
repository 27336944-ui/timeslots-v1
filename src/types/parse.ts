export interface ParseResult {
  type: 'schedule' | 'task';
  title: string;
  startTime: string | null;
  endTime: string | null;
  recurrence: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
  category: 'work' | 'life' | 'private';
  confidence: number;
  ambiguous: boolean;
  ambiguities: string[];
}
