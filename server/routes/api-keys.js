import express from 'express';
import { checkCookies } from '../middlewares/auth.middleware.js';
import {
  handleCreateApiKey,
  handleListApiKeys,
  handleRevokeApiKey,
  handleGetApiKeyStats,
} from '../controllers/api-key.controllers.js';

const router = express.Router();

// All API key management requires admin cookie auth
// IMPORTANT: /stats must come before /:keyId to avoid route conflict
router.get('/stats', checkCookies, handleGetApiKeyStats);
router.post('/', checkCookies, handleCreateApiKey);
router.get('/', checkCookies, handleListApiKeys);
router.delete('/:keyId', checkCookies, handleRevokeApiKey);

export default router;
