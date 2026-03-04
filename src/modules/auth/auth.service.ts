import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return admin;
  }

  async login(username: string, password: string) {
    const admin = await this.validateAdmin(username, password);

    const payload = {
      sub: admin.id,
      role: 'ADMIN',
    };

    return {
      admin,
      access_token: this.jwtService.sign(payload),
    };
  }

  async createAdmin() {
    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await this.prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    });

    return admin;
  }
}
