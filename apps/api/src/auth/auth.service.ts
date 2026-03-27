import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { env } from "../config/env";

const sha256Hex = (value: string): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    return this.issueTokens(user.id, user.email);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true }
    });
    if (!user) throw new UnauthorizedException("User not found");

    return {
      id: user.id,
      email: user.email,
      onboardingCompleted: Boolean(user.onboardingCompletedAt),
      preferences: user.preferences
        ? {
            timeHorizon: user.preferences.timeHorizon,
            riskTolerance: user.preferences.riskTolerance,
            volatilityComfort: user.preferences.volatilityComfort,
            goalType: user.preferences.goalType,
            experienceLevel: user.preferences.experienceLevel
          }
        : null
    };
  }

  async updatePreferences(
    userId: string,
    prefs: {
      timeHorizon: string;
      riskTolerance: string;
      volatilityComfort: string;
      goalType: string;
      experienceLevel: string;
    }
  ) {
    const updated = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        timeHorizon: prefs.timeHorizon,
        riskTolerance: prefs.riskTolerance,
        volatilityComfort: prefs.volatilityComfort,
        goalType: prefs.goalType,
        experienceLevel: prefs.experienceLevel
      },
      create: {
        userId,
        ...prefs
      }
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompletedAt: new Date()
      }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      timeHorizon: updated.timeHorizon,
      riskTolerance: updated.riskTolerance,
      volatilityComfort: updated.volatilityComfort,
      goalType: updated.goalType,
      experienceLevel: updated.experienceLevel
    };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ sub: userId, email }, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessTtlSeconds
    });

    const refreshToken = jwt.sign({ sub: userId, email }, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshTtlSeconds
    });

    const tokenHash = sha256Hex(refreshToken);
    const expiresAt = new Date(Date.now() + env.jwtRefreshTtlSeconds * 1000);

    await this.prisma.userRefreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }
}

