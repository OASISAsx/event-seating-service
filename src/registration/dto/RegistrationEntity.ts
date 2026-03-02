export class RegistrationEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  seatId: string | null;
  eventId: string | null;
  createdAt: Date;
}
