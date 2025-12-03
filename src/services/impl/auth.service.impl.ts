import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/ApiError";
import { generateAccessToken, generateRefreshToken } from "../../utils/auth.util";
import { AuthService } from "../auth.service";
import { User, UserModel } from "../../models/User";
import { Wallet } from "../../models/Wallet";
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';


export class AuthServiceImpl implements AuthService{
   
async login(
    data: {
      email: string,
      password: string
    }
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await UserModel.findOne({ email: data.email });

    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid email");
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Exclude sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return { accessToken, refreshToken, user: userObj };
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName: string;
  }): Promise<User> {
    const { firstName, lastName, email, password, organizationName } = data;
  
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Oops, email already taken");
    }
  
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password, // Ensure this is hashed in middleware or before this call
      organizationName,
    });
  
    if (!user) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Unexpected error during user creation"
      );
    }
  
    return user;
  }
  
  generateAccessTokenForUser(user: User) {
    return generateAccessToken((user._id as any).toString(), user.email);
  }
  
  generateRefreshTokenForUser(user: User) {
    return generateRefreshToken((user._id as any).toString(), user.email);
  }

  /**
   * Verify Solana wallet signature
   * @param walletAddress - The wallet address
   * @param signature - The signature from the wallet (base58 or base64)
   * @param message - The original message that was signed
   * @returns boolean - True if signature is valid
   */
  async verifyWalletSignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Handle both base64 and base58 encoded signatures
      let signatureBytes: Uint8Array;
      try {
        // Try base64 first
        signatureBytes = Uint8Array.from(Buffer.from(signature, 'base64'));
      } catch {
        // Fallback to treating as array of numbers
        signatureBytes = Uint8Array.from(
          signature.split(',').map((s) => parseInt(s, 10))
        );
      }

      // Verify the signature
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      return isValid;
    } catch (error) {
      console.error('Wallet signature verification error:', error);
      return false;
    }
  }

  /**
   * Create user with wallet (for Web3/Solana signup)
   * @param walletAddress - The Solana wallet address
   * @param signature - The signature proving wallet ownership
   * @param message - The message that was signed
   * @returns User object with access token
   */
  async createUserWithWallet(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Verify the wallet signature first
    const isSignatureValid = await this.verifyWalletSignature(
      walletAddress,
      signature,
      message
    );

    if (!isSignatureValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid wallet signature");
    }

    // Check if wallet address already exists
    const existingUser = await UserModel.findOne({ walletAddress });
    if (existingUser) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Wallet address already registered"
      );
    }

    // Check if valid Solana address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid wallet address");
    }

    // Create user with generic Web3 name
    const user = await UserModel.create({
      firstName: 'Web3',
      lastName: 'User',
      email: `${walletAddress}@wallet.local`,
      password: Math.random().toString(36).slice(2, 12), // Random password for social login
      organizationName: 'Web3 Organization',
      walletAddress,
    });

    if (!user) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create user"
      );
    }

    // Create wallet record for the user
    await Wallet.create({
      user_id: user._id,
      go_credits: 0,
      go_coins: 0,
      monthly_limit: 5000,
      total_spent: 0,
      total_earned_coins: 0,
      avg_monthly_spend: 0,
      phantom_wallet: {
        public_key: walletAddress,
        is_connected: true,
        last_connected: new Date(),
      },
      status: 'Active',
    });

    const accessToken = this.generateAccessTokenForUser(user);
    const refreshToken = this.generateRefreshTokenForUser(user);

    return { user, accessToken, refreshToken };
  }
}