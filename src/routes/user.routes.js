import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.js';
import {
  register,
  validateEmail,
  login,
  updatePersonalData,
  updateCompany,
  uploadLogo,
  getUser,
  refresh,
  logout,
  deleteUser,
  changePassword,
  inviteUser,
} from '../controllers/user.controller.js';
import {
  registerSchema,
  validationSchema,
  loginSchema,
  personalDataSchema,
  companySchema,
  passwordSchema,
  inviteSchema,
  refreshSchema,
} from '../validators/user.validator.js';

const router = Router();

// Auth
router.post('/register', validate(registerSchema), register);
router.put('/validation', authenticate, validate(validationSchema), validateEmail);
router.post('/login', validate(loginSchema), login);

// Session
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);

// Onboarding
router.put('/register', authenticate, validate(personalDataSchema), updatePersonalData);
router.patch('/company', authenticate, validate(companySchema), updateCompany);

// Logo
router.patch('/logo', authenticate, upload.single('logo'), uploadLogo);

// Profile
router.get('/', authenticate, getUser);
router.delete('/', authenticate, deleteUser);
router.put('/password', authenticate, validate(passwordSchema), changePassword);

// Invite
router.post('/invite', authenticate, authorize('admin'), validate(inviteSchema), inviteUser);

export default router;
