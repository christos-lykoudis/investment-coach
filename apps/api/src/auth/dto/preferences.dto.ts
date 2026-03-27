import { IsIn, IsString } from "class-validator";

const timeHorizonValues = ["1_3_years", "3_5_years", "5_10_years", "10_plus_years"] as const;
const riskToleranceValues = ["conservative", "moderate", "aggressive"] as const;
const volatilityComfortValues = ["low", "medium", "high"] as const;
const goalTypeValues = ["wealth_growth", "income", "preservation"] as const;
const experienceLevelValues = ["beginner", "intermediate", "advanced"] as const;

export class UpdatePreferencesDto {
  @IsIn(timeHorizonValues)
  timeHorizon!: string;

  @IsIn(riskToleranceValues)
  riskTolerance!: string;

  @IsIn(volatilityComfortValues)
  volatilityComfort!: string;

  @IsIn(goalTypeValues)
  goalType!: string;

  @IsIn(experienceLevelValues)
  experienceLevel!: string;
}

