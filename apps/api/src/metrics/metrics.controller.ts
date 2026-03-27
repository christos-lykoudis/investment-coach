import { Controller, Get } from "@nestjs/common";
import { metricsStore } from "../common/metrics/metrics.store";

@Controller("/api/v1")
export class MetricsController {
  @Get("/metrics")
  metrics() {
    return { data: metricsStore.snapshot(), error: null, meta: {} };
  }
}

