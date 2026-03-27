import { IsIn, IsOptional, IsString } from "class-validator";

export class RecommendationFeedbackDto {
  @IsIn(["helpful", "dismissed", "not_relevant"])
  feedbackType!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

