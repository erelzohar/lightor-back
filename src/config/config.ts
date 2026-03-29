import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.lytkt.mongodb.net/Lightor${process.env.NODE_ENV !== 'production' ? '-test' : ''}`;
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
const S3_BUCKET = process.env.S3_BUCKET || '';
const BUCKET_REGION = process.env.BUCKET_REGION || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const PORT = parseInt(process.env.PORT || '3000', 10);
const SMS_USER = process.env.SMS_USER || '';
const SMS_KEY = process.env.SMS_KEY || '';
const NEW_SMS_USER = process.env.NEW_SMS_USER || '';
const NEW_SMS_TOKEN = process.env.NEW_SMS_TOKEN || '';
const SMS_PASS = process.env.SMS_PASS || '';
const SMS_SENDER = process.env.SMS_SENDER || '';
const WA_ACCOUNT_ID = process.env.WA_ACCOUNT_ID || '';
const WA_ACCOUNT_TOKEN = process.env.WA_ACCOUNT_TOKEN || '';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || 'user@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'password';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@lightor.app';
const RESEND_EMAIL_TOKEN = process.env.RESEND_EMAIL_TOKEN || '';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const REDIS_HOST = process.env.REDIS_HOST || '';
const REDIS_PORT = process.env.REDIS_PORT || 0;
const REDIS_USER = process.env.REDIS_USER || '';
const REDIS_PASS = process.env.REDIS_PASS || '';

// Environment validation
function validateEnv(): void {
  const requiredEnvVars = [
    'MONGO_USERNAME',
    'MONGO_PASSWORD',
    'JWT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

// Attempt to validate environment variables
try {
  validateEnv();
} catch (error) {
  if (error instanceof Error) {
    console.error(`Environment validation failed: ${error.message}`);
  }
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const config = {
  mongo: {
    url: MONGO_URL
  },
  server: {
    port: PORT,
    nodeEnv: NODE_ENV
  },
  jwt: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRATION
  },
  aws: {
    bucketName: S3_BUCKET,
    region: BUCKET_REGION,
    secret: AWS_SECRET_ACCESS_KEY,
    accessKey: AWS_ACCESS_KEY_ID
  },
  redis: {
    host: REDIS_HOST,
    port: +REDIS_PORT,
    username: REDIS_USER,
    password: REDIS_PASS
  },
  smsService: {
    user: SMS_USER,
    key: SMS_KEY,
    pass: SMS_PASS,
    sender: SMS_SENDER,
    newUser: NEW_SMS_USER,
    newToken: NEW_SMS_TOKEN
  },
  whatsapp: {
    accountId: WA_ACCOUNT_ID,
    accountToken: WA_ACCOUNT_TOKEN
  },
  email: {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    user: EMAIL_USER,
    pass: EMAIL_PASS,
    from: EMAIL_FROM,
    resendToken: RESEND_EMAIL_TOKEN
  },
  rateLimit: {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS
  },
  logLevel: LOG_LEVEL
};