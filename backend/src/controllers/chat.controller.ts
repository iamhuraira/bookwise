import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as chatService from '../services/chat.service.js';
import { AppError } from '../utils/AppError.js';

const uuidParam = z.uuid();

const parseSessionId = (req: Request, next: NextFunction): string | null => {
  const parsed = uuidParam.safeParse(req.params.id);
  if (!parsed.success) {
    next(AppError('Invalid session id', 400, 'VALIDATION_ERROR'));
    return null;
  }
  return parsed.data;
};

export const createOrGetSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await chatService.findOrCreateSession(req.user!.id);
    res.status(result.created ? 201 : 200).json({
      data: { session: result.session, messages: result.messages },
    });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseSessionId(req, next);
    if (!id) return;

    const result = await chatService.getSessionMessages(id, req.user!.id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseSessionId(req, next);
    if (!id) return;

    const result = await chatService.handleUserMessage(id, req.user!.id, req.body.content);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};
