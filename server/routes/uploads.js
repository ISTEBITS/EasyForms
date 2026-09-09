import express from 'express';
import rateLimit from 'express-rate-limit';

import {
  handleUploadFile,
  handleGetMediaLibrary,
  handleDeleteMedia,
} from '../controllers/upload.controllers.js';
import upload from '../config/multer.config.js';
import { checkCookies } from '../middlewares/auth.middleware.js';
import { authenticateApiKey } from '../middlewares/api-key.middleware.js';

const router = express.Router();

// Rate limiter for public uploads
const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads. Please try again later.' },
});

// Authenticated upload (cookie auth)
router.post('/', checkCookies, upload.single('file'), handleUploadFile);

// Public upload for SDK (API key auth, rate-limited)
router.post('/public', publicUploadLimiter, authenticateApiKey, upload.single('file'), handleUploadFile);

// Media Library endpoints (Cloudinary management)
router.get('/media', checkCookies, handleGetMediaLibrary);
router.delete('/media', checkCookies, handleDeleteMedia);
router.post('/media/delete', checkCookies, handleDeleteMedia);

export default router;




