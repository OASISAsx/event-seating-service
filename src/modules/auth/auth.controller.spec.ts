import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
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
