import { parse } from 'csv-parse/sync';

export function parseEmailsFromCsv(buffer: Buffer): { email: string, fullName?: string }[] {
  const records = parse(buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // Dynamically detect the email column
  const emailColumn = Object.keys(records[0] || {}).find(key =>
    /email/i.test(key)
  );

  if (!emailColumn) {
    throw new Error('No email column found in the CSV file.');
  }

  // Optionally detect a full name column
  const fullNameColumn = Object.keys(records[0] || {}).find(key =>
    /full\s?name/i.test(key)
  );

  return records
    .map((row: any) => ({
      email: row[emailColumn]?.trim(),
      fullName: fullNameColumn ? row[fullNameColumn]?.trim() : undefined
    }))
    .filter((entry: any) => entry.email); // Only include rows with valid emails
}
