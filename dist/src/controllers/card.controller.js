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
exports.cardController = void 0;
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const Card_1 = require("../models/Card");
// Ensure req.user is defined
const getUserId = (req) => {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'User not authenticated');
    }
    return req.user._id;
};
class CardController {
    constructor() {
        // Add a new card
        this.addCard = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { cardNumber, expiryMonth, expiryYear, cardholderName, isDefault } = req.body;
            // If setting as default, remove default from other cards
            if (isDefault) {
                yield Card_1.Card.updateMany({ user_id: getUserId(req), isDefault: true }, { isDefault: false });
            }
            // Create the new card
            const card = yield Card_1.Card.create({
                user_id: getUserId(req),
                cardNumber,
                expiryMonth,
                expiryYear,
                cardholderName,
                isDefault: isDefault || false
            });
            return res
                .status(201)
                .json(new ApiResponse_1.ApiResponse(201, card, "Card added successfully"));
        }));
        // Get all cards
        this.getCards = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const cards = yield Card_1.Card.find({ user_id: getUserId(req) })
                .select('-__v')
                .sort({ isDefault: -1, createdAt: -1 });
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, cards, "Cards retrieved successfully"));
        }));
        // Get default card
        this.getDefaultCard = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const card = yield Card_1.Card.findOne({
                user_id: getUserId(req),
                isDefault: true
            }).select('-__v');
            if (!card) {
                throw new ApiError_1.ApiError(404, "No default card found");
            }
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, card, "Default card retrieved successfully"));
        }));
        // Update card
        this.updateCard = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { expiryMonth, expiryYear, cardholderName, isDefault } = req.body;
            // Verify card ownership
            const card = yield Card_1.Card.findOne({ _id: id, user_id: getUserId(req) });
            if (!card) {
                throw new ApiError_1.ApiError(404, "Card not found");
            }
            // If setting as default, remove default from other cards
            if (isDefault) {
                yield Card_1.Card.updateMany({ user_id: getUserId(req), _id: { $ne: id }, isDefault: true }, { isDefault: false });
            }
            const updatedCard = yield Card_1.Card.findByIdAndUpdate(id, {
                expiryMonth,
                expiryYear,
                cardholderName,
                isDefault: isDefault || false
            }, { new: true });
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, updatedCard, "Card updated successfully"));
        }));
        // Delete card
        this.deleteCard = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const card = yield Card_1.Card.findOne({ _id: id, user_id: getUserId(req) });
            if (!card) {
                throw new ApiError_1.ApiError(404, "Card not found");
            }
            // If deleting default card, set another card as default if available
            if (card.isDefault) {
                const anotherCard = yield Card_1.Card.findOneAndUpdate({ user_id: getUserId(req), _id: { $ne: id } }, { isDefault: true });
            }
            yield card.deleteOne();
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, null, "Card deleted successfully"));
        }));
        // Set default card
        this.setDefaultCard = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            // Verify card ownership
            const card = yield Card_1.Card.findOne({ _id: id, user_id: getUserId(req) });
            if (!card) {
                throw new ApiError_1.ApiError(404, "Card not found");
            }
            // Remove default from all other cards
            yield Card_1.Card.updateMany({ user_id: getUserId(req), _id: { $ne: id } }, { isDefault: false });
            // Set this card as default
            card.isDefault = true;
            yield card.save();
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, card, "Default card set successfully"));
        }));
    }
}
exports.cardController = new CardController();
