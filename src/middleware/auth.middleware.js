import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(payload.id).select('-password -verificationCode');
    if (!user || user.deleted) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token expirado'));
    }
    return next(AppError.unauthorized('Token inválido'));
  }
};
