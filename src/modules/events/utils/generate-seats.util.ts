export function generateSeats(
  totalSeats: number,
  seatsPerRow: number,
): string[] {
  const seats: string[] = [];
  const rows = Math.ceil(totalSeats / seatsPerRow);

  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);

    for (let s = 1; s <= seatsPerRow; s++) {
      const index = r * seatsPerRow + s;
      if (index > totalSeats) break;

      seats.push(`${rowLetter}${s}`);
    }
  }

  return seats;
}
