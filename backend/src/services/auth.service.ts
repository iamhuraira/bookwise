import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { query } from '../config/db.js';
import { DEFAULT_BUSINESS_ID } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import type { LoginInput, SignupInput } from '../schemas/auth.schema.js';

const USER_FIELDS = 'id, email, full_name, role, created_at';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: Date;
  password_hash?: string;
}

const signToken = (user: User): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
  };
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    options,
  );
};

const mapUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  createdAt: row.created_at,
});

export const signup = async ({ email, password, fullName }: SignupInput) => {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw AppError('Email already registered', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, business_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_FIELDS}`,
    [email, passwordHash, fullName, DEFAULT_BUSINESS_ID],
  );

  const user = mapUser(result.rows[0] as UserRow);
  return { user, token: signToken(user) };
};

export const login = async ({ email, password }: LoginInput) => {
  const result = await query(
    `SELECT id, email, full_name, role, created_at, password_hash
     FROM users WHERE email = $1`,
    [email],
  );

  const row = result.rows[0] as UserRow | undefined;
  const valid = row && (await bcrypt.compare(password, row.password_hash!));

  if (!valid) {
    throw AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const user = mapUser(row!);
  return { user, token: signToken(user) };
};

export const getUserById = async (id: string): Promise<User> => {
  const result = await query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    throw AppError('User not found', 404, 'NOT_FOUND');
  }

  return mapUser(result.rows[0] as UserRow);
};
