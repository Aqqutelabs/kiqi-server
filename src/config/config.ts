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
    }
}

const configuration: Config = {
    jwt: {
        secret: process.env.JWT_SECRET || "",
        expires: process.env.JWT_ACCESS_EXPIRES || "1week",
        refresh_expires: process.env.JWT_REFRESH_EXPIRES || "30days"
    }
}

export default configuration;