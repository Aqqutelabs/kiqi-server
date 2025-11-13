import { Request, Response, NextFunction } from 'express';
import SettingsModel, { UserSettingsDocument } from '../models/Settings';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

interface AuthUser { _id: string; [key: string]: any }
interface AuthRequest extends Request { user: AuthUser }

const authHandler = (handler: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) =>
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const anyReq = req as AuthRequest;
        if (!anyReq.user || !anyReq.user._id) throw new ApiError(401, 'User not authenticated');
        return handler(anyReq, res, next);
    });

class SettingsController {
    // Get settings for current user or defaults
    getSettings = authHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user._id;
        let settings = await SettingsModel.findOne({ user_id: userId }).lean().exec();
        if (!settings) {
            // return default values without persisting
            settings = {
                user_id: userId,
                altText: '',
                dailySendLimit: 1000,
                batchSendingTime: '09:00',
                emailCompliance: {
                    includeSubscribedLink: true,
                    includePermissionReminder: true
                }
            } as any;
        }

        return res.status(200).json(new ApiResponse(200, settings, 'Settings retrieved'));
    });

    // Update or create settings
    upsertSettings = authHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user._id;
        const {
            altText,
            dailySendLimit,
            batchSendingTime,
            emailCompliance
        }: Partial<UserSettingsDocument> = req.body as any;

        const update: any = {};
        if (typeof altText === 'string') update.altText = altText;
        if (typeof dailySendLimit === 'number') update.dailySendLimit = dailySendLimit;
        if (typeof batchSendingTime === 'string') update.batchSendingTime = batchSendingTime;
        if (emailCompliance && typeof emailCompliance === 'object') update.emailCompliance = {
            includeSubscribedLink: !!(emailCompliance as any).includeSubscribedLink,
            includePermissionReminder: !!(emailCompliance as any).includePermissionReminder
        };

        const settings = await SettingsModel.findOneAndUpdate(
            { user_id: userId },
            { $set: update },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec();

        return res.status(200).json(new ApiResponse(200, settings, 'Settings saved'));
    });
}

export const settingsController = new SettingsController();
export default SettingsController;
