import { CampaignContactModel, ICampaignContact } from "../models/CampaignContact";
import { Types } from "mongoose";

export class ContactService {
  public async createContact(userId: string, data: Partial<ICampaignContact>) {
    try {
      // Validate required fields
      if (!data.firstName || !data.firstName.trim()) {
        throw new Error("firstName is required");
      }
      if (!data.lastName || !data.lastName.trim()) {
        throw new Error("lastName is required");
      }

      // Edge Case: Ensure at least one email is primary if emails exist
      if (data.emails && data.emails.length > 0) {
        const hasPrimary = data.emails.some(e => e.isPrimary);
        if (!hasPrimary) data.emails[0].isPrimary = true;
      }

      const contact = new CampaignContactModel({
        ...data,
        userId: new Types.ObjectId(userId),
      });
      return await contact.save();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create contact: ${error.message}`);
      }
      throw error;
    }
  }

  public async getContacts(userId: string, query: any) {
    const { search, page = 1, limit = 10, sort = "-updatedAt", sortBy } = query;
    
    const filter: any = { userId: new Types.ObjectId(userId), isArchived: false };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { "emails.address": { $regex: search, $options: "i" } }
      ];
    }

    // Determine sort order based on sortBy parameter
    let sortOrder: any = sort;
    if (sortBy) {
      switch (sortBy) {
        case "name":
          // Sort by full name A-Z (firstName then lastName)
          sortOrder = { firstName: 1, lastName: 1 };
          break;
        case "name-desc":
          // Sort by full name Z-A
          sortOrder = { firstName: -1, lastName: -1 };
          break;
        case "company":
          // Sort by company A-Z
          sortOrder = { company: 1 };
          break;
        case "company-desc":
          // Sort by company Z-A
          sortOrder = { company: -1 };
          break;
        case "phone":
          // Sort phone numbers based on country code (ascending)
          sortOrder = { phoneCountry: 1, phoneNumber: 1 };
          break;
        case "phone-desc":
          // Sort phone numbers based on country code (descending)
          sortOrder = { phoneCountry: -1, phoneNumber: -1 };
          break;
        case "lastUpdated":
          // Sort by last updated (newest first)
          sortOrder = { updatedAt: -1 };
          break;
        case "lastUpdated-asc":
          // Sort by last updated (oldest first)
          sortOrder = { updatedAt: 1 };
          break;
        default:
          sortOrder = sort;
      }
    }

    const contacts = await CampaignContactModel.find(filter)
      .sort(sortOrder)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await CampaignContactModel.countDocuments(filter);

    return {
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalContacts: count
    };
  }

  public async updateContact(userId: string, contactId: string, updates: Partial<ICampaignContact>) {
    // Security: Ensure the contact belongs to the user
    const contact = await CampaignContactModel.findOneAndUpdate(
      { _id: contactId, userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true }
    );
    return contact;
  }

  public async bulkDelete(userId: string, contactIds: string[]) {
    return await CampaignContactModel.deleteMany({
      _id: { $in: contactIds },
      userId: new Types.ObjectId(userId)
    });
  }

  /**
   * Import contacts from CSV file
   * Handles flexible column matching (firstName, first, first_name, etc.)
   */
  public async importFromCSV(userId: string, csvData: string) {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row");
      }

      // Parse header row (case-insensitive, trim spaces)
      const headerLine = lines[0];
      const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

      // Find column indices with flexible matching
      const findColumnIndex = (patterns: string[]): number | -1 => {
        return headers.findIndex(header => 
          patterns.some(pattern => header.includes(pattern.toLowerCase()))
        );
      };

      const firstNameIdx = findColumnIndex(['first', 'firstname', 'first_name', 'fname']);
      const lastNameIdx = findColumnIndex(['last', 'lastname', 'last_name', 'lname']);
      const emailIdx = findColumnIndex(['email', 'email_address', 'e-mail', 'mail']);
      const phoneIdx = findColumnIndex(['phone', 'phone_number', 'phone number', 'mobile', 'cell']);
      const companyIdx = findColumnIndex(['company', 'organization', 'company_name', 'org']);
      const jobTitleIdx = findColumnIndex(['job', 'title', 'job_title', 'position', 'role']);
      const locationIdx = findColumnIndex(['location', 'city', 'address', 'country']);
      const tagsIdx = findColumnIndex(['tags', 'tag', 'labels', 'label']);
      const notesIdx = findColumnIndex(['notes', 'note', 'comment', 'comments', 'remarks']);

      if (firstNameIdx === -1 && lastNameIdx === -1 && emailIdx === -1) {
        throw new Error("CSV must contain at least firstName/lastName or email column");
      }

      const contacts: Partial<ICampaignContact>[] = [];
      const errors: { row: number; error: string }[] = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        try {
          const values = this.parseCSVLine(line);

          const firstName = firstNameIdx !== -1 ? values[firstNameIdx]?.trim() : '';
          const lastName = lastNameIdx !== -1 ? values[lastNameIdx]?.trim() : '';
          const email = emailIdx !== -1 ? values[emailIdx]?.trim() : '';
          const phone = phoneIdx !== -1 ? values[phoneIdx]?.trim() : '';
          const company = companyIdx !== -1 ? values[companyIdx]?.trim() : '';
          const jobTitle = jobTitleIdx !== -1 ? values[jobTitleIdx]?.trim() : '';
          const location = locationIdx !== -1 ? values[locationIdx]?.trim() : '';
          const tagsStr = tagsIdx !== -1 ? values[tagsIdx]?.trim() : '';
          const notes = notesIdx !== -1 ? values[notesIdx]?.trim() : '';

          // Validation: At least firstName or lastName
          if (!firstName && !lastName) {
            errors.push({ row: i + 1, error: "First name or last name is required" });
            continue;
          }

          const contact: Partial<ICampaignContact> = {
            firstName: firstName || "Unknown",
            lastName: lastName || "Contact",
            notes: notes || undefined,
            emails: email ? [{ address: email.toLowerCase(), isPrimary: true }] : [],
            phones: phone ? [{ number: phone, isPrimary: true }] : [],
            tags: tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(t => t) : [],
          };

          if (company) contact.company = company;
          if (jobTitle) contact.jobTitle = jobTitle;
          if (location) contact.location = location;

          contacts.push(contact);
        } catch (error) {
          errors.push({ 
            row: i + 1, 
            error: error instanceof Error ? error.message : "Failed to parse row" 
          });
        }
      }

      if (contacts.length === 0) {
        throw new Error(`No valid contacts found. Errors: ${errors.map(e => `Row ${e.row}: ${e.error}`).join('; ')}`);
      }

      // Bulk insert
      const insertedContacts = await CampaignContactModel.insertMany(
        contacts.map(contact => ({ ...contact, userId: new Types.ObjectId(userId) }))
      );

      return {
        success: true,
        imported: insertedContacts.length,
        skipped: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        contacts: insertedContacts
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`CSV import failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse a CSV line handling quoted values and commas within quotes
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
