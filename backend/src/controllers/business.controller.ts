import { Request, Response, NextFunction } from 'express';
import * as businessService from '../services/business.service.js';

export const getBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const business = await businessService.getBusinessForUser(req.user!.id);
    res.status(200).json({ data: { business } });
  } catch (err) {
    next(err);
  }
};
