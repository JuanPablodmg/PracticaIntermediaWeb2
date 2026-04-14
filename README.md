# BildyApp API

API REST para gestión de usuarios y compañías. Construida con Node.js, Express 5, MongoDB y JWT.

---

## Requisitos

- Node.js 18 o superior
- MongoDB (local o Atlas)

---

## Instalación

```bash
git clone https://github.com/JuanPablodmg/PracticaIntermediaWeb2.git
cd PracticaIntermediaWeb2
npm install
```

Crea un fichero `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bildyapp
JWT_SECRET=tu_secreto_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=tu_refresh_secreto_aqui
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Arrancar el servidor

```bash
# Desarrollo (reinicio automático al guardar)
npm run dev

# Producción
npm start
```

El servidor queda disponible en `http://localhost:3000`.

---

## Flujo de uso

El uso normal de la API sigue estos pasos en orden:

```
1. Registrarse          POST  /api/user/register
2. Iniciar sesión       POST  /api/user/login
3. Verificar email      PUT   /api/user/validation
4. Añadir datos         PUT   /api/user/register
5. Crear compañía       PATCH /api/user/company
6. Subir logo           PATCH /api/user/logo
```

---

## Endpoints

### Autenticación

#### `POST /api/user/register` — Registrar usuario

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123"
}
```

**Respuesta exitosa (201):**
```json
{
  "ok": true,
  "user": { "email": "usuario@ejemplo.com", "status": "pending", "role": "admin" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

> El código de verificación de 6 dígitos se imprime en la consola del servidor. En producción se enviaría por email.

---

#### `POST /api/user/login` — Iniciar sesión

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "user": { "email": "usuario@ejemplo.com", "status": "pending", "role": "admin" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### `PUT /api/user/validation` — Verificar email

Requiere `Authorization: Bearer <accessToken>`.

**Body:**
```json
{
  "code": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "message": "Email verificado correctamente"
}
```

> El usuario tiene 3 intentos. Si los agota, debe registrarse de nuevo con otro email.

---

#### `POST /api/user/refresh` — Renovar access token

**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### `POST /api/user/logout` — Cerrar sesión

Requiere `Authorization: Bearer <accessToken>`.

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "message": "Sesión cerrada correctamente"
}
```

---

### Perfil

#### `GET /api/user/` — Obtener perfil

Requiere `Authorization: Bearer <accessToken>`.

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "user": {
    "_id": "...",
    "email": "usuario@ejemplo.com",
    "name": "Juan",
    "lastName": "Pérez",
    "nif": "12345678A",
    "role": "admin",
    "status": "verified",
    "company": { "..." : "..." }
  }
}
```

---

#### `PUT /api/user/register` — Actualizar datos personales

Requiere `Authorization: Bearer <accessToken>`.

**Body:**
```json
{
  "name": "Juan",
  "lastName": "Pérez",
  "nif": "12345678A"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "user": { "..." : "..." }
}
```

---

#### `PUT /api/user/password` — Cambiar contraseña

Requiere `Authorization: Bearer <accessToken>`.

**Body:**
```json
{
  "currentPassword": "MiPassword123",
  "newPassword": "NuevoPassword456"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "message": "Contraseña actualizada correctamente"
}
```

---

#### `DELETE /api/user/` — Eliminar cuenta

Requiere `Authorization: Bearer <accessToken>`.

| Query param | Valor | Efecto |
|---|---|---|
| `soft` | `true` | Marca el usuario como eliminado (recuperable) |
| `soft` | `false` o ausente | Elimina el usuario permanentemente |

**Ejemplo soft delete:**
```
DELETE /api/user/?soft=true
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "message": "Usuario eliminado (soft delete)"
}
```

---

### Compañía

#### `PATCH /api/user/company` — Registrar compañía

Requiere `Authorization: Bearer <accessToken>`.

**Opción A — Empresa:**
```json
{
  "isFreelance": false,
  "name": "Mi Empresa S.L.",
  "cif": "B12345678",
  "address": {
    "street": "Calle Mayor",
    "number": "10",
    "postal": "28001",
    "city": "Madrid",
    "province": "Madrid"
  }
}
```

**Opción B — Autónomo** (usa los datos personales del usuario, requiere tener NIF):
```json
{
  "isFreelance": true
}
```

> Si el CIF ya existe en la base de datos, el usuario se une a esa compañía con rol `guest`.

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "company": { "..." : "..." }
}
```

---

#### `PATCH /api/user/logo` — Subir logo de compañía

Requiere `Authorization: Bearer <accessToken>` y tener compañía registrada.

Enviar como `multipart/form-data` con el campo `logo`.

**Ejemplo con curl:**
```bash
curl -X PATCH http://localhost:3000/api/user/logo \
  -H "Authorization: Bearer <accessToken>" \
  -F "logo=@/ruta/a/imagen.png"
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "logo": "http://localhost:3000/uploads/imagen.png"
}
```

> Tamaño máximo: 5 MB.

---

### Invitaciones (solo admin)

#### `POST /api/user/invite` — Invitar usuario a la compañía

Requiere `Authorization: Bearer <accessToken>` y rol `admin`.

**Body:**
```json
{
  "email": "nuevo@ejemplo.com",
  "password": "Password123",
  "name": "Ana",
  "lastName": "García"
}
```

**Respuesta exitosa (201):**
```json
{
  "ok": true,
  "user": { "email": "nuevo@ejemplo.com", "role": "guest", "status": "pending" }
}
```

---

## Tabla de endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/user/register` | Registro de usuario | No |
| POST | `/api/user/login` | Login | No |
| PUT | `/api/user/validation` | Verificación del email | JWT |
| POST | `/api/user/refresh` | Renovar access token | No |
| POST | `/api/user/logout` | Cerrar sesión | JWT |
| GET | `/api/user/` | Obtener perfil | JWT |
| PUT | `/api/user/register` | Actualizar datos personales | JWT |
| PUT | `/api/user/password` | Cambiar contraseña | JWT |
| DELETE | `/api/user/` | Eliminar cuenta | JWT |
| PATCH | `/api/user/company` | Registrar compañía | JWT |
| PATCH | `/api/user/logo` | Subir logo | JWT |
| POST | `/api/user/invite` | Invitar usuario (solo admin) | JWT |

