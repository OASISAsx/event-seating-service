import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminListItem } from './dto/admin.dto/admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('admins')
  getAdmins(
    @Query('currentAdminId') currentAdminId?: string,
  ): Promise<AdminListItem[]> {
    return this.authService.getAdmins(currentAdminId);
  }

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }
  @Post('registerAdmin')
  register() {
    return this.authService.createAdmin();
  }
}
