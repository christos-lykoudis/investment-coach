import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { metricsStore } from "../metrics/metrics.store";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("http");

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
      const latencyMs = Date.now() - start;
      metricsStore.observe(res.statusCode, latencyMs);
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${latencyMs}ms`);
    });

    next();
  }
}

