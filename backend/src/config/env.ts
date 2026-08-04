import dotenv from 'dotenv';

dotenv.config();

// single-tenant prototype — all appointments use this business
export const DEFAULT_BUSINESS_ID =
  process.env.DEFAULT_BUSINESS_ID ?? '11111111-1111-1111-1111-111111111111';
