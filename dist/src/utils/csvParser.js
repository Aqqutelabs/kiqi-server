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
    // Dynamically detect the email column
    const emailColumn = Object.keys(records[0] || {}).find(key => /email/i.test(key));
    if (!emailColumn) {
        throw new Error('No email column found in the CSV file.');
    }
    // Optionally detect a full name column
    const fullNameColumn = Object.keys(records[0] || {}).find(key => /full\s?name/i.test(key));
    return records
        .map((row) => {
        var _a, _b;
        return ({
            email: (_a = row[emailColumn]) === null || _a === void 0 ? void 0 : _a.trim(),
            fullName: fullNameColumn ? (_b = row[fullNameColumn]) === null || _b === void 0 ? void 0 : _b.trim() : undefined
        });
    })
        .filter((entry) => entry.email); // Only include rows with valid emails
}
