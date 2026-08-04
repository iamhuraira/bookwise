import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getUserById(req.user!.id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};
