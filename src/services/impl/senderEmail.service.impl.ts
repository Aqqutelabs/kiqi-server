import { StatusCodes } from "http-status-codes";
import { SenderEmailModel, SenderModel } from "../../models/SenderEmail";
import { UserModel } from "../../models/User";
import { ApiError } from "../../utils/ApiError";
import { SenderEmailService } from "../senderEmail.service";
import axios from 'axios';


export class SenderEmailServiceImpl implements SenderEmailService{
    async createSenderEmail( senderName: String, type: String, email: String, userId?: string ): Promise<SenderEmailModel> {
        const isUserExist = await SenderModel.findOne({ senderEmail: email });
        if (isUserExist) {
          throw new ApiError(StatusCodes.BAD_REQUEST, "Email already exists");
        }

        const payload: any = {
          senderName,
          type: type,
          senderEmail: email,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        if (userId) payload.user_id = userId;

        const sender = await SenderModel.create(payload);

        return sender;
      }
      
    async getSenderEmailById(id: String): Promise<SenderEmailModel | null> {
        return SenderModel.findById(id);
    }
    getAllSenderEmails(): Promise<SenderEmailModel[]> {
        return SenderModel.find();
    }
    async updateSenderEmail(
        id: string,
        data: Partial<{ senderName: string; type: string; senderEmail: string }>
      ): Promise<SenderEmailModel> {
        const updated = await SenderModel.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
          updatedAt: Date.now()
        });
      
        if (!updated) {
          throw new Error("Sender email not found");
        }
      
