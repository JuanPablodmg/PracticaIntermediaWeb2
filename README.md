# BildyApp API

API REST para gestión de albaranes — Módulo de usuarios.

## Requisitos

- Node.js 22+
- MongoDB Atlas (o instancia local)

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto 3000) |
| `MONGODB_URI` | URI de conexión a MongoDB Atlas |
| `JWT_SECRET` | Secreto para el access token |
| `JWT_EXPIRES_IN` | Duración del access token (ej. `15m`) |
| `JWT_REFRESH_SECRET` | Secreto para el refresh token |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej. `7d`) |

## Arranque

```bash
# Desarrollo (con --watch y --env-file)
npm run dev

# Producción
npm start
```

## Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/user/register` | Registro de usuario | No |
| PUT | `/api/user/validation` | Verificación del email | JWT |
| POST | `/api/user/login` | Login | No |
| PUT | `/api/user/register` | Datos personales (onboarding) | JWT |
| PATCH | `/api/user/company` | Datos de compañía (onboarding) | JWT |
| PATCH | `/api/user/logo` | Logo de la compañía | JWT |
| GET | `/api/user` | Obtener usuario autenticado | JWT |
| POST | `/api/user/refresh` | Renovar access token | No |
| POST | `/api/user/logout` | Cerrar sesión | JWT |
| DELETE | `/api/user` | Eliminar usuario (`?soft=true`) | JWT |
| PUT | `/api/user/password` | Cambiar contraseña | JWT |
| POST | `/api/user/invite` | Invitar compañero (solo admin) | JWT |

## Testing

Usa el fichero `endpoints.http` con la extensión REST Client de VS Code o importa los ejemplos en Thunder Client / Postman.

El código de verificación de 6 dígitos se imprime por consola al registrarse (en producción se enviaría por email).

## Estructura

```
src/
├── config/         # Configuración centralizada
├── controllers/    # Lógica de negocio
├── middleware/     # Auth, roles, validación, Multer, errores
├── models/         # Modelos Mongoose (User, Company)
├── routes/         # Definición de rutas
├── services/       # EventEmitter de notificaciones
├── utils/          # AppError
└── validators/     # Esquemas Zod
```
