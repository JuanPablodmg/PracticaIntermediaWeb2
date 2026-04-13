import { AppError } from '../utils/AppError.js';

export const authorize = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Acceso restringido a: ${roles.join(', ')}`));
    }
    next();
  };
