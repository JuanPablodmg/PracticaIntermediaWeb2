export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'No autorizado', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Acceso denegado', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Recurso no encontrado', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static tooManyRequests(message = 'Demasiados intentos', code = 'TOO_MANY_REQUESTS') {
    return new AppError(message, 429, code);
  }

  static internal(message = 'Error interno del servidor', code = 'INTERNAL_ERROR') {
    return new AppError(message, 500, code);
  }
}
