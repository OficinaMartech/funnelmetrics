import express from 'express';
import { 
  login, 
  register, 
  getMe, 
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import Joi from 'joi';

const router = express.Router();

// Validação de usuário
const userValidation = {
  register: Joi.object({
    name: Joi.string().required().min(3).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6)
  }),
  updateProfile: Joi.object({
    name: Joi.string().min(3).max(50),
    email: Joi.string().email()
  }),
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(6)
  })
};

// Rotas públicas
router.post('/login', login);
router.post('/register', validate(userValidation.register), register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);
router.get('/logout', logout);

// Rotas protegidas
router.use(protect);
router.get('/me', getMe);
router.put('/update-profile', validate(userValidation.updateProfile), updateProfile);
router.put('/change-password', validate(userValidation.changePassword), changePassword);

export default router;