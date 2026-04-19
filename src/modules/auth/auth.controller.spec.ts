import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    getAdmins: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call authService.getAdmins with current admin id', async () => {
    mockAuthService.getAdmins.mockResolvedValue([
      {
        id: 'admin-2',
        username: 'admin2',
        roomId: 'direct:admin-1:admin-2',
      },
    ]);

    const result = await controller.getAdmins('admin-1');

    expect(mockAuthService.getAdmins).toHaveBeenCalledWith('admin-1');
    expect(result).toEqual([
      {
        id: 'admin-2',
        username: 'admin2',
        roomId: 'direct:admin-1:admin-2',
      },
    ]);
  });

  it('should call authService.login with correct params', async () => {
    const body = {
      username: 'testuser',
      password: '1234',
    };

    mockAuthService.login.mockResolvedValue({
      access_token: 'mockToken',
    });

    const result = await controller.login(body);

    expect(mockAuthService.login).toHaveBeenCalledWith(
      body.username,
      body.password,
    );

    expect(result).toEqual({
      access_token: 'mockToken',
    });
  });
});
