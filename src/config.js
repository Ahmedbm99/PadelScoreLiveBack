export const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'padel_score'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-to-a-strong-secret-key',
    expiresIn: '1h'
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://192.168.100.123:5173'
};


