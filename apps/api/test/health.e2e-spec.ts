import request from "supertest";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { HttpExceptionEnvelopeFilter } from "../src/common/envelope/http-exception.filter";
import { EnvelopeInterceptor } from "../src/common/envelope/envelope.interceptor";
import { ValidationPipe } from "@nestjs/common";

describe("API smoke tests", () => {
  it("GET /api/v1/health returns envelope", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: { ok: true },
      error: null,
      meta: {}
    });

    await app.close();
  });

  it("GET unknown route returns envelope error", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    app.useGlobalInterceptors(new EnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionEnvelopeFilter());
    await app.init();

    const res = await request(app.getHttpServer()).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("meta");

    await app.close();
  });
});

