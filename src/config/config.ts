import dotenv from "dotenv";
dotenv.config();

export enum AppEnvironment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}

type Config = {
    jwt: {
        secret: string;
        expires: string;
        refresh_expires: string;
    };
    solana: {
        rpcEndpoint: string;
        goCoinMint: string;
        network: 'mainnet-beta' | 'devnet' | 'testnet';
        goWallet: {
            publicKey: string;
            tokenAccount: string;
        };
    };
}

const configuration: Config = {
    jwt: {
        secret: process.env.JWT_SECRET || "",
        expires: process.env.JWT_ACCESS_EXPIRES || "1week",
        refresh_expires: process.env.JWT_REFRESH_EXPIRES || "30days"
    },
    solana: {
        rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
        goCoinMint: process.env.GOCOIN_MINT_ADDRESS || '',
        network: (process.env.SOLANA_NETWORK || 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet',
        goWallet: {
            publicKey: process.env.GO_WALLET_PUBLIC_KEY || '',
            tokenAccount: process.env.GO_WALLET_TOKEN_ACCOUNT || ''
        }
    }
}

export default configuration;