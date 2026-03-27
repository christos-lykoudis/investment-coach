import { IsIn, IsOptional } from "class-validator";

export class CreateConnectSessionDto {
  @IsOptional()
  @IsIn(["snaptrade", "fidelity", "schwab", "robinhood", "trading212"], {
    message: "Supported providers: snaptrade, fidelity, schwab, robinhood, trading212"
  })
  provider?: string;
}

