import { IsString } from "class-validator";

export class RecomputeRiskJobDto {
  @IsString()
  brokerConnectionId!: string;
}

