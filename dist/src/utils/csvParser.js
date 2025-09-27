"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEmailsFromCsv = parseEmailsFromCsv;
const sync_1 = require("csv-parse/sync");
function parseEmailsFromCsv(buffer) {
    const records = (0, sync_1.parse)(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
    // Accept columns: email, fullName (case-insensitive)
    return records.map((row) => ({
        email: row.email || row.Email || row["E-mail"],
        fullName: row.fullName || row.FullName || row["Full Name"]
    })).filter((entry) => entry.email);
}
