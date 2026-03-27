import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const payload: unknown = exception.getResponse();
    const payloadMessage =
      typeof payload === "object" && payload && "message" in payload
        ? (payload as { message?: unknown }).message
        : null;
    const message =
      typeof payload === "string"
        ? payload
        : Array.isArray(payloadMessage)
          ? payloadMessage.map(String).join(", ")
          : typeof payloadMessage === "string"
            ? payloadMessage
            : "Request failed";

    // Keep shape consistent: error always present, data empty object.
    res.status(status).json({
      data: {},
      error: {
        code: "http_exception",
        message,
        details: payload
      },
      meta: {}
    });
  }
}

