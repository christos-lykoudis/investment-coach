import { IsString } from "class-validator";

export class GenerateBriefJobDto {
  @IsString()
  userId!: string;
}

