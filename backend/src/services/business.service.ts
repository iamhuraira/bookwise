import { query } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export interface Business {
  id: string;
  name: string;
}

export const getBusinessForUser = async (userId: string): Promise<Business> => {
  const result = await query(
    `SELECT b.id, b.name
     FROM users u
     JOIN businesses b ON b.id = u.business_id
     WHERE u.id = $1`,
    [userId],
  );

  if (result.rows.length === 0) {
    throw AppError('Business not found for this account', 404, 'NOT_FOUND');
  }

  const row = result.rows[0] as Business;
  return { id: row.id, name: row.name };
};
