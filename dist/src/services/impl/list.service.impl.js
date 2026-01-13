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
exports.ListService = void 0;
const CampaignList_1 = require("../../models/CampaignList");
const mongoose_1 = require("mongoose");
const contact_sync_service_1 = require("./contact-sync.service");
const emailList_service_impl_1 = require("./emailList.service.impl");
class ListService {
    constructor() {
        this.contactSyncService = new contact_sync_service_1.ContactSyncService();
        this.emailListService = new emailList_service_impl_1.EmailistServiceImpl();
    }
    createList(userId, name, description) {
        return __awaiter(this, void 0, void 0, function* () {
            const newList = yield CampaignList_1.ListModel.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                name,
                description
            });
            // Create a corresponding email list
            yield this.emailListService.createEmailList({
                email_listName: name,
                emails: [], // Initially empty, can be updated later
                emailFiles: [],
                userId
            });
            return newList;
        });
    }
    getListsForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // We use aggregation to count contacts in each list for the UI table
            return yield CampaignList_1.ListModel.aggregate([
                { $match: { userId: new mongoose_1.Types.ObjectId(userId) } },
                {
                    $project: {
                        name: 1,
                        description: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        contactCount: { $size: "$contacts" }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);
        });
    }
    getListById(userId, listId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Return list details with populated contacts
            return yield CampaignList_1.ListModel.findOne({
                _id: new mongoose_1.Types.ObjectId(listId),
                userId: new mongoose_1.Types.ObjectId(userId)
            }).populate('contacts');
        });
    }
    addContactsToList(userId, listId, contactIds) {
        return __awaiter(this, void 0, void 0, function* () {
            // $addToSet ensures we don't add the same contact twice
            const updatedList = yield CampaignList_1.ListModel.findOneAndUpdate({ _id: listId, userId: new mongoose_1.Types.ObjectId(userId) }, { $addToSet: { contacts: { $each: contactIds.map(id => new mongoose_1.Types.ObjectId(id)) } } }, { new: true });
            // Sync to corresponding Email List and SMS Group
            if (updatedList) {
                yield this.contactSyncService.syncCrmListToEmailList(userId, listId);
                yield this.contactSyncService.syncCrmListToSmsGroup(userId, listId);
            }
            return updatedList;
        });
    }
    removeContactFromList(userId, listId, contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield CampaignList_1.ListModel.findOneAndUpdate({ _id: listId, userId: new mongoose_1.Types.ObjectId(userId) }, { $pull: { contacts: new mongoose_1.Types.ObjectId(contactId) } }, { new: true });
        });
    }
    deleteList(userId, listId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield CampaignList_1.ListModel.deleteOne({
                _id: new mongoose_1.Types.ObjectId(listId),
                userId: new mongoose_1.Types.ObjectId(userId)
            });
        });
    }
}
exports.ListService = ListService;
