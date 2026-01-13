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
exports.SMCampaignImpl = void 0;
const SMCampaign_1 = require("../../models/SMCampaign");
class SMCampaignImpl {
    createSMCampaign(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const campaign = yield SMCampaign_1.SMCampaignModel.create(data);
            return campaign;
        });
    }
    getAllSMCampaigns() {
        return __awaiter(this, void 0, void 0, function* () {
            return SMCampaign_1.SMCampaignModel.find();
        });
    }
    getSMCampaignById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return SMCampaign_1.SMCampaignModel.findById(id);
        });
    }
    deleteSMCampaign(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield SMCampaign_1.SMCampaignModel.findByIdAndDelete(id);
        });
    }
}
exports.SMCampaignImpl = SMCampaignImpl;