        return updated;
      }
      
    async deleteSenderEmail(id: String): Promise<void> {
        await SenderModel.findByIdAndDelete(id);
    }
    
  // OTP-based requestVerification removed. Use SendGrid verification endpoints instead.

  /**
   * Request SendGrid single-sender verification. This will create a sender in SendGrid
   * which triggers SendGrid to email a verification link to the address.
   */
  async requestSendGridVerification(nickname: string, senderName: string, email: string, address = '', city = '', state = '', zip = '', country = 'US', userId?: string): Promise<SenderEmailModel> {
    const key = process.env.SENDGRID_API_KEY;
    console.log('i am the correct key', key);
    if (!key) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid API key not configured');

    const existing = await SenderModel.findOne({ senderEmail: email });
    if (existing && existing.verified) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Sender already verified');
    }

    const payload: any = {
      nickname: nickname || senderName,
      from_email: email,
      from_name: senderName,
      reply_to: email,
      reply_to_name: senderName,
      address: address || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      country: country || 'US'
    };

    // Diagnostic: log presence of key (masked) and validate it with a lightweight account call
    const maskedKey = key ? (key.length > 8 ? `${key.slice(0,4)}...${key.slice(-4)}` : '****') : 'MISSING';
    console.log('[SenderService] SendGrid key present:', !!key, 'preview=', maskedKey);

    try {
      // Quick validation to detect invalid/unauthorized keys early
      await axios.get('https://api.sendgrid.com/v3/user/account', {
        headers: { Authorization: `Bearer ${key}` }
      });
    } catch (authErr: any) {
      const authBody = authErr?.response?.data || authErr?.response?.body || authErr?.message;
      console.error('[SenderService] SendGrid key validation failed:', JSON.stringify(authBody));
      // Surface a clear error so operator can fix the key in env
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid API key unauthorized: ${JSON.stringify(authBody)}`);
    }

    try {
      const resp = await axios.post('https://api.sendgrid.com/v3/verified_senders', payload, {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
      });

      console.log('respnse:', resp);

      const sgId = resp.data && (resp.data.id || resp.data._id || resp.data.sender_id);

      let sender = existing;
      if (!sender) {
        sender = await SenderModel.create({ senderName, type: 'sendgrid', senderEmail: email, user_id: userId, verified: false, sendgridId: sgId });
      } else {
        sender.sendgridId = sgId as any;
        sender.verified = false;
        sender.type = 'sendgrid' as any;
        if (userId) sender.user_id = userId as any;
        await sender.save();
      }

      return sender;
    } catch (err: any) {
      // Log full SendGrid error body for debugging (but never log the API key)
      try {
        const body = err?.response?.data || err?.response?.body;
        if (body) console.error('[SenderService] SendGrid create sender error body:', JSON.stringify(body));
      } catch (logErr) {
        console.error('[SenderService] Failed to log SendGrid error body:', logErr);
      }

      const status = err?.response?.status;
      const msg = err?.response?.data || err.message || 'SendGrid request failed';
      // Map authorization errors to a clearer status
      if (status === 401 || status === 403) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, `SendGrid API unauthorized: ${JSON.stringify(msg)}`);
      }

      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid create sender failed: ${JSON.stringify(msg)}`);
    }
  }

  /**
   * Confirm SendGrid verification for a local sender record. Checks SendGrid sender status
   * and marks local sender as verified when SendGrid reports verified.
   */
  async confirmSendGridVerification(localSenderId: string, userId?: string): Promise<SenderEmailModel> {
    const sender = await SenderModel.findById(localSenderId);
    if (!sender) throw new ApiError(StatusCodes.NOT_FOUND, 'Sender email not found');
    if (userId && sender.user_id && sender.user_id.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You do not own this sender email');
    }
    if (!sender.sendgridId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No SendGrid sender ID for this record');

    const key = process.env.SENDGRID_API_KEY;
    if (!key) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid API key not configured');

    try {
      const resp = await axios.get(`https://api.sendgrid.com/v3/verified_senders/${sender.sendgridId}`, {
        headers: { Authorization: `Bearer ${key}` }
      });

      const body = resp.data || {};
      // SendGrid may return a 'status' or 'verified' field; check common patterns
      const isVerified = body.verified === true || body.status === 'verified' || body.is_verified === true;

      if (!isVerified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Sender not yet verified by SendGrid');
      }

      sender.verified = true;
      await sender.save();

      // Update user's default sender email
      if (sender.user_id) {
        await UserModel.findByIdAndUpdate(sender.user_id, { senderEmail: sender.senderEmail });
      }

      return sender;
    } catch (err: any) {
      try {
        const body = err?.response?.data || err?.response?.body;
        if (body) console.error('[SenderService] SendGrid verify check error body:', JSON.stringify(body));
      } catch (logErr) {
        console.error('[SenderService] Failed to log SendGrid verify error body:', logErr);
      }
      const msg = err?.response?.data || err.message || 'SendGrid verify check failed';
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid verify check failed: ${JSON.stringify(msg)}`);
    }
  }

  /**
   * Confirm SendGrid verification using the token from the SendGrid verification link.
   * This calls SendGrid's `/v3/verified_senders/verify/{token}` endpoint. On success,
   * it will try to find the local sender by SendGrid id or by email and mark it verified.
   */
  async confirmSendGridVerificationByToken(token: string, userId?: string): Promise<SenderEmailModel> {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid API key not configured');

    if (!token) throw new ApiError(StatusCodes.BAD_REQUEST, 'token is required');

    try {
      const resp = await axios.get(`https://api.sendgrid.com/v3/verified_senders/verify/${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${key}` }
      });

      let body = resp.data || {};

      // If SendGrid returned an empty body, fall back to listing verified_senders and
      // matching against our local pending senders' emails. Some SendGrid accounts
      // return minimal/empty payload from the verify endpoint.
      if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        try {
          const listResp = await axios.get('https://api.sendgrid.com/v3/verified_senders', {
            headers: { Authorization: `Bearer ${key}` }
          });
          const listBody = listResp.data || {};
          const results = Array.isArray(listBody.result) ? listBody.result : (Array.isArray(listBody) ? listBody : listBody.results || []);

          // Find local pending senders
          const pendingSenders = await SenderModel.find({ verified: false, type: 'sendgrid' });
          let matched: any = null;

          for (const entry of results) {
            // Entry may have from_email or from_email_address depending on API.
            const entryEmail = entry.from_email || entry.from_email_address || entry.email || entry.from;
            if (!entryEmail) continue;

            const match = pendingSenders.find(ps => ps.senderEmail && ps.senderEmail.toLowerCase() === String(entryEmail).toLowerCase());
            if (match && (entry.status === 'verified' || entry.verified === true || entry.is_verified === true)) {
              matched = { entry, match };
              break;
            }
          }

          if (!matched) {
            throw new ApiError(StatusCodes.NOT_FOUND, `No local sender found matching SendGrid verified senders list for token: ${token}`);
          }

          // mark matched local sender as sender
          body = matched.entry;
          const matchedSender: any = matched.match;
          matchedSender.verified = true;
          await matchedSender.save();
          if (matchedSender.user_id) await UserModel.findByIdAndUpdate(matchedSender.user_id, { senderEmail: matchedSender.senderEmail });
          return matchedSender;
        } catch (listErr: any) {
          // If fallback list check failed, log and surface a helpful message
          try {
            const dbg = listErr?.response?.data || listErr?.response?.body;
            if (dbg) console.error('[SenderService] SendGrid verified_senders list error body:', JSON.stringify(dbg));
          } catch (le) {
            console.error('[SenderService] Failed to log verified_senders list error body', le);
          }
          throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid verify returned empty result and verified_senders fallback failed');
        }
      }

      // Try to find SendGrid id or email in response
      const sgId = (body && (body.id || body._id || body.sender_id || body.id_string));
      const sgEmail = body.from_email || body.email || body.from || body.sender_email;

      let sender: SenderEmailModel | null = null;

      if (sgId) {
        sender = await SenderModel.findOne({ sendgridId: sgId });
      }

      if (!sender && sgEmail) {
        sender = await SenderModel.findOne({ senderEmail: sgEmail });
      }

      if (!sender) {
        // If we couldn't find a local sender record, surface the SendGrid response to help debugging
        throw new ApiError(StatusCodes.NOT_FOUND, `No local sender found for SendGrid verification result: ${JSON.stringify(body)}`);
      }

      if (userId && sender.user_id && sender.user_id.toString() !== userId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You do not own this sender email');
      }

      sender.verified = true;
      await sender.save();

      if (sender.user_id) {
        await UserModel.findByIdAndUpdate(sender.user_id, { senderEmail: sender.senderEmail });
      }

      return sender;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      try {
        const body = err?.response?.data || err?.response?.body;
        if (body) console.error('[SenderService] SendGrid verify-by-token error body:', JSON.stringify(body));
      } catch (logErr) {
        console.error('[SenderService] Failed to log SendGrid verify-by-token error body:', logErr);
      }
      const msg = err?.response?.data || err.message || 'SendGrid verify-by-token failed';
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid verify-by-token failed: ${JSON.stringify(msg)}`);
    }
  }

  /**
   * Retrieves the user's verified sender email address.
   * @param userId The user ID.
   * @returns The verified SenderEmailModel for the user, or null if none found.
   */
  async getUserVerifiedSender(userId: string): Promise<SenderEmailModel | null> {
    try {
      const sender = await SenderModel.findOne({ user_id: userId, verified: true, type: 'sendgrid' });
      return sender || null;
    } catch (err: any) {
      console.error(`[SenderService] Error fetching verified sender for user ${userId}:`, err);
      return null;
    }
  }

  // OTP-based verifyOtp removed. Use SendGrid verification endpoints instead.
    
}