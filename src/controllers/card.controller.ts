import { Request, Response } from 'express';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Card } from '../models/Card';

// Ensure req.user is defined
const getUserId = (req: Request): string => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User not authenticated');
    }
    return req.user._id;
};

class CardController {
    // Add a new card
    addCard = asyncHandler(async (req: Request, res: Response) => {
        const { cardNumber, expiryMonth, expiryYear, cardholderName, isDefault } = req.body;

        // If setting as default, remove default from other cards
        if (isDefault) {
            await Card.updateMany(
                { user_id: getUserId(req), isDefault: true },
                { isDefault: false }
            );
        }

        // Create the new card
        const card = await Card.create({
            user_id: getUserId(req),
            cardNumber,
            expiryMonth,
            expiryYear,
            cardholderName,
            isDefault: isDefault || false
        });

        return res
            .status(201)
            .json(new ApiResponse(201, card, "Card added successfully"));
    });

    // Get all cards
    getCards = asyncHandler(async (req: Request, res: Response) => {
        const cards = await Card.find({ user_id: getUserId(req) })
            .select('-__v')
            .sort({ isDefault: -1, createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, cards, "Cards retrieved successfully"));
    });

    // Get default card
    getDefaultCard = asyncHandler(async (req: Request, res: Response) => {
        const card = await Card.findOne({ 
            user_id: getUserId(req),
            isDefault: true
        }).select('-__v');

        if (!card) {
            throw new ApiError(404, "No default card found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, card, "Default card retrieved successfully"));
    });

    // Update card
    updateCard = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { expiryMonth, expiryYear, cardholderName, isDefault } = req.body;

        // Verify card ownership
        const card = await Card.findOne({ _id: id, user_id: getUserId(req) });
        if (!card) {
            throw new ApiError(404, "Card not found");
        }

        // If setting as default, remove default from other cards
        if (isDefault) {
            await Card.updateMany(
                { user_id: getUserId(req), _id: { $ne: id }, isDefault: true },
                { isDefault: false }
            );
        }

        const updatedCard = await Card.findByIdAndUpdate(
            id,
            {
                expiryMonth,
                expiryYear,
                cardholderName,
                isDefault: isDefault || false
            },
            { new: true }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, updatedCard, "Card updated successfully"));
    });

    // Delete card
    deleteCard = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const card = await Card.findOne({ _id: id, user_id: getUserId(req) });
        if (!card) {
            throw new ApiError(404, "Card not found");
        }

        // If deleting default card, set another card as default if available
        if (card.isDefault) {
            const anotherCard = await Card.findOneAndUpdate(
                { user_id: getUserId(req), _id: { $ne: id } },
                { isDefault: true }
            );
        }

        await card.deleteOne();

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Card deleted successfully"));
    });

    // Set default card
    setDefaultCard = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // Verify card ownership
        const card = await Card.findOne({ _id: id, user_id: getUserId(req) });
        if (!card) {
            throw new ApiError(404, "Card not found");
        }

        // Remove default from all other cards
        await Card.updateMany(
            { user_id: getUserId(req), _id: { $ne: id } },
            { isDefault: false }
        );

        // Set this card as default
        card.isDefault = true;
        await card.save();

        return res
            .status(200)
            .json(new ApiResponse(200, card, "Default card set successfully"));
    });
}

export const cardController = new CardController();