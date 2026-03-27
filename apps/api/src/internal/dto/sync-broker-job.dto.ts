import { IsString } from "class-validator";

export class SyncBrokerJobDto {
  @IsString()
  brokerConnectionId!: string;
}

