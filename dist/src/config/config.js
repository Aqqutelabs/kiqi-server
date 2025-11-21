"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEnvironment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var AppEnvironment;
(function (AppEnvironment) {
    AppEnvironment["DEVELOPMENT"] = "development";
    AppEnvironment["PRODUCTION"] = "production";
})(AppEnvironment || (exports.AppEnvironment = AppEnvironment = {}));
const configuration = {
    jwt: {
        secret: process.env.JWT_SECRET || "",
        expires: process.env.JWT_ACCESS_EXPIRES || "1week",
        refresh_expires: process.env.JWT_REFRESH_EXPIRES || "30days"
    },
    solana: {
        rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
        goCoinMint: process.env.GOCOIN_MINT_ADDRESS || '',
        network: (process.env.SOLANA_NETWORK || 'mainnet-beta'),
        goWallet: {
            publicKey: process.env.GO_WALLET_PUBLIC_KEY || '',
            tokenAccount: process.env.GO_WALLET_TOKEN_ACCOUNT || ''
        }
    }
};
exports.default = configuration;
