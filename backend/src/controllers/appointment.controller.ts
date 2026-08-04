import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as appointmentService from '../services/appointment.service.js';
import { AppError } from '../utils/AppError.js';

const uuidParam = z.uuid();

const parseAppointmentId = (req: Request, next: NextFunction): string | null => {
  const parsed = uuidParam.safeParse(req.params.id);
  if (!parsed.success) {
    next(AppError('Invalid appointment id', 400, 'VALIDATION_ERROR'));
    return null;
  }
  return parsed.data;
};

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const appointment = await appointmentService.createAppointment(req.user!.id, req.body);
    res.status(201).json({ data: { appointment } });
  } catch (err) {
    next(err);
  }
};

export const listAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const appointments = await appointmentService.listAppointments(req.user!.id);
    res.status(200).json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseAppointmentId(req, next);
    if (!id) return;

    const appointment = await appointmentService.cancelAppointment(req.user!.id, id);
    res.status(200).json({ data: { appointment } });
  } catch (err) {
    next(err);
  }
};
