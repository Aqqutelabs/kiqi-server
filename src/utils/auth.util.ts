import Jwt from "jsonwebtoken"


export function generateAccessToken(id: string, senderEmail: String): string {
    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES || "1week";
  
    return Jwt.sign({ id, email: senderEmail }, secret, {
      expiresIn,
    });
  }
  
  export function generateRefreshToken(id: string, senderEmail: String): string {
    const secret = process.env.REFRESH_TOKEN_SECRET!;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES || "7d";
  
    return Jwt.sign({ id, email: senderEmail }, secret, {
      expiresIn,
    });
  }