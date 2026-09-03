import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/connectDB.js';
import AuthRoute from './routes/auth.js';
import UploadRoute from './routes/uploads.js';
import FormRoute from './routes/forms.js';
import ApiKeyRoute from './routes/api-keys.js';
import MailRoute from './routes/mail.routes.js';
import { seedDefaultTemplates } from './services/mail.service.js';



const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (server-to-server, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins (existing EasyForms SPA)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any origin — SDK embeds from third-party sites authenticate via API key,
    // not cookies. Cookie auth (credentials: true) only works for allowedOrigins.
    // SDK consumers use Bearer token auth which doesn't need cookies.
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static(path.join(import.meta.dirname, 'uploads')));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: "Too many upload requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, AuthRoute);
app.use('/api/upload', uploadLimiter, UploadRoute);
app.use('/api/forms', apiLimiter, FormRoute);
app.use('/api/api-keys', apiLimiter, ApiKeyRoute);
app.use('/api/admin/mail', apiLimiter, MailRoute);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: !isProduction ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();
    await seedDefaultTemplates();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
