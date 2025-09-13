import Jwt from "jsonwebtoken"


export function generateAccessToken(_id: string, email: String): string {
    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES || "30d";
  
    return Jwt.sign({ _id, email: email }, secret, {
      expiresIn: expiresIn as any,
    });
}
  
export function generateRefreshToken(_id: string, email: String): string {
    const secret = process.env.REFRESH_TOKEN_SECRET!;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES || "7d";
  
    return Jwt.sign({ _id, email: email }, secret, {
      expiresIn: expiresIn as any,
    });
}