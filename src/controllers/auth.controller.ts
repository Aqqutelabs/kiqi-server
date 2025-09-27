import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthServiceImpl } from "../services/impl/auth.service.impl";

export class AuthController {
  private authService: AuthServiceImpl;

  constructor() {
    this.authService = new AuthServiceImpl();
  }

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login({ email, password });
      res.status(StatusCodes.CREATED).json({
        error: false,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user
      });
    } catch (error) {
      next(error);
    }
  };

  public createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { firstName, lastName, email, password, organizationName } = req.body;
      const user = await this.authService.createUser({ firstName, lastName, email, password, organizationName });
      const accessToken = this.authService.generateAccessTokenForUser(user);
      res.status(StatusCodes.CREATED).json({
        error: false,
        message: `User registered successfully. Email: ${user.email}`,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  };
}
