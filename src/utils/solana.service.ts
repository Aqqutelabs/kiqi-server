import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import config from '../config/config';

// Environment checks
if (!config.solana?.rpcEndpoint) {
    throw new Error('Solana RPC endpoint not configured');
}
if (!config.solana?.goCoinMint) {
    throw new Error('GoCoin mint address not configured');
}

// Solana connection
const connection = new Connection(
    config.solana.rpcEndpoint,
    'confirmed'
);

// GoCoin token details
const GOCOIN_MINT = new PublicKey(config.solana.goCoinMint);
const GOCOIN_DECIMALS = 9; // Standard SPL token decimals

export class SolanaService {
    /**
     * Get or create an associated token account for the GoCoin token
     */
    static async getOrCreateAssociatedTokenAccount(walletPublicKey: string) {
        const publicKey = new PublicKey(walletPublicKey);
        
        try {
            const associatedTokenAddress = await getAssociatedTokenAddress(
                GOCOIN_MINT,
                publicKey,
                false,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            // Check if the account exists
            const tokenAccount = await connection.getTokenAccountBalance(associatedTokenAddress);
            
            return {
                address: associatedTokenAddress.toString(),
                exists: true
            };
        } catch (error) {
            // If account doesn't exist, return the address that would be created
            const associatedTokenAddress = await getAssociatedTokenAddress(
                GOCOIN_MINT,
                publicKey,
                false,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            return {
                address: associatedTokenAddress.toString(),
                exists: false
            };
        }
    }

    /**
     * Get GoCoin balance for a wallet
     */
    static async getGoCoinBalance(tokenAccountAddress: string): Promise<number> {
        try {
            const tokenAccount = await connection.getTokenAccountBalance(
                new PublicKey(tokenAccountAddress)
            );

            return parseFloat(tokenAccount.value.uiAmount?.toString() || '0');
        } catch (error) {
            console.error('Error getting token balance:', error);
            return 0;
        }
    }

    /**
     * Create instructions for transferring GoCoins
     * Note: This creates the transaction instructions but doesn't sign or send them
     * The actual signing needs to be done by the Phantom wallet on the client side
     */
    static async createTransferInstructions(
        fromPublicKey: string,
        toPublicKey: string,
        amount: number
    ) {
        const fromPubkey = new PublicKey(fromPublicKey);
        const toPubkey = new PublicKey(toPublicKey);

        // Get or create associated token accounts
        const fromTokenAccount = await this.getOrCreateAssociatedTokenAccount(fromPublicKey);
        const toTokenAccount = await this.getOrCreateAssociatedTokenAccount(toPublicKey);

        // Create the token transfer instruction
        const transferInstruction = createTransferInstruction(
            new PublicKey(fromTokenAccount.address),
            new PublicKey(toTokenAccount.address),
            fromPubkey,
            amount * Math.pow(10, GOCOIN_DECIMALS),
            [],
            TOKEN_PROGRAM_ID
        );

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);
        
        // Get the latest blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        return {
            transaction: transaction.serialize({ requireAllSignatures: false }),
            toTokenAccount: toTokenAccount.address,
            fromTokenAccount: fromTokenAccount.address
        };
    }

    /**
     * Verify a GoCoin transfer transaction
     */
    static async verifyTransaction(signature: string): Promise<boolean> {
        try {
            const confirmation = await connection.confirmTransaction(signature);
            return confirmation.value.err === null;
        } catch (error) {
            console.error('Error verifying transaction:', error);
            return false;
        }
    }

    /**
     * Get transaction history for a token account
     */
    static async getTokenTransactionHistory(tokenAccountAddress: string) {
        try {
            const signatures = await connection.getSignaturesForAddress(
                new PublicKey(tokenAccountAddress),
                { limit: 10 }
            );

            const transactions = await Promise.all(
                signatures.map(async (sig) => {
                    const tx = await connection.getTransaction(sig.signature);
                    return {
                        signature: sig.signature,
                        timestamp: sig.blockTime,
                        status: tx?.meta?.err ? 'failed' : 'success',
                        amount: tx?.meta?.postTokenBalances?.[0]?.uiTokenAmount.uiAmount || 0
                    };
                })
            );

            return transactions;
        } catch (error) {
            console.error('Error getting transaction history:', error);
            return [];
        }
    }
}

// Helper function to validate Solana addresses
export const isValidSolanaAddress = (address: string): boolean => {
    try {
        new PublicKey(address);
        return true;
    } catch (error) {
        return false;
    }
};