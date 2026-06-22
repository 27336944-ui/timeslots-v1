

export class MemberSlotsDto {
  userId!: string;
  nickname!: string;
  role!: string;
  busySlots: { start: string; end: string }[] = [];
}
