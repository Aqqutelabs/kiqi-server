import { z } from 'zod';

export const settingsSchema = z.object({
  altText: z.string().max(500).optional(),
  dailySendLimit: z.number().int().nonnegative().optional(),
  batchSendingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM
  emailCompliance: z.object({
    includeSubscribedLink: z.boolean().optional(),
    includePermissionReminder: z.boolean().optional(),
  }).optional()
});

export type SettingsSchemaType = z.infer<typeof settingsSchema>;