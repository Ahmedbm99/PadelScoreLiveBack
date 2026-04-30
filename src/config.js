import dotenv from 'dotenv';

dotenv.config();
export const config = {
  port: process.env.PORT || 3000,
  
  db: {
   connectionString: process.env.DATABASE_URL,
   sslMode: process.env.DB_SSLMODE || 'require'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-to-a-strong-secret-key',
    expiresIn: '24h'
  },
  corsOrigin: process.env.HOST
};


