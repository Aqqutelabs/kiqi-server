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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailistServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const EmailList_1 = require("../../models/EmailList");
const ApiError_1 = require("../../utils/ApiError");
const Contacts_1 = require("../../models/Contacts");
const mongoose_1 = __importDefault(require("mongoose"));
class EmailistServiceImpl {
    createEmailList(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let userObjectId;
            if (mongoose_1.default.Types.ObjectId.isValid(data.userId)) {
                userObjectId = new mongoose_1.default.Types.ObjectId(data.userId);
            }
            else if (data.userId && data.userId._id && mongoose_1.default.Types.ObjectId.isValid(data.userId._id)) {
                userObjectId = new mongoose_1.default.Types.ObjectId(data.userId._id);
            }
            else {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid userId: must be a valid MongoDB ObjectId");
            }
            const isExists = yield EmailList_1.EmailListModel.findOne({
                email_listName: data.email_listName,
                userId: userObjectId
            });
            if (isExists) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email list already exists");
            }
            const newList = yield EmailList_1.EmailListModel.create({
                email_listName: data.email_listName,
                emails: data.emails,
                emailFiles: data.emailFiles,
                userId: userObjectId,
            });
            return newList;
        });
    }
    getEmailListsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let userObjectId;
            if (mongoose_1.default.Types.ObjectId.isValid(userId)) {
                userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            }
            else if (userId && userId._id && mongoose_1.default.Types.ObjectId.isValid(userId._id)) {
                userObjectId = new mongoose_1.default.Types.ObjectId(userId._id);
            }
            else {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid userId: must be a valid MongoDB ObjectId");
            }
            return EmailList_1.EmailListModel.find({ userId: userObjectId });
        });
    }
    getAllEmailLists() {
        return __awaiter(this, void 0, void 0, function* () {
            return EmailList_1.EmailListModel.find();
        });
    }
    getEmailList(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return EmailList_1.EmailListModel.findById(id);
        });
    }
    addEmailListContacts(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const isEmailListExists = yield EmailList_1.EmailListModel.findById({
                id
            });
            if (isEmailListExists) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email List does not exist");
            }
            const newContact = yield Contacts_1.ContactModel.create({
                firstName: data.firstName,
                lastName: data.lastName,
                emailAddress: data.emailAddress,
                phoneNumber: data.phoneNumber,
                groupEmailList: data.groupEmailList
            });
            return newContact;
        });
    }
    deleteEmailListContact(id, contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            const isEmailListExists = yield EmailList_1.EmailListModel.findById({
                id
            });
            if (isEmailListExists) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email List does not exist");
            }
            yield Contacts_1.ContactModel.findByIdAndDelete(contactId);
        });
    }
    getAllContacts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Contacts_1.ContactModel.find();
        });
    }
    deleteEmailList(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const emailList = yield EmailList_1.EmailListModel.findByIdAndDelete(id);
            if (!emailList) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Email list not found");
            }
            // Also delete all associated contacts
            yield Contacts_1.ContactModel.deleteMany({ groupEmailList: id });
        });
    }
}
exports.EmailistServiceImpl = EmailistServiceImpl;
