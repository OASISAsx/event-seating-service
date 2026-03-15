export class RegistrationEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  email: string | null;
  seatId: string | null;
  eventId: string | null;
  createdAt: Date;
}
