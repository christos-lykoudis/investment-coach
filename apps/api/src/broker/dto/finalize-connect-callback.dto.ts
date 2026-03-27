import { IsOptional, IsString } from "class-validator";

export class FinalizeConnectCallbackDto {
  @IsString()
  sessionId!: string;

  @IsOptional()
  @IsString()
  providerToken?: string;
}

