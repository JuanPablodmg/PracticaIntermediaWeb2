export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';
  const code = err.code || 'INTERNAL_ERROR';

  if (!err.isOperational) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({ ok: false, code, message });
};