---

## Roles

| Rol | Descripción |
|---|---|
| `admin` | Crea o es propietario de una compañía. Puede invitar usuarios. |
| `guest` | Invitado o unido a una compañía existente. Sin permisos de invitación. |

---

## Errores comunes

| Código | Significado |
|---|---|
| `UNAUTHORIZED` | Token inválido, expirado o no proporcionado |
| `BAD_REQUEST` | Datos incorrectos o validación fallida |
| `CONFLICT` | El email ya está registrado |
| `TOO_MANY_REQUESTS` | Intentos de verificación agotados o rate limit alcanzado |
| `NOT_FOUND` | Ruta no encontrada |
| `RATE_LIMIT` | Demasiadas peticiones (límite: 100 cada 15 minutos) |

---

## Seguridad

- Contraseñas hasheadas con **bcrypt** (12 rondas)
- Tokens **JWT** con expiración de 15 minutos (access) y 7 días (refresh)
- Cabeceras de seguridad con **Helmet**
- Sanitización de inputs con **express-mongo-sanitize**
- Rate limiting: 100 peticiones por IP cada 15 minutos

---

## Estructura del proyecto

```
src/
├── config/         # Configuración centralizada (puerto, MongoDB, JWT)
├── controllers/    # Lógica de negocio de cada endpoint
├── middleware/     # Auth, roles, validación, subida de ficheros, errores
├── models/         # Modelos Mongoose (User, Company)
├── routes/         # Definición de rutas
├── services/       # EventEmitter de notificaciones
├── utils/          # AppError (errores personalizados)
└── validators/     # Esquemas de validación con Zod
```
