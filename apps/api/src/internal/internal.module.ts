import { Module } from "@nestjs/common";
import { InternalJobsController } from "./internal-jobs.controller";
import { ServiceTokenGuard } from "./service-token.guard";

@Module({
  controllers: [InternalJobsController],
  providers: [ServiceTokenGuard]
})
export class InternalModule {}

