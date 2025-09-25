import { parse } from 'csv-parse/sync';

export function parseEmailsFromCsv(buffer: Buffer): { email: string, fullName?: string }[] {
  const records = parse(buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  // Accept columns: email, fullName (case-insensitive)
  return records.map((row: any) => ({
    email: row.email || row.Email || row["E-mail"],
    fullName: row.fullName || row.FullName || row["Full Name"]
  })).filter((entry: any) => entry.email);
}
