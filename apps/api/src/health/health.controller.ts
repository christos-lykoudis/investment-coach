import { Controller, Get } from "@nestjs/common";

@Controller("/api/v1")
export class HealthController {
  @Get("/health")
  health() {
    return { data: { ok: true }, error: null, meta: {} };
  }
}

