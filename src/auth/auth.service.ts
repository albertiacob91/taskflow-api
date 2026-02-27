import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { email: string; password: string; name?: string }) {
    const user = await this.users.createUser(input);
    const accessToken = await this.signAccessToken(user.id);
    return { user, accessToken };
  }

  async login(input: { email: string; password: string }) {
    const userRecord = await this.users.findByEmail(input.email);
    if (!userRecord) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(input.password, userRecord.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const user = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
    };

    const accessToken = await this.signAccessToken(user.id);
    return { user, accessToken };
  }

  private signAccessToken(userId: string) {
    return this.jwt.signAsync({ sub: userId });
  }
}