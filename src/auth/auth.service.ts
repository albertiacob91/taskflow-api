import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
};

type RefreshPayload = {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    createdAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private signAccessToken(userId: string): Promise<string> {
    const options: JwtSignOptions = {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
    };
    return this.jwt.signAsync({ sub: userId }, options);
  }

  private signRefreshToken(userId: string, jti: string): Promise<string> {
    const options: JwtSignOptions = {
      secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    };
    return this.jwt.signAsync({ sub: userId, jti }, options);
  }

  async register(input: { email: string; password: string; name?: string }) {
    const userRecord = await this.users.createUser(input);
    const accessToken = await this.signAccessToken(userRecord.id);

    const jti = randomUUID();
    const refreshToken = await this.signRefreshToken(userRecord.id, jti);

    await this.prisma.user.update({
      where: { id: userRecord.id },
      data: { refreshTokenJti: jti },
    });

    return {
      user: this.toPublicUser(userRecord),
      accessToken,
      refreshToken,
    };
  }

  async login(input: { email: string; password: string }) {
    const userRecord = await this.users.findByEmail(input.email);
    if (!userRecord) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(input.password, userRecord.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.signAccessToken(userRecord.id);

    const jti = randomUUID();
    const refreshToken = await this.signRefreshToken(userRecord.id, jti);

    await this.prisma.user.update({
      where: { id: userRecord.id },
      data: { refreshTokenJti: jti },
    });

    return {
      user: this.toPublicUser(userRecord),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
      } as any);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.sub || !payload?.jti)
      throw new UnauthorizedException('Invalid refresh token');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt)
      throw new UnauthorizedException('Invalid refresh token');

    if (!user.refreshTokenJti)
      throw new UnauthorizedException('Refresh token revoked');

    if (user.refreshTokenJti !== payload.jti)
      throw new UnauthorizedException('Refresh token revoked');

    const accessToken = await this.signAccessToken(user.id);

    const newJti = randomUUID();
    const newRefreshToken = await this.signRefreshToken(user.id, newJti);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenJti: newJti },
    });

    return {
      user: this.toPublicUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
      } as any);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { refreshTokenJti: null },
    });

    return { ok: true };
  }
}