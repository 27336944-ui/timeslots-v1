export class DecomposeStepItem {
  text!: string;
  estimatedMinutes!: number;
  dependsOnIndex!: number;
}


export class DecomposeResponseDto {
  steps!: DecomposeStepItem[];
  totalMinutes!: number;
  rationale!: string;
}
