import multer from 'multer';
import path from 'path';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.dest),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Solo se permiten imágenes (jpeg, png, webp, gif)'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter,
});
