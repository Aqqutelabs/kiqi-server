import { Request, Response } from 'express';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { conversionService } from '../services/impl/conversion.service.impl';
<<<<<<< HEAD
=======
import { Wallet } from '../models/Wallet';
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd
import { verifyJWT } from '../middlewares/Auth.middlewares';

type AuthRequest = Request & { user?: any };

class ConversionController {
    // Create conversion request (user)
    createRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
        const user = req.user;
        const { amount, solanaWallet } = req.body;

<<<<<<< HEAD
        // solanaWallet is accepted from the request body; it should NOT be fetched from the database
=======
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd
        if (!solanaWallet) {
            return res.status(400).json(new ApiResponse(400, null, 'Solana wallet is required for conversion'));
        }

<<<<<<< HEAD
        // Delegate balance check and creation to the service. The service will only read the
        // user's go_credits (no solana wallet lookup from DB).
=======
        const wallet = await Wallet.findOne({ user_id: user._id });
        if (!wallet) return res.status(404).json(new ApiResponse(404, null, 'Wallet not found'));

        if (wallet.go_credits < amount) return res.status(400).json(new ApiResponse(400, null, 'Insufficient go credits'));

>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd
        const conversion = await conversionService.createRequest(user._id, amount, solanaWallet);

        return res.status(201).json(new ApiResponse(201, conversion, 'Conversion request created and pending admin approval'));
    });

    // List user's conversion history
    listUser = asyncHandler(async (req: AuthRequest, res: Response) => {
        const user = req.user;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const result = await conversionService.listUserRequests(user._id, page, limit);
        return res.json(new ApiResponse(200, result, 'User conversions retrieved'));
    });

    // Admin: list all requests
    listAll = asyncHandler(async (req: AuthRequest, res: Response) => {
        // simple admin check
<<<<<<< HEAD
        // if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
        //     return res.status(403).json(new ApiResponse(403, null, 'Admin access required'));
        // }
=======
        if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
            return res.status(403).json(new ApiResponse(403, null, 'Admin access required'));
        }
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd

        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 50);
        const result = await conversionService.listAllRequests(page, limit);
        return res.json(new ApiResponse(200, result, 'All conversions retrieved'));
    });

    // Admin: approve
    approve = asyncHandler(async (req: AuthRequest, res: Response) => {
<<<<<<< HEAD
        // if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
        //     return res.status(403).json(new ApiResponse(403, null, 'Admin access required'));
        // }
=======
        if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
            return res.status(403).json(new ApiResponse(403, null, 'Admin access required'));
        }
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd

        const { id } = req.params;
        const conversion = await conversionService.approveRequest(id, req.user._id);
        return res.json(new ApiResponse(200, conversion, 'Conversion approved'));
    });

    // Admin: reject
    reject = asyncHandler(async (req: AuthRequest, res: Response) => {
<<<<<<< HEAD
        // if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
        //     return res.status(403).json(new ApiResponse(403, null, 'Admin access required'));
        // }
=======
        if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
            return res.status(403).json(new ApiResponse(403, null, 'Admin access required'));
        }
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd

        const { id } = req.params;
        const { reason } = req.body;
        const conversion = await conversionService.rejectRequest(id, req.user._id, reason);
        return res.json(new ApiResponse(200, conversion, 'Conversion rejected'));
    });
}

export const conversionController = new ConversionController();
