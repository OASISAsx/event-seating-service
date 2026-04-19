import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  let mockEventService: {
    create: jest.Mock;
  };
  beforeEach(async () => {
    mockEventService = {
      create: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', async () => {
    const body = {
      payload: {
        name: 'test Event',
        description: 'test description',
        location: '0999999999',
        imageEvent: 'https://example.com/image.jpg',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-02'),
        seatsPerRow: 20,
        totalSeats: 100,
      },
    };

    const mockResponse = { message: 'success' };
    mockEventService.create.mockResolvedValue(mockResponse);

    const result = await controller.create(body);

    expect(mockEventService.create).toHaveBeenCalledWith(body.payload);

    expect(result).toEqual(mockResponse);
  });
});
