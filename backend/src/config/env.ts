import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@gmail.com',
  adminPass: process.env.ADMIN_PASS || 'admin123',
  resendApiKey: process.env.RESEND_API_KEY || '',
  notificationEmail: process.env.NOTIFICATION_EMAIL || 'martinelgueda9@gmail.com',
};
