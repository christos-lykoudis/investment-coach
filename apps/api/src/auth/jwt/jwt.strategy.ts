import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "../../config/env";

export type JwtAuthUser = {
  userId: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.jwtAccessSecret,
      ignoreExpiration: false
    });
  }

  async validate(payload: any): Promise<JwtAuthUser> {
    return {
      userId: payload.sub,
      email: payload.email
    };
  }
}

