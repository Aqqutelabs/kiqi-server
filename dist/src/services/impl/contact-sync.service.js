"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactSyncService = void 0;
const mongoose_1 = require("mongoose");
const EmailList_1 = require("../../models/EmailList");
const RecipientGroup_1 = require("../../models/RecipientGroup");
const CampaignList_1 = require("../../models/CampaignList");
const GENERAL_EMAIL_LIST_NAME = "General";
const GENERAL_SMS_GROUP_NAME = "General";
/**
 * ContactSyncService handles automatic synchronization between:
 * - CampaignContacts → Email Lists (for contacts with emails)
 * - CampaignContacts → SMS Recipient Groups (for contacts with phones)
 * - CRM Lists → Email Lists (when contacts are added to lists)
 */
class ContactSyncService {
    /**
     * Find or create the "General" email list for a user
     */
    findOrCreateGeneralEmailList(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            let generalList = yield EmailList_1.EmailListModel.findOne({
                email_listName: GENERAL_EMAIL_LIST_NAME,
                userId: userObjectId
            });
            if (!generalList) {
                generalList = yield EmailList_1.EmailListModel.create({
                    email_listName: GENERAL_EMAIL_LIST_NAME,
                    emails: [],
                    userId: userObjectId
                });
            }
            return generalList;
        });
    }
    /**
     * Find or create the "General" SMS recipient group for a user
     */
    findOrCreateGeneralSmsGroup(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            let generalGroup = yield RecipientGroup_1.RecipientGroupModel.findOne({
                name: GENERAL_SMS_GROUP_NAME,
                userId: userObjectId
            });
            if (!generalGroup) {
                generalGroup = yield RecipientGroup_1.RecipientGroupModel.create({
                    name: GENERAL_SMS_GROUP_NAME,
                    contacts: [],
                    userId: userObjectId
                });
            }
            return generalGroup;
        });
    }
    /**
     * Add a contact's email to the General email list
     * Called when a new contact is created with an email
     */
    addContactToGeneralEmailList(userId, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // Get primary email or first email
            const primaryEmail = ((_a = contact.emails) === null || _a === void 0 ? void 0 : _a.find(e => e.isPrimary)) || ((_b = contact.emails) === null || _b === void 0 ? void 0 : _b[0]);
            if (!(primaryEmail === null || primaryEmail === void 0 ? void 0 : primaryEmail.address))
                return null;
            const generalList = yield this.findOrCreateGeneralEmailList(userId);
            // Check if email already exists to avoid duplicates
            const emailExists = (_c = generalList.emails) === null || _c === void 0 ? void 0 : _c.some(e => e.email.toLowerCase() === primaryEmail.address.toLowerCase());
            if (!emailExists) {
                yield EmailList_1.EmailListModel.findByIdAndUpdate(generalList._id, {
                    $addToSet: {
                        emails: {
                            email: primaryEmail.address,
                            fullName: `${contact.firstName} ${contact.lastName}`.trim()
                        }
                    }
                });
            }
            return generalList;
        });
    }
    /**
     * Add a contact's phone to the General SMS recipient group
     * Called when a new contact is created with a phone number
     */
    addContactToGeneralSmsGroup(userId, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // Get primary phone or first phone
            const primaryPhone = ((_a = contact.phones) === null || _a === void 0 ? void 0 : _a.find(p => p.isPrimary)) || ((_b = contact.phones) === null || _b === void 0 ? void 0 : _b[0]);
            if (!(primaryPhone === null || primaryPhone === void 0 ? void 0 : primaryPhone.number))
                return null;
            const generalGroup = yield this.findOrCreateGeneralSmsGroup(userId);
            // Check if phone already exists to avoid duplicates
            const phoneExists = (_c = generalGroup.contacts) === null || _c === void 0 ? void 0 : _c.some((c) => c.phone === primaryPhone.number);
            if (!phoneExists) {
                yield RecipientGroup_1.RecipientGroupModel.findByIdAndUpdate(generalGroup._id, {
                    $addToSet: {
                        contacts: { phone: primaryPhone.number }
                    }
                });
            }
            return generalGroup;
        });
    }
    /**
     * Sync a newly created contact to appropriate general lists
     * Called after creating a campaign contact
     */
    syncNewContactToGeneralLists(userId, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = {
                addedToEmailList: false,
                addedToSmsGroup: false
            };
            // If contact has emails, add to General Email List
            if (contact.emails && contact.emails.length > 0) {
                yield this.addContactToGeneralEmailList(userId, contact);
                results.addedToEmailList = true;
            }
            // If contact has phones, add to General SMS Group
            if (contact.phones && contact.phones.length > 0) {
                yield this.addContactToGeneralSmsGroup(userId, contact);
                results.addedToSmsGroup = true;
            }
            return results;
        });
    }
    /**
     * Find or create an email list with a specific name for a user
     */
    findOrCreateEmailList(userId, listName) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            let emailList = yield EmailList_1.EmailListModel.findOne({
                email_listName: listName,
                userId: userObjectId
            });
            if (!emailList) {
                emailList = yield EmailList_1.EmailListModel.create({
                    email_listName: listName,
                    emails: [],
                    userId: userObjectId
                });
            }
            return emailList;
        });
    }
    /**
     * Sync contacts from a CRM list to a corresponding Email List
     * Called when contacts are added to a CRM list
     */
    syncCrmListToEmailList(userId, crmListId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            // Get the CRM list with populated contacts
            const crmList = yield CampaignList_1.ListModel.findOne({
                _id: new mongoose_1.Types.ObjectId(crmListId),
                userId: userObjectId
            }).populate('contacts');
            if (!crmList) {
                throw new Error("CRM List not found");
            }
            // Get contacts with emails
            const contactsWithEmails = crmList.contacts.filter(contact => contact.emails && contact.emails.length > 0);
            if (contactsWithEmails.length === 0) {
                return { synced: 0, emailListId: null };
            }
            // Find or create email list with the same name
            const emailList = yield this.findOrCreateEmailList(userId, crmList.name);
            // Prepare emails to add
            const emailsToAdd = contactsWithEmails.map(contact => {
                const primaryEmail = contact.emails.find((e) => e.isPrimary) || contact.emails[0];
                return {
                    email: primaryEmail.address,
                    fullName: `${contact.firstName} ${contact.lastName}`.trim()
                };
            });
            // Add emails to the list (using $addToSet to avoid duplicates)
            for (const emailData of emailsToAdd) {
                const emailExists = (_a = emailList.emails) === null || _a === void 0 ? void 0 : _a.some(e => e.email.toLowerCase() === emailData.email.toLowerCase());
                if (!emailExists) {
                    yield EmailList_1.EmailListModel.findByIdAndUpdate(emailList._id, { $addToSet: { emails: emailData } });
                }
            }
            return {
                synced: emailsToAdd.length,
                emailListId: emailList._id,
                emailListName: crmList.name
            };
        });
    }
    /**
     * Sync contacts from a CRM list to a corresponding SMS Recipient Group
     * Called when contacts are added to a CRM list
     */
    syncCrmListToSmsGroup(userId, crmListId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            // Get the CRM list with populated contacts
            const crmList = yield CampaignList_1.ListModel.findOne({
                _id: new mongoose_1.Types.ObjectId(crmListId),
                userId: userObjectId
            }).populate('contacts');
            if (!crmList) {
                throw new Error("CRM List not found");
            }
            // Get contacts with phones
            const contactsWithPhones = crmList.contacts.filter(contact => contact.phones && contact.phones.length > 0);
            if (contactsWithPhones.length === 0) {
                return { synced: 0, smsGroupId: null };
            }
            // Find or create SMS group with the same name
            let smsGroup = yield RecipientGroup_1.RecipientGroupModel.findOne({
                name: crmList.name,
                userId: userObjectId
            });
            if (!smsGroup) {
                smsGroup = yield RecipientGroup_1.RecipientGroupModel.create({
                    name: crmList.name,
                    contacts: [],
                    userId: userObjectId
                });
            }
            // Add phones to the group
            for (const contact of contactsWithPhones) {
                const primaryPhone = contact.phones.find((p) => p.isPrimary) || contact.phones[0];
                const phoneExists = (_a = smsGroup.contacts) === null || _a === void 0 ? void 0 : _a.some((c) => c.phone === primaryPhone.number);
                if (!phoneExists) {
                    yield RecipientGroup_1.RecipientGroupModel.findByIdAndUpdate(smsGroup._id, { $addToSet: { contacts: { phone: primaryPhone.number } } });
                }
            }
            return {
                synced: contactsWithPhones.length,
                smsGroupId: smsGroup._id,
                smsGroupName: crmList.name
            };
        });
    }
    /**
     * Remove a contact's email from an email list
     */
    removeContactFromEmailList(userId, emailListId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            yield EmailList_1.EmailListModel.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(emailListId),
                userId: new mongoose_1.Types.ObjectId(userId)
            }, { $pull: { emails: { email: email.toLowerCase() } } });
        });
    }
    /**
     * Remove a contact's phone from an SMS group
     */
    removeContactFromSmsGroup(userId, smsGroupId, phone) {
        return __awaiter(this, void 0, void 0, function* () {
            yield RecipientGroup_1.RecipientGroupModel.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(smsGroupId),
                userId: new mongoose_1.Types.ObjectId(userId)
            }, { $pull: { contacts: { phone } } });
        });
    }
    /**
     * Bulk sync multiple contacts to general lists
     * Used for CSV imports
     */
    bulkSyncContactsToGeneralLists(userId, contacts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const results = {
                emailsAdded: 0,
                phonesAdded: 0
            };
            // Collect all emails and phones first
            const emailsToAdd = [];
            const phonesToAdd = [];
            for (const contact of contacts) {
                if (contact.emails && contact.emails.length > 0) {
                    const primaryEmail = contact.emails.find(e => e.isPrimary) || contact.emails[0];
                    if (primaryEmail === null || primaryEmail === void 0 ? void 0 : primaryEmail.address) {
                        emailsToAdd.push({
                            email: primaryEmail.address,
                            fullName: `${contact.firstName} ${contact.lastName}`.trim()
                        });
                    }
                }
                if (contact.phones && contact.phones.length > 0) {
                    const primaryPhone = contact.phones.find(p => p.isPrimary) || contact.phones[0];
                    if (primaryPhone === null || primaryPhone === void 0 ? void 0 : primaryPhone.number) {
                        phonesToAdd.push({ phone: primaryPhone.number });
                    }
                }
            }
            // Bulk add to General Email List
            if (emailsToAdd.length > 0) {
                const generalEmailList = yield this.findOrCreateGeneralEmailList(userId);
                // Filter out duplicates
                const existingEmails = new Set(((_a = generalEmailList.emails) === null || _a === void 0 ? void 0 : _a.map(e => e.email.toLowerCase())) || []);
                const newEmails = emailsToAdd.filter(e => !existingEmails.has(e.email.toLowerCase()));
                if (newEmails.length > 0) {
                    yield EmailList_1.EmailListModel.findByIdAndUpdate(generalEmailList._id, { $addToSet: { emails: { $each: newEmails } } });
                    results.emailsAdded = newEmails.length;
                }
            }
            // Bulk add to General SMS Group
            if (phonesToAdd.length > 0) {
                const generalSmsGroup = yield this.findOrCreateGeneralSmsGroup(userId);
                // Filter out duplicates
                const existingPhones = new Set(((_b = generalSmsGroup.contacts) === null || _b === void 0 ? void 0 : _b.map((c) => c.phone)) || []);
                const newPhones = phonesToAdd.filter(p => !existingPhones.has(p.phone));
                if (newPhones.length > 0) {
                    yield RecipientGroup_1.RecipientGroupModel.findByIdAndUpdate(generalSmsGroup._id, { $addToSet: { contacts: { $each: newPhones } } });
                    results.phonesAdded = newPhones.length;
                }
            }
            return results;
        });
    }
}
exports.ContactSyncService = ContactSyncService;
