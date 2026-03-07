export class RegistrationEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  seatId: string | null;
  eventId: string | null;
  createdAt: Date;
}
