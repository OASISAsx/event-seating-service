import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';

describe('RegistrationController', () => {
  let controller: RegistrationController;
  let mockRegistrationService: {
    create: jest.Mock;
  };

  beforeEach(async () => {
    mockRegistrationService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [
        {
          provide: RegistrationService,
          useValue: mockRegistrationService,
        },
      ],
    }).compile();

    controller = module.get<RegistrationController>(RegistrationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call registrationService.create with correct params', async () => {
    const body = {
      payload: {
        firstName: 'Nanthawat',
        lastName: 'Intisaen',
        phone: '0999999999',
        email: 'wave001133@gmail.com',
        eventId: '1',
      },
    };

    const mockResponse = { message: 'success' };

    mockRegistrationService.create.mockResolvedValue(mockResponse);

    const result = await controller.create(body);

    expect(mockRegistrationService.create).toHaveBeenCalledWith(body.payload);
    expect(result).toEqual(mockResponse);
  });
});
