import { Request, Response } from 'express';
import { SERVICES } from '../config/services.js';

export const getServices = (_req: Request, res: Response): void => {
  res.status(200).json({ data: { services: SERVICES } });
};
