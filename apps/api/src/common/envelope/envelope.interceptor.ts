import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

const isEnvelopeShape = (value: unknown): value is {
  data: unknown;
  error: unknown;
  meta: unknown;
} => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "data" in v && "error" in v && "meta" in v;
};

@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result) => {
        if (isEnvelopeShape(result)) return result;
        return { data: result, error: null, meta: {} };
      })
    );
  }
}

