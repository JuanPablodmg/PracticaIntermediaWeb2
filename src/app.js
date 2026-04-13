import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, code: 'RATE_LIMIT', message: 'Demasiadas solicitudes, inténtalo más tarde' },
  })
);

// ── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// ── Archivos estáticos (logos) ────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/user', userRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Ruta no encontrada' });
});

// ── Error handler centralizado ────────────────────────────────────────────────
app.use(errorHandler);

export default app;
