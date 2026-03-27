import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { env } from "../config/env";

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers["x-service-token"];

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException("Missing x-service-token");
    }

    if (token !== env.serviceToken) {
      throw new UnauthorizedException("Invalid service token");
    }

    const allowlistRaw = process.env.INTERNAL_IP_ALLOWLIST;
    if (allowlistRaw) {
      const allowlist = allowlistRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const ip = (req.socket as any)?.remoteAddress ?? req.ip;
      if (ip && allowlist.length > 0 && !allowlist.includes(ip)) {
        throw new UnauthorizedException("IP not allowed");
      }
    }

    return true;
  }
}

